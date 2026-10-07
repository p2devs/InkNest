import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { createMMKV } from 'react-native-mmkv';
import analytics from '@react-native-firebase/analytics';
import { navigationRef } from '../../../Navigation/NavigationService';
import { NAVIGATION } from '../../../Constants';
import { createNarrationSession } from './narrationSession';
import { createNarrationChapter } from './chapterText';
import { loadNarrationChapter } from './chapterSource';
import { usePersistentState } from './narrationSettings';
import { createSharedEngine } from './sharedEngine';
import { usePreparation } from './usePreparation';
import { DEFAULT_POLICY } from './resourcePolicy';
import { AMBIENCE_ASSETS, nextAmbience } from './ambience';
import AmbiencePlayer from './AmbiencePlayer';

const NarrationContext = createContext(null);
let bookmarkStore;
const store = () =>
  (bookmarkStore ??= createMMKV({ id: 'novel-narration-bookmarks' }));
// Audio positions are kept apart from visual reading progress.
const bookmarks = {
  get(key) {
    try {
      return JSON.parse(store().getString(key) ?? 'null');
    } catch {
      return null;
    }
  },
  set: (key, value) => store().set(key, JSON.stringify(value)),
  delete: key => store().remove(key),
};
const idle = { status: 'idle', file: null };
const noSubscription = () => () => {};
const idleSnapshot = () => idle;
const ACTIVE = ['playing', 'preparing', 'paused', 'error'];
export const hasAmbienceAssets = Object.keys(AMBIENCE_ASSETS).length > 0;

// Operational events only: never story text, titles or links.
const track = (name, params) => {
  try {
    analytics()
      .logEvent(name, params)
      ?.catch?.(() => {});
  } catch {
    // Analytics must never affect narration.
  }
};

// Played audio expires 24 h after listening instead of 7 days: native cleanup
// expires by modification time, so backdate it by the difference.
const markConsumed = path =>
  RNFS.touch(
    path,
    new Date(
      Date.now() -
        (DEFAULT_POLICY.unplayedRetentionMs -
          DEFAULT_POLICY.consumedRetentionMs),
    ),
  ).catch(() => {});

