const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getChapterText,
  createNarrationChapter,
  segmentChapter,
} = require('../../src/Screens/Novel/Narration/chapterText');

test('online and legacy saved chapter formats resolve identical text', () => {
  for (const input of [
    ' First\r\n\r\nSecond ',
    { text: 'First\n\nSecond' },
    { content: 'First\n\nSecond' },
    { paragraphs: ['First', 'Second'] },
  ]) {
    assert.equal(getChapterText(input), 'First\n\nSecond');
  }
  assert.equal(getChapterText({ content: { unexpected: true } }), '');
  assert.equal(getChapterText({ text: '', content: 'Story' }), 'Story');
});

test('chapter identity preserves source and translation query parameters', () => {
  const base = {
    novelLink: 'https://source/book/1',
    chapterLink: 'https://source/1?service=web',
    content: 'Story',
  };
  assert.notEqual(
    createNarrationChapter(base).key,
    createNarrationChapter({
      ...base,
      chapterLink: 'https://source/1?service=ai',
    }).key,
  );
  assert.throws(() =>
    createNarrationChapter({ ...base, content: '<html>Challenge</html>' }),
  );
  assert.throws(() => createNarrationChapter({ ...base, content: '' }));
});

test('bounded segments preserve wording and paragraph order including long tokens', () => {
  const text =
    'Dr. Lee said, “Wait! Is that rain?” Then he ran.\n\n' +
    'a'.repeat(150) +
    ' 🌳 End.';
  const segments = segmentChapter(text, 40);
  assert.ok(segments.every(segment => segment.text.length <= 40));
  assert.equal(
    segments
      .map(segment => segment.text)
      .join('')
      .replace(/\s/g, ''),
    text.replace(/\s/g, ''),
  );
  assert.equal(segments[0].paragraphIndex, 0);
  assert.equal(segments.at(-1).paragraphIndex, 1);
  assert.throws(() => segmentChapter(text, 0));
});

test('text revision changes when wording changes and is stable otherwise', () => {
  const make = content =>
    createNarrationChapter({
      novelLink: 'https://source/book/1',
      chapterLink: 'https://source/1',
      content,
    }).revision;
  assert.equal(make('Story one.'), make({ text: 'Story one.' }));
  assert.notEqual(make('Story one.'), make('Story two.'));
});

test('spoken text skips bracketed content and decorative symbols', () => {
  const {
    spokenText,
  } = require('../../src/Screens/Novel/Narration/chapterText');
  assert.equal(spokenText('[Skill: Blink] acquired!!!'), 'acquired!');
  assert.equal(spokenText('*** Scene break ***'), 'Scene break');
  assert.equal(spokenText('Wait..... what?!?'), 'Wait… what?');
  assert.equal(spokenText('See https://example.com now'), 'See now');
  assert.equal(spokenText('***'), '');
  assert.equal(spokenText('[Only a note]'), '');
  const [segment] = segmentChapter('【System】 Level up!!');
  assert.equal(segment.text, '【System】 Level up!!');
  assert.equal(segment.spoken, 'System Level up!');
});

test('the first segment is short so narration starts quickly', () => {
  const sentence = 'The carriage rocked gently as the train moved on. ';
  const segments = segmentChapter(sentence.repeat(30));
  assert.ok(segments[0].text.length <= 220);
  assert.ok(segments[1].text.length > 220);
  assert.ok(segments.every(segment => segment.text.length <= 600));
});

test('brackets spanning segments and paragraphs are silent without shifting paragraph identity', () => {
  const text =
    'Before [' +
    'hidden '.repeat(100) +
    '\n\n[nested] hidden] After.\n\n[Only a note]\n\nLast.';
  const segments = segmentChapter(text, 40);
  assert.deepEqual(
    segments.map(segment => segment.spoken),
    ['Before', 'After.', 'Last.'],
  );
  assert.deepEqual(
    segments.map(segment => segment.paragraphIndex),
    [0, 1, 3],
  );
  assert.deepEqual(segmentChapter('[Only a note]\n\n***'), []);
  assert.equal(getChapterText(text), text, 'display text remains unchanged');
});
