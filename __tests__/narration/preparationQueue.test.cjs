const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createPreparationQueue,
  readyChapters,
} = require('../../src/Screens/Novel/Narration/preparationQueue');

const novel = { link: 'https://source/novel', title: 'Novel' };
const chapters = [
  { link: 'https://source/novel/1', number: 1 },
  { link: 'https://source/novel/2', number: 2 },
];
const texts = {
  'https://source/novel/1': 'One a.\n\nOne b.',
  'https://source/novel/2': 'Two a.',
};
const okCaps = {
  voices: [],
  thermalState: 'nominal',
  memoryHeadroomBytes: 0,
  freeBytes: 50e9,
  totalBytes: 100e9,
  lowPowerMode: false,
  charging: true,
  batteryLevel: 0.9,
  audioBytes: 0,
};
const snapshotOf = caps => ({
  compatible: true,
  executionAllowed: true,
  memoryPressure: 'normal',
  memoryHeadroomBytes: caps.memoryHeadroomBytes || Number.MAX_SAFE_INTEGER,
  thermalState: caps.thermalState,
  lowPowerMode: caps.lowPowerMode,
  charging: caps.charging,
  batteryLevel: caps.batteryLevel,
  freeBytes: caps.freeBytes,
  totalBytes: caps.totalBytes,
  reservedBytes: 0,
  audioBytes: caps.audioBytes,
});

function setup(overrides = {}) {
  const saved = { jobs: overrides.initial || [] };
  const synthesized = [];
  let clock = 1000;
  let caps = okCaps;
  const timers = [];
  const queue = createPreparationQueue({
    engine: {
      getCapabilities: async () => caps,
      synthesizeForLater:
        overrides.synthesize ||
        (async text => {
          synthesized.push(text);
          return { path: `/a/${text}.m4a`, bytes: 10, duration: 1 };
        }),
    },
    store: {
      load: () => saved.jobs,
      save: jobs => {
        saved.jobs = JSON.parse(JSON.stringify(jobs));
      },
    },
    loadChapterText: async (job, chapter) => {
      if (!texts[chapter.link]) {
        throw new Error('offline');
      }
      return texts[chapter.link];
    },
    fileExists: overrides.fileExists || (async () => true),
    resourceSnapshot: snapshotOf,
    bytesPerSecond: overrides.bytesPerSecond || 8000,
    now: () => clock,
    schedule: fn => timers.push(fn),
    unschedule: () => {},
  });
  return {
    queue,
    saved,
    synthesized,
    timers,
    setCaps: next => {
      caps = { ...okCaps, ...next };
    },
    advance: ms => {
      clock += ms;
    },
  };
}

test('fetches all texts, prepares every segment in order and becomes ready', async () => {
  const { queue, synthesized, saved } = setup();
  queue.add({ novel, chapters, voiceID: 'v' });
  await queue.run();
  assert.deepEqual(synthesized, ['One a.', 'One b.', 'Two a.']);
  const [job] = queue.getSnapshot();
  assert.equal(job.state, 'ready');
  assert.equal(readyChapters(job).length, 2);
  // Story text is dropped once a chapter is fully prepared.
  assert.ok(job.chapters.every(chapter => chapter.text === null));
  assert.equal(saved.jobs[0].state, 'ready');
  assert.ok(job.expiresAt > job.readyAt);
});

test('waits for charging, then needs two safe readings 30 s apart', async () => {
  const { queue, synthesized, timers, setCaps, advance } = setup();
  setCaps({ charging: false });
  queue.add({ novel, chapters: chapters.slice(1), voiceID: 'v' });
  await queue.run();
  assert.equal(queue.getSnapshot()[0].reason, 'waiting-for-charging');
  assert.equal(timers.length, 1);
  setCaps({});
  await queue.run();
  assert.equal(
    synthesized.length,
    0,
    'first safe reading only starts the clock',
  );
  advance(30000);
  await queue.run();
  assert.deepEqual(synthesized, ['Two a.']);
  assert.equal(queue.getSnapshot()[0].state, 'ready');
});

test('restart resumes from the last verified segment without repeating it', async () => {
  let calls = 0;
  const first = setup({
    synthesize: async text => {
      calls += 1;
      if (calls === 2) {
        throw new Error('process died');
      }
      return { path: `/a/${text}`, bytes: 10, duration: 1 };
    },
  });
  first.queue.add({ novel, chapters: chapters.slice(0, 1), voiceID: 'v' });
  await first.queue.run();
  const persisted = first.saved.jobs;
  assert.equal(persisted[0].chapters[0].files.filter(Boolean).length, 1);
  const second = setup({ initial: persisted });
  second.queue.resume(persisted[0].id);
  await second.queue.run();
  assert.deepEqual(second.synthesized, ['One b.']);
  assert.equal(second.queue.getSnapshot()[0].state, 'ready');
});

