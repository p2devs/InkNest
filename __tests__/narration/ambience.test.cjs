const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextAmbience } = require('../../src/Screens/Novel/Narration/ambience');

test('ambience changes only after the same cue on two consecutive segments', () => {
  let state = { current: 'silence', candidate: null };
  state = nextAmbience(state, 'rain');
  assert.equal(state.current, 'silence');
  state = nextAmbience(state, 'forest');
  assert.equal(state.current, 'silence', 'a different cue restarts the wait');
  state = nextAmbience(state, 'forest');
  assert.equal(state.current, 'forest');
  state = nextAmbience(state, 'forest');
  assert.deepEqual(state, { current: 'forest', candidate: null });
});
