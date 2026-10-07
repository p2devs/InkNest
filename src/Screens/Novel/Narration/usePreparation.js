import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import {
  initNovelStorage,
  loadNovelMetadata,
  saveChapterContent,
  saveNovelMetadata,
} from '../Utils/OfflineStorage';
import { loadNarrationChapter } from './chapterSource';
import { createPreparationQueue } from './preparationQueue';
import { snapshotFromCapabilities } from './resourcePolicy';

const JOBS_KEY = 'jobs';
let jobStore;
const storage = () =>
  (jobStore ??= createMMKV({ id: 'novel-narration-preparation' }));
const store = {
  load() {
    try {
      const jobs = JSON.parse(storage().getString(JOBS_KEY) ?? '[]');
      return Array.isArray(jobs) ? jobs : [];
    } catch {
      return [];
    }
  },
  save: jobs => storage().set(JOBS_KEY, JSON.stringify(jobs)),
};

// Fetched text is saved as an ordinary offline download, so a prepared
// chapter opens and plays without a network connection.
async function loadChapterText(job, chapter) {
  const { text, data, saved } = await loadNarrationChapter(
    job.novelLink,
    chapter.link,
    chapter.number,
    {
      beforeNetwork: async () => {
        if (job.wifiOnly !== false && (await NetInfo.fetch()).type !== 'wifi') {
          throw Object.assign(new Error('Waiting for Wi-Fi'), {
            waitReason: 'waiting-for-wifi',
          });
        }
      },
    },
  );
  if (!saved && job.novel && Number.isInteger(Number(chapter.number))) {
    await initNovelStorage();
    // Never replace richer metadata from an earlier download.
    if (!(await loadNovelMetadata(job.novelLink))) {
      await saveNovelMetadata(job.novel);
    }
    await saveChapterContent(job.novelLink, chapter.number, {
      ...data,
      link: chapter.link,
    });
  }
  return text;
}

// Stored bytes per second of speech: iOS AAC measured ~15 KB/s on the
// simulator; Android system TTS writes 16-bit mono WAV (~44 KB/s).
const BYTES_PER_SECOND = Platform.OS === 'ios' ? 15000 : 44100;

// App-lifetime prepare-for-later queue (null while narration is disabled).
// In the foreground it runs through the shared engine; on leaving the app the
// remaining segments go to the OS background worker and are collected on return.
export function usePreparation(engine) {
  const queue = useMemo(
    () =>
      engine &&
      createPreparationQueue({
        engine,
        store,
        loadChapterText,
        fileExists: path => RNFS.exists(path),
        resourceSnapshot: snapshotFromCapabilities,
        canRun: () => AppState.currentState === 'active',
        bytesPerSecond: BYTES_PER_SECOND,
      }),
    [engine],
  );
  const jobs = useSyncExternalStore(
    queue?.subscribe || noSubscription,
    queue?.getSnapshot || noJobs,
  );

  useEffect(() => {
    if (!queue) {
      return undefined;
    }
    let returning = Promise.resolve();
    // Collect background results and re-check files on disk, then continue
    // here. The handoff waits only for this, never for the run loop.
    const resume = () => {
      returning = engine
        .collectPreparation()
        .then(json => queue.applyResults(JSON.parse(json || '[]')))
        .catch(() => {})
        .then(() => queue.verify())
        .catch(() => {});
      returning.then(() => queue.run());
    };
    const handOff = () => {
      queue.stop();
      const items = queue.pendingItems();
      if (items.length) {
        returning.then(() =>
          engine
            .schedulePreparation(
              JSON.stringify(items),
              queue.requiresCharging(),
            )
            .catch(() => {}),
        );
      }
    };
    resume();
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active') {
        resume();
      } else if (next === 'background') {
        handOff();
      }
    });
    return () => {
      subscription.remove();
      queue.stop();
    };
  }, [engine, queue]);

  return queue && { queue, jobs };
}

const noSubscription = () => () => {};
const emptyJobs = [];
const noJobs = () => emptyJobs;