export function NarrationProvider({ children }) {
  // Narration is always available on iOS and Android.
  const [engine] = useState(() => {
    const native = ['ios', 'android'].includes(Platform.OS)
      ? require('./specs/NativeInkNestNarration').default
      : null;
    return native ? createSharedEngine(native) : null;
  });
  const session = useMemo(
    () => (engine ? createNarrationSession(engine, bookmarks) : null),
    [engine],
  );
  const state = useSyncExternalStore(
    session?.subscribe || noSubscription,
    session?.getSnapshot || idleSnapshot,
  );
  const preparation = usePreparation(engine);
  const [rate, setRate] = usePersistentState('rate', 1);
  const [voiceID, setVoiceID] = usePersistentState('voiceID', null);
  // false, 'apple' (Foundation Models) or 'rules' (text rules).
  const [analyzeScenes, setAnalyzeScenes] = usePersistentState(
    'sceneMode',
    false,
  );
  const [ambienceGain, setAmbienceGain] = usePersistentState('ambienceGain', 0);
  // 'auto' follows scene cues; an asset ID pins that loop until cleared.
  const [ambienceCue, setAmbienceCue] = usePersistentState(
    'ambienceCue',
    'auto',
  );
  // Off by default (plan decision D6): stop at the end of each chapter.
  const [autoAdvance, setAutoAdvance] = usePersistentState(
    'autoAdvance',
    false,
  );
  // Epoch ms, 'chapter' (stop at the end of this chapter), or null.
  const [sleepAt, setSleepAt] = useState(null);
  const [ambience, setAmbience] = useState({
    current: 'silence',
    candidate: null,
  });
  const [capabilities, setCapabilities] = useState(null);
  const progress = useRef(0);

  // Voices, scene analysis and storage; refreshed after audio is deleted.
  const refreshCapabilities = useCallback(() => {
    engine
      ?.getCapabilities('en')
      .then(setCapabilities, () =>
        setCapabilities({ voices: [], failed: true }),
      );
  }, [engine]);
  useEffect(refreshCapabilities, [refreshCapabilities]);
  // Keep the chosen voice valid when voices load or are removed.
  useEffect(() => {
    const voices = capabilities?.voices || [];
    if (voices.length && !voices.some(voice => voice.id === voiceID)) {
      setVoiceID(voices[0].id);
    }
  }, [capabilities, voiceID, setVoiceID]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      // Playing audio continues on the lock screen; preparation without audio does not.
      if (next !== 'active' && session?.getSnapshot().status !== 'playing') {
        session?.pause();
      }
    });
    return () => {
      subscription.remove();
      session?.stop();
    };
  }, [session]);

  // Sleep timer: a JS timer plus a check on every player progress event, since
  // timers can be throttled while the screen is locked.
  const stopForSleep = useCallback(() => {
    setSleepAt(null);
    session?.stop();
  }, [session]);
  useEffect(() => {
    if (typeof sleepAt !== 'number') {
      return undefined;
    }
    const timer = setTimeout(stopForSleep, Math.max(0, sleepAt - Date.now()));
    return () => clearTimeout(timer);
  }, [sleepAt, stopForSleep]);
  // A finished chapter keeps the timer only while auto-advance will continue.
  useEffect(() => {
    const continuing =
      state.status === 'finished' && autoAdvance && sleepAt !== 'chapter';
    if (!ACTIVE.includes(state.status) && !continuing) {
      setSleepAt(null);
    }
  }, [state.status, autoAdvance, sleepAt]);

  // Opt-in auto-advance: after the final sample, continue with the next
  // chapter. In the background only saved text is used, so no network or
  // long synthesis runs without audio; failures stop with a message.
  const advancedFrom = useRef(null);
  useEffect(() => {
    const route = state.route;
    if (
      !session ||
      state.status !== 'finished' ||
      !autoAdvance ||
      sleepAt === 'chapter' ||
      !route?.nextChapterLink ||
      !route.novel?.link ||
      advancedFrom.current === state.chapterKey
    ) {
      return;
    }
    advancedFrom.current = state.chapterKey;
    const number = route.chapter?.number ? route.chapter.number + 1 : null;
    const background = AppState.currentState !== 'active';
    loadNarrationChapter(route.novel.link, route.nextChapterLink, number)
      .then(({ text, data, saved }) => {
        if (background && !saved) {
          throw new Error('open InkNest to continue with the next chapter.');
        }
        if (session.getSnapshot().chapterKey !== state.chapterKey) {
          return; // the listener started something else meanwhile
        }
        const snapshot = createNarrationChapter({
          novelLink: route.novel.link,
          chapterLink: route.nextChapterLink,
          content: text,
          translationMode: route.translationMode,
        });
        const chapter = { link: route.nextChapterLink, number };
        session.start(
          {
            ...snapshot,
            label: [
              route.novel.title,
              data.title || (number && `Chapter ${number}`),
            ]
              .filter(Boolean)
              .join(' · '),
            route: {
              novel: route.novel,
              chapter,
              chapterLink: route.nextChapterLink,
              nextChapterLink: data.nextChapter || null,
              previousChapterLink: route.chapterLink,
              translationMode: route.translationMode,
            },
          },
          state.voiceID,
          state.sceneAnalysis,
        );
        track('narration_auto_advance', { platform: Platform.OS });
      })
      .catch(error =>
        session.notify(`Next chapter unavailable: ${error.message}`),
      );
  }, [
    session,
    state.status,
    state.route,
    state.chapterKey,
    state.voiceID,
    state.sceneAnalysis,
    autoAdvance,
    sleepAt,
  ]);

  // Operational metrics on state changes (no story text).
  const lastStatus = useRef('idle');
  useEffect(() => {
    const previous = lastStatus.current;
    lastStatus.current = state.status;
    if (previous === state.status) {
      return;
    }
    if (state.status === 'preparing' && !ACTIVE.includes(previous)) {
      track('narration_start', {
        platform: Platform.OS,
        scene_mode: String(state.sceneAnalysis || 'off'),
      });
    } else if (state.status === 'finished') {
      track('narration_finished', { platform: Platform.OS });
    } else if (state.status === 'error') {
      track('narration_error', { platform: Platform.OS });
    }
  }, [state.status, state.sceneAnalysis]);

  // Ambience follows segment cues once they are sustained (one observation
  // per segment; pausing and resuming does not count again).
  const listening = ACTIVE.includes(state.status);
  useEffect(() => {
    setAmbience(previous =>
      listening
        ? nextAmbience(previous, state.cue || 'silence')
        : { current: 'silence', candidate: null },
    );
  }, [state.index, state.cue, listening]);

  // Deleting prepared audio first stops playback that is using it.
  const deleteAudio = useCallback(
    async paths => {
      if (paths.includes(session?.getSnapshot().file?.path)) {
        await session.stop();
      }
      await Promise.all(paths.map(path => RNFS.unlink(path).catch(() => {})));
      refreshCapabilities();
      // Other jobs may share these cached segments.
      await preparation?.queue.verify();
    },
    [session, refreshCapabilities, preparation],
  );
  // Deletes all temporary narration audio, then updates prepared readiness.
  const clearAllAudio = useCallback(
    () =>
      session
        ?.clearAudio()
        .then(refreshCapabilities)
        .then(() => preparation?.queue.verify()),
    [session, refreshCapabilities, preparation],
  );

  const value = useMemo(
    () =>
      session
        ? {
            engine,
            session,
            state,
            capabilities,
            refreshCapabilities,
            rate,
            setRate,
            voiceID,
            setVoiceID,
            analyzeScenes,
            setAnalyzeScenes,
            sleepAt,
            setSleepAt,
            ambienceGain,
            setAmbienceGain,
            ambienceCue,
            setAmbienceCue,
            autoAdvance,
            setAutoAdvance,
            preparation,
            deleteAudio,
            clearAllAudio,
          }
        : null,
    [
      engine,
      session,
      state,
      capabilities,
      refreshCapabilities,
      rate,
      voiceID,
      analyzeScenes,
      sleepAt,
      ambienceGain,
      ambienceCue,
      autoAdvance,
      preparation,
      deleteAudio,
      clearAllAudio,
      setRate,
      setVoiceID,
      setAnalyzeScenes,
      setAmbienceGain,
      setAmbienceCue,
      setAutoAdvance,
    ],
  );
  return (
    <NarrationContext.Provider value={value}>
      {children}
      {session && ACTIVE.includes(state.status) && (
        <View style={styles.miniPlayer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open the chapter being narrated"
            disabled={!state.route}
            onPress={() =>
              navigationRef.isReady() &&
              navigationRef.navigate(NAVIGATION.novelReader, {
                novel: state.route.novel,
                chapter: state.route.chapter,
                chapterLink: state.route.chapterLink,
              })
            }
          >
            <Text numberOfLines={2} style={[styles.label, styles.nowPlaying]}>
              {state.label} · {state.status}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Stop narration"
            style={styles.stop}
            onPress={() => session.stop()}
          >
            <Text style={styles.label}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}
      {hasAmbienceAssets && ambienceGain > 0 && (
        <AmbiencePlayer
          cue={ambienceCue === 'auto' ? ambience.current : ambienceCue}
          playing={state.status === 'playing'}
          gain={ambienceGain}
        />
      )}
      {state.file && (
        <Video
          key={`${state.file.token}:${state.index}`}
          source={{
            uri: `file://${state.file.path}`,
            metadata: { title: state.label, artist: 'InkNest narration' },
          }}
          style={styles.audio}
          paused={state.status !== 'playing'}
          rate={rate}
          ignoreSilentSwitch="ignore"
          playInBackground
          playWhenInactive
          showNotificationControls
          preventsDisplaySleepDuringVideoPlayback={false}
          onLoadStart={() => {
            progress.current = 0;
          }}
          onProgress={event => {
            progress.current = event.currentTime;
            if (typeof sleepAt === 'number' && Date.now() >= sleepAt) {
              stopForSleep();
            }
          }}
          // Lock-screen play/pause drives the native player directly.
          onPlaybackStateChanged={({ isPlaying }) => {
            const { status, file } = session.getSnapshot();
            if (isPlaying && status === 'paused') {
              session.resume();
            } else if (
              !isPlaying &&
              status === 'playing' &&
              progress.current < file.duration - 0.5
            ) {
              session.pause();
            }
          }}
          onEnd={() => {
            markConsumed(state.file.path);
            session.ended(state.file, AppState.currentState === 'active');
          }}
          onError={() => session.playbackFailed(state.file)}
          onAudioBecomingNoisy={() => session.pause()}
        />
      )}
    </NarrationContext.Provider>
  );
}

export const useNarration = () => useContext(NarrationContext);
const styles = StyleSheet.create({
  audio: { width: 0, height: 0 },
  miniPlayer: {
    position: 'absolute',
    bottom: 84,
    right: 12,
    backgroundColor: '#25263A',
    paddingLeft: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { color: '#FFFFFF' },
  nowPlaying: { maxWidth: 220 },
  stop: { padding: 12, minHeight: 44 },
});
