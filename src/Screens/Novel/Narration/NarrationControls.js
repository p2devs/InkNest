import React from 'react';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hasAmbienceAssets, useNarration } from './NarrationProvider';
import { AMBIENCE_ASSETS } from './ambience';
import { formatBytes } from '../Utils/OfflineStorage';

// Sleep options in cycle order; null is off, 'chapter' stops at its end.
const SLEEP_OPTIONS = [null, 'chapter', 15, 30, 60];
const AMBIENCE_LEVELS = [0, 0.1, 0.2, 0.3];
const AMBIENCE_CUES = ['auto', ...Object.keys(AMBIENCE_ASSETS)];

export default function NarrationControls(props) {
  const narration = useNarration();
  return narration ? (
    <EnabledControls {...props} narration={narration} />
  ) : null;
}

// `reader` comes from useNarrationReader for the chapter on screen.
function EnabledControls({ narration, reader, colors }) {
  const {
    session,
    state,
    capabilities,
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
    clearAllAudio,
  } = narration;
  const voices = capabilities?.voices || [];
  const voiceIndex = Math.max(
    0,
    voices.findIndex(item => item.id === voiceID),
  );
  const voice = voices[voiceIndex];
  const message = !capabilities
    ? 'Checking installed voices…'
    : capabilities.failed
    ? 'Voice information is unavailable. Reopen the reader to retry.'
    : !voices.length
    ? Platform.OS === 'ios'
      ? 'Install an English voice in iOS Spoken Content settings.'
      : 'Install an offline English voice in Android text-to-speech settings.'
    : '';
  // Apple Intelligence when available, otherwise conservative text rules.
  const sceneMode =
    capabilities?.sceneAnalysis === 'available' ? 'apple' : 'rules';

  const active = ['playing', 'preparing', 'paused', 'error'].includes(
    state.status,
  );
  const busy = !voice || state.status === 'clearing';
  const sleepMinutes =
    typeof sleepAt === 'number'
      ? Math.max(1, Math.round((sleepAt - Date.now()) / 60000))
      : null;
  const sleepOption = sleepAt === 'chapter' ? 'chapter' : sleepMinutes;
  // Off → end of chapter → 15 → 30 → 60 → off (a running timer moves to the
  // next longer option).
  const nextSleep =
    sleepOption === null
      ? 'chapter'
      : sleepOption === 'chapter'
      ? 15
      : SLEEP_OPTIONS.find(
          option => typeof option === 'number' && option > sleepOption,
        ) ?? null;
  const sleepLabel =
    sleepOption === null
      ? 'Sleep timer off'
      : sleepOption === 'chapter'
      ? 'Sleep at end of chapter'
      : `Sleep in ${sleepOption} min`;
  const button = (label, action, disabled = false) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={action}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text style={{ color: colors.text }}>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={[styles.panel, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>
        Narration preview · long-press a paragraph to listen from it
      </Text>
      <View style={styles.row}>
        {button(
          voice ? `${voice.name} · ${voice.language}` : 'No voice available',
          () => {
            const next = voices[(voiceIndex + 1) % voices.length].id;
            setVoiceID(next);
            // Mid-chapter: regenerate from the paragraph being spoken.
            if (active) {
              session.changeVoice(next);
            }
          },
          busy || state.status === 'preparing',
        )}
        {button(`${rate}×`, () => setRate(rate >= 1.5 ? 0.75 : rate + 0.25))}
        {active &&
          button(sleepLabel, () =>
            setSleepAt(
              typeof nextSleep === 'number'
                ? Date.now() + nextSleep * 60000
                : nextSleep,
            ),
          )}
        {button(autoAdvance ? 'Auto-advance on' : 'Auto-advance off', () =>
          setAutoAdvance(!autoAdvance),
        )}
        {hasAmbienceAssets &&
          button(
            ambienceGain
              ? `Ambience ${Math.round(ambienceGain * 100)}%`
              : 'Ambience off',
            () =>
              setAmbienceGain(
                AMBIENCE_LEVELS[
                  (AMBIENCE_LEVELS.indexOf(ambienceGain) + 1) %
                    AMBIENCE_LEVELS.length
                ],
              ),
          )}
        {hasAmbienceAssets &&
          ambienceGain > 0 &&
          button(
            ambienceCue === 'auto'
              ? 'Ambience: automatic'
              : `Ambience: ${ambienceCue}`,
            () =>
              setAmbienceCue(
                AMBIENCE_CUES[
                  (AMBIENCE_CUES.indexOf(ambienceCue) + 1) %
                    AMBIENCE_CUES.length
                ],
              ),
          )}
      </View>
      <View style={styles.row}>
        {button('Listen from start', () => reader.start(0), busy)}
        {reader.bookmark !== null &&
          button(
            `Resume at paragraph ${reader.bookmark + 1}`,
            () => reader.start(reader.bookmark),
            busy,
          )}
        {active &&
          button(
            ['paused', 'error'].includes(state.status) ? 'Resume' : 'Pause',
            () =>
              ['paused', 'error'].includes(state.status)
                ? session.resume()
                : session.pause(),
          )}
        {active && button('Stop', () => session.stop())}
        {reader.isThisChapter &&
          !reader.following &&
          button('Follow text', reader.follow)}
        {button(
          capabilities?.audioBytes
            ? `Delete audio (${formatBytes(capabilities.audioBytes)})`
            : 'Delete audio',
          clearAllAudio,
          state.status === 'clearing',
        )}
      </View>
      <View style={styles.row}>
        <Switch
          value={active ? !!state.sceneAnalysis : !!analyzeScenes}
          disabled={active}
          onValueChange={on => setAnalyzeScenes(on ? sceneMode : false)}
          accessibilityLabel="Show scene tags"
        />
        <Text style={{ color: colors.text }}>
          {sceneMode === 'apple'
            ? 'Scene tags (Apple Intelligence)'
            : 'Scene tags (text rules)'}
        </Text>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>
        {message ||
          reader.message ||
          state.message ||
          (active
            ? `${state.label}\n${state.status} · segment ${state.index + 1}/${
                state.count
              }${state.sceneAnalysis ? ` · ${state.cue}` : ''}`
            : state.status === 'finished'
            ? 'Chapter finished.'
            : reader.listened
            ? 'You have listened to this chapter.'
            : 'Audio is temporary and plays on the lock screen.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#667EEA',
    borderRadius: 8,
  },
  disabled: { opacity: 0.45 },
});
