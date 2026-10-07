const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createNarrationSession,
} = require('../../src/Screens/Novel/Narration/narrationSession');
const chapter = {
  key: 'one',
  text: 'First paragraph.\n\nSecond paragraph.',
  language: 'en',
};
const audio = text => ({ path: `/${text}.caf`, bytes: 100, duration: 2 });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('plays segments in order, ignores duplicate callbacks, pauses, resumes and finishes', async () => {
  const calls = [];
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: async text => {
      calls.push(text);
      return audio(text);
    },
  });
  await session.start(chapter, 'voice');
  const first = session.getSnapshot().file;
  session.pause();
  await session.ended(first);
  assert.equal(session.getSnapshot().status, 'paused');
  await session.resume();
  await session.ended(first);
  await session.ended(first);
  assert.deepEqual(calls, ['First paragraph.', 'Second paragraph.']);
  await session.ended(session.getSnapshot().file);
  assert.equal(session.getSnapshot().status, 'finished');
  assert.equal(session.getSnapshot().file, null);
});

test('replacement waits for cancelled synthesis; stale output cannot become playback', async () => {
  let finishFirst;
  let calls = 0;
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: text => {
      calls += 1;
      return calls === 1
        ? new Promise(resolve => {
            finishFirst = resolve;
          })
        : Promise.resolve(audio(text));
    },
  });
  const first = session.start(chapter, 'voice');
  await tick();
  const second = session.start(
    { ...chapter, key: 'two', text: 'Replacement.' },
    'voice',
  );
  await tick();
  assert.equal(calls, 1);
  finishFirst(audio('old'));
  await Promise.all([first, second]);
  assert.equal(session.getSnapshot().file.path, '/Replacement..caf');
  assert.equal(session.getSnapshot().chapterKey, 'two');
});

test('deletion waits for output cleanup and stop during scene analysis prevents speech', async () => {
  let finishScene;
  let deleted = false;
  let synthesized = false;
  const session = createNarrationSession({
    cancel: async () => {},
    sceneCue: () =>
      new Promise(resolve => {
        finishScene = resolve;
      }),
    synthesize: async () => {
      synthesized = true;
      return audio('unused');
    },
    clearAudio: async () => {
      deleted = true;
    },
  });
  const start = session.start(chapter, 'voice', true);
  await tick();
  const clear = session.clearAudio();
  assert.equal(deleted, false);
  finishScene('rain');
  await Promise.all([start, clear]);
  assert.equal(synthesized, false);
  assert.equal(deleted, true);
  assert.equal(session.getSnapshot().file, null);
});

test('prepares the next segment during playback and plays it without waiting', async () => {
  const calls = [];
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: async text => {
      calls.push(text);
      return audio(text);
    },
  });
  await session.start(chapter, 'voice');
  await tick();
  assert.deepEqual(calls, ['First paragraph.', 'Second paragraph.']);
  session.ended(session.getSnapshot().file);
  // Switch is synchronous: no 'preparing' gap between segments.
  assert.equal(session.getSnapshot().status, 'playing');
  assert.equal(session.getSnapshot().file.path, '/Second paragraph..caf');
});

test('failed look-ahead does not interrupt playback and is retried when needed', async () => {
  let failNext = false;
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: async text => {
      if (failNext) {
        failNext = false;
        throw new Error('busy');
      }
      failNext = true;
      return audio(text);
    },
  });
  await session.start(chapter, 'voice');
  await tick();
  assert.equal(session.getSnapshot().status, 'playing');
  await session.ended(session.getSnapshot().file);
  assert.equal(session.getSnapshot().file.path, '/Second paragraph..caf');
});

test('in background, an unprepared next segment pauses instead of synthesizing silently', async () => {
  let release;
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: text =>
      text.startsWith('First')
        ? Promise.resolve(audio(text))
        : new Promise(resolve => {
            release = () => resolve(audio(text));
          }),
  });
  await session.start(chapter, 'voice');
  await tick();
  session.ended(session.getSnapshot().file, false);
  assert.equal(session.getSnapshot().status, 'paused');
  assert.equal(session.getSnapshot().index, 1);
  release();
  await tick();
  await session.resume();
  assert.equal(session.getSnapshot().status, 'playing');
});

test('bookmarks resume by paragraph and are discarded when the text changes', async () => {
  const saved = new Map();
  const store = {
    get: key => saved.get(key) ?? null,
    set: (key, value) => saved.set(key, value),
    delete: key => saved.delete(key),
  };
  const calls = [];
  const session = createNarrationSession(
    {
      cancel: async () => {},
      synthesize: async text => {
        calls.push(text);
        return audio(text);
      },
    },
    store,
  );
  const snapshot = { ...chapter, revision: 'r1' };
  await session.start(snapshot, 'voice', false, 1);
  assert.equal(calls[0], 'Second paragraph.');
  assert.equal(session.paragraphIndex(), 1);
  assert.equal(session.bookmark(snapshot), 1);
  assert.equal(session.bookmark({ ...snapshot, revision: 'r2' }), null);
  assert.equal(saved.size, 0);
  await session.start(snapshot, 'voice');
  await tick();
  session.ended(session.getSnapshot().file);
  await session.ended(session.getSnapshot().file);
  assert.equal(session.getSnapshot().status, 'finished');
  assert.equal(session.bookmark(snapshot), null);
  assert.equal(session.listened(snapshot), true);
  assert.equal(session.listened({ ...snapshot, revision: 'r2' }), false);
});

test('changing the narrator restarts from the paragraph being spoken', async () => {
  const calls = [];
  const session = createNarrationSession({
    cancel: async () => {},
    synthesize: async (text, voice) => {
      calls.push(`${voice}:${text}`);
      return audio(text);
    },
  });
  await session.start({ ...chapter, route: { chapterLink: 'x' } }, 'a');
  await tick();
  session.ended(session.getSnapshot().file);
  assert.equal(session.paragraphIndex(), 1);
  await session.changeVoice('b');
  assert.equal(session.getSnapshot().voiceID, 'b');
  assert.equal(session.getSnapshot().route.chapterLink, 'x');
  assert.equal(calls.at(-1), 'b:Second paragraph.');
});
