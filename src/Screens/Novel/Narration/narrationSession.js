const { segmentChapter } = require('./chapterText');
const { ruleCue } = require('./sceneRules');

const noBookmarks = { get: () => null, set: () => {}, delete: () => {} };

// One app-lifetime owner. Native requests stay serialized even after cancellation.
// While a segment plays, the next one is prepared so playback has no gaps.
function createNarrationSession(engine, bookmarks = noBookmarks) {
  let state = { status: 'idle', file: null, message: '', index: 0, count: 0 };
  let generation = 0;
  let queue = Promise.resolve();
  let chapter;
  let segments = [];
  let voiceID;
  let sceneAnalysis = false;
  let ready = null; // prepared file for a segment that has not started yet
  let inFlight = -1; // segment index being synthesized
  const listeners = new Set();
  const publish = changes => {
    state = { ...state, ...changes };
    listeners.forEach(listener => listener());
  };
  const cancel = () => {
    generation += 1;
    ready = null;
    inFlight = -1;
    const cancelled = engine.cancel().catch(() => {});
    queue = Promise.all([queue, cancelled]).then(() => {});
  };
  const enqueue = (token, operation, onError) => {
    queue = queue.then(async () => {
      if (token !== generation) {
        return;
      }
      try {
        await operation();
      } catch (error) {
        if (token === generation) {
          onError(error);
        }
      }
    });
    return queue;
  };
  const play = file => {
    publish({
      status: 'playing',
      file,
      index: file.index,
      cue: file.cue,
      message: '',
    });
    bookmarks.set(chapter.key, {
      revision: chapter.revision,
      paragraphIndex: segments[file.index].paragraphIndex,
    });
    if (file.index + 1 < segments.length) {
      fetchSegment(file.token, file.index + 1);
    }
  };
  // Waiting means the listener is blocked on this segment.
  const waitingFor = index =>
    state.status === 'preparing' && state.index === index;
  const fetchSegment = (token, index) => {
    inFlight = index;
    return enqueue(
      token,
      async () => {
        const segment = segments[index];
        // 'apple' asks Foundation Models; 'rules' uses on-device text rules.
        let cue = 'silence';
        if (sceneAnalysis === 'rules') {
          cue = ruleCue(segment.text);
        } else if (sceneAnalysis) {
          cue = await engine.sceneCue(segment.text, chapter.language);
        }
        if (token !== generation) {
          return;
        }
        const file = await engine.synthesize(segment.spoken, voiceID);
        if (token !== generation) {
          return;
        }
        if (
          !file.path ||
          !Number.isFinite(file.bytes) ||
          file.bytes <= 0 ||
          !Number.isFinite(file.duration) ||
          file.duration <= 0
        ) {
          throw new Error(
            'The voice returned invalid audio. Try another installed voice.',
          );
        }
        inFlight = -1;
        const prepared = { ...file, token, index, cue };
        if (waitingFor(index)) {
          play(prepared);
        } else {
          ready = prepared;
        }
      },
      error => {
        inFlight = -1;
        // A failed look-ahead is retried when its segment is actually needed.
        if (waitingFor(index)) {
          publish({
            status: 'error',
            file: null,
            message: error.message || 'Unable to prepare this voice.',
          });
        }
      },
    );
  };
  // Plays `index` now if prepared, otherwise waits for (or starts) its synthesis.
  const advance = index => {
    if (ready?.index === index) {
      const file = ready;
      ready = null;
      play(file);
      return queue;
    }
    publish({ status: 'preparing', file: null, index, message: '' });
    return inFlight === index ? queue : fetchSegment(generation, index);
  };
  const stop = () => {
    cancel();
    publish({ status: 'idle', file: null, message: '' });
    return queue;
  };
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Paragraph to resume from, or null when absent, finished or the text has changed.
    bookmark(snapshot) {
      const saved = bookmarks.get(snapshot.key);
      if (saved && saved.revision === snapshot.revision) {
        return saved.completed ? null : saved.paragraphIndex;
      }
      if (saved) {
        bookmarks.delete(snapshot.key);
      }
      return null;
    },
    // True once this exact text was listened to the end.
    listened(snapshot) {
      const saved = bookmarks.get(snapshot.key);
      return !!saved?.completed && saved.revision === snapshot.revision;
    },
    start(snapshot, voice, analyzeScenes = false, fromParagraph = 0) {
      stop();
      chapter = snapshot;
      segments = segmentChapter(snapshot.text);
      voiceID = voice;
      sceneAnalysis = analyzeScenes;
      const first = Math.max(
        0,
        segments.findIndex(segment => segment.paragraphIndex >= fromParagraph),
      );
      if (!segments.length) {
        return Promise.resolve();
      }
      publish({
        status: 'preparing',
        file: null,
        chapterKey: snapshot.key,
        // Where the reader for this chapter lives (mini-player, auto-advance).
        route: snapshot.route || null,
        label: snapshot.label || 'Novel narration',
        voiceID: voice,
        sceneAnalysis: analyzeScenes,
        index: first,
        count: segments.length,
        cue: 'silence',
        message: '',
      });
      return fetchSegment(generation, first);
    },
    stop,
    // Shows a message without changing playback (e.g. auto-advance failed).
    notify: message => publish({ message }),
    paragraphIndex: () => segments[state.index]?.paragraphIndex ?? -1,
    // New narrator: restart from the paragraph being spoken.
    changeVoice(voice) {
      if (!['playing', 'preparing', 'paused', 'error'].includes(state.status)) {
        return queue;
      }
      return this.start(
        chapter,
        voice,
        sceneAnalysis,
        segments[state.index].paragraphIndex,
      );
    },
    pause() {
      if (state.status === 'playing') {
        publish({ status: 'paused' });
      } else if (state.status === 'preparing') {
        cancel();
        publish({ status: 'paused', file: null });
      }
    },
    resume() {
      if (state.status !== 'paused' && state.status !== 'error') {
        return queue;
      }
      if (state.file) {
        publish({ status: 'playing' });
        return queue;
      }
      return advance(state.index);
    },
    // `canPrepare` is false when nothing may be synthesized (e.g. app in background).
    ended(file, canPrepare = true) {
      if (
        state.file !== file ||
        !['playing', 'paused'].includes(state.status)
      ) {
        return queue;
      }
      const next = state.index + 1;
      if (next >= segments.length) {
        // Listening is complete only after the final sample played.
        bookmarks.set(chapter.key, {
          revision: chapter.revision,
          paragraphIndex: 0,
          completed: true,
        });
        publish({ status: 'finished', file: null });
        return queue;
      }
      if (state.status === 'paused' || (!canPrepare && ready?.index !== next)) {
        publish({
          status: 'paused',
          file: null,
          index: next,
          message: canPrepare ? '' : 'Open InkNest to continue narration.',
        });
        return queue;
      }
      return advance(next);
    },
    playbackFailed(file) {
      if (state.file === file) {
        publish({
          status: 'error',
          file: null,
          message: 'Audio playback failed. Retry or choose another voice.',
        });
      }
    },
    clearAudio() {
      stop();
      const token = generation;
      publish({
        status: 'clearing',
        message: 'Deleting temporary narration audio…',
      });
      return enqueue(
        token,
        async () => {
          await engine.clearAudio();
          if (token === generation) {
            publish({
              status: 'idle',
              message: 'Temporary narration audio deleted.',
            });
          }
        },
        error => publish({ status: 'idle', message: error.message }),
      );
    },
  };
}

module.exports = { createNarrationSession };