test('native handoff lists only unprepared segments and merges results', async () => {
  // Synthesis never finishes in the foreground: the app is about to background.
  const { queue } = setup({ synthesize: () => new Promise(() => {}) });
  queue.add({ novel, chapters, voiceID: 'v' });
  for (let i = 0; i < 20; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
  }
  queue.stop();
  const items = queue.pendingItems();
  assert.deepEqual(
    items.map(item => item.text),
    ['One a.', 'One b.', 'Two a.'],
  );
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  queue.applyResults(
    items.map(item => ({
      id: item.id,
      path: `/bg/${item.id}`,
      bytes: 5,
      duration: 1,
    })),
  );
  assert.equal(queue.pendingItems().length, 0);
  assert.equal(queue.getSnapshot()[0].state, 'ready');
});

test('a missing chapter is reported without blocking the others', async () => {
  const { queue } = setup();
  queue.add({
    novel,
    chapters: [...chapters, { link: 'https://source/novel/404', number: 3 }],
    voiceID: 'v',
  });
  await queue.run();
  const [job] = queue.getSnapshot();
  assert.equal(job.state, 'ready');
  assert.equal(job.chapters[2].error, 'offline');
  assert.equal(readyChapters(job).length, 2);
});

test('verify marks purged audio as needing preparation', async () => {
  let present = true;
  const { queue, synthesized } = setup({ fileExists: async () => present });
  queue.add({ novel, chapters: chapters.slice(1), voiceID: 'v' });
  await queue.run();
  present = false;
  await queue.verify();
  const [job] = queue.getSnapshot();
  assert.equal(job.state, 'expired');
  assert.equal(readyChapters(job).length, 0);
  present = true;
  queue.resume(job.id);
  await queue.run();
  assert.deepEqual(synthesized, ['Two a.', 'Two a.']);
  assert.equal(queue.getSnapshot()[0].state, 'ready');
});

test('a range that cannot fit the audio budget fails with a clear reason', async () => {
  const { queue, synthesized } = setup({ bytesPerSecond: 1e9 });
  queue.add({ novel, chapters, voiceID: 'v' });
  await queue.run();
  assert.equal(queue.getSnapshot()[0].reason, 'too-large');
  assert.equal(synthesized.length, 0);
});

test('remove returns the audio paths for deletion; pause stops progress', async () => {
  const { queue, synthesized } = setup();
  const job = queue.add({ novel, chapters: chapters.slice(1), voiceID: 'v' });
  queue.pause(job.id);
  await queue.run();
  assert.equal(synthesized.length, 0);
  queue.resume(job.id);
  await queue.run();
  assert.deepEqual(queue.remove(job.id), ['/a/Two a..m4a']);
  assert.equal(queue.getSnapshot().length, 0);
});

test('verify keeps segments checkpointed while it was checking files', async () => {
  let releaseCheck;
  const gate = new Promise(resolve => {
    releaseCheck = resolve;
  });
  const { queue } = setup({
    synthesize: () => new Promise(() => {}),
    fileExists: async () => {
      await gate;
      return true;
    },
  });
  queue.add({ novel, chapters, voiceID: 'v' });
  for (let i = 0; i < 20; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
  }
  queue.stop();
  const [first] = queue.pendingItems();
  queue.applyResults([
    { id: first.id, path: '/a/first', bytes: 1, duration: 1 },
  ]);
  const checking = queue.verify();
  // A background result lands while verify awaits the file system.
  const [second] = queue.pendingItems();
  queue.applyResults([
    { id: second.id, path: '/a/second', bytes: 1, duration: 1 },
  ]);
  releaseCheck();
  await checking;
  const files = queue.getSnapshot()[0].chapters[0].files;
  assert.deepEqual(
    files.map(file => file?.path),
    ['/a/first', '/a/second'],
  );
});

test('a blocked fetch waits with its reason instead of failing the chapter', async () => {
  const saved = { jobs: [] };
  let wifi = false;
  const queue = createPreparationQueue({
    engine: {
      getCapabilities: async () => okCaps,
      synthesizeForLater: async text => ({
        path: `/a/${text}`,
        bytes: 1,
        duration: 1,
      }),
    },
    store: { load: () => saved.jobs, save: jobs => (saved.jobs = jobs) },
    loadChapterText: async () => {
      if (!wifi) {
        throw Object.assign(new Error('Waiting for Wi-Fi'), {
          waitReason: 'waiting-for-wifi',
        });
      }
      return 'Two a.';
    },
    fileExists: async () => true,
    resourceSnapshot: snapshotOf,
    bytesPerSecond: 8000,
    schedule: () => {},
    unschedule: () => {},
  });
  queue.add({ novel, chapters: chapters.slice(1), voiceID: 'v' });
  await queue.run();
  const [job] = queue.getSnapshot();
  assert.equal(job.reason, 'waiting-for-wifi');
  assert.equal(job.chapters[0].error, null);
  assert.equal(job.wifiOnly, true);
  assert.equal(job.novel.link, novel.link);
  wifi = true;
  queue.resume(job.id);
  await queue.run();
  assert.equal(queue.getSnapshot()[0].state, 'ready');
});
