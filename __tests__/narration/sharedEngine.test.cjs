const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  createSharedEngine,
} = require('../../src/Screens/Novel/Narration/sharedEngine');

test('one synthesis at a time and live requests jump queued preparation', async () => {
  const order = [];
  let running = 0;
  const releases = [];
  const shared = createSharedEngine({
    synthesize: text =>
      new Promise(resolve => {
        running += 1;
        assert.equal(running, 1, 'never two native requests at once');
        order.push(text);
        releases.push(() => {
          running -= 1;
          resolve({ path: text });
        });
      }),
  });
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const later1 = shared.synthesizeForLater('later-1', 'v');
  const later2 = shared.synthesizeForLater('later-2', 'v');
  await tick();
  const live = shared.synthesize('live', 'v');
  assert.equal(shared.hasLiveDemand(), true);
  releases.shift()();
  await tick();
  releases.shift()();
  await tick();
  releases.shift()();
  await Promise.all([later1, later2, live]);
  assert.deepEqual(order, ['later-1', 'live', 'later-2']);
});

test('a failed request releases the permit', async () => {
  const shared = createSharedEngine({
    synthesize: async text => {
      if (text === 'bad') {
        throw new Error('boom');
      }
      return { path: text };
    },
  });
  await assert.rejects(shared.synthesize('bad', 'v'), /boom/);
  assert.deepEqual(await shared.synthesize('good', 'v'), { path: 'good' });
});
