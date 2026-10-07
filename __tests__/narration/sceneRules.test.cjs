const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ruleCue } = require('../../src/Screens/Novel/Narration/sceneRules');

test('sustained setting evidence picks a cue', () => {
  assert.equal(
    ruleCue('Rain hammered the roof. The rain did not stop until dawn.'),
    'silence', // second sentence is negated, so only one mention counts
  );
  assert.equal(
    ruleCue('Rain hammered the roof. Rain ran down the windows all night.'),
    'rain',
  );
  assert.equal(
    ruleCue('They walked deeper into the forest. The woods grew quiet.'),
    'forest',
  );
});

test('quotes, memories, negation and metaphors stay silent', () => {
  assert.equal(
    ruleCue(
      '"I remember the rain, the endless rain," she said by the fireplace.',
    ),
    'silence',
  );
  assert.equal(ruleCue('There was no wind. Not a breeze stirred.'), 'silence');
  assert.equal(
    ruleCue(
      'His anger spread like a fire. It burned as if flames lived in him.',
    ),
    'silence',
  );
  assert.equal(ruleCue(''), 'silence');
});
