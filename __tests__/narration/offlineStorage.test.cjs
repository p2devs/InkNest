const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');
const chapterText = require('../../src/Screens/Novel/Narration/chapterText');

test('downloaded API text round-trips with source metadata; legacy wrappers remain readable', async () => {
  const files = new Map();
  const fs = {
    DocumentDirectoryPath: '/documents',
    exists: async name => files.has(name),
    mkdir: async name => files.set(name, ''),
    writeFile: async (name, text) => files.set(name, text),
    readFile: async name => files.get(name),
  };
  const exports = {};
  const { code } = babel.transformFileSync(
    path.resolve('src/Screens/Novel/Utils/OfflineStorage.js'),
  );
  vm.runInNewContext(code, {
    exports,
    console,
    require: name => {
      if (name === '@dr.pogodin/react-native-fs') {
        return fs;
      }
      if (name === '../Narration/chapterText') {
        return chapterText;
      }
      if (name.startsWith('@babel/runtime/')) {
        return require(name);
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const novel = 'https://novelfire.net/book/example';
  const link = `${novel}/chapter-1`;
  assert.equal(
    await exports.saveChapterContent(novel, 1, {
      text: 'First\n\nSecond',
      link,
      nextChapter: { link: `${novel}/chapter-2` },
    }),
    true,
  );
  const saved = await exports.loadChapterContent(novel, 1);
  assert.equal(chapterText.getChapterText(saved), 'First\n\nSecond');
  assert.equal(saved.chapter.link, link);
  assert.equal(saved.novelLink, novel);
  assert.equal(saved.chapter.text, undefined);
  assert.equal(saved.chapter.nextChapter.link, `${novel}/chapter-2`);
  files.set(
    exports.getChapterPath(novel, 2),
    JSON.stringify({ chapterNumber: 2, content: 'Legacy text' }),
  );
  assert.equal(
    chapterText.getChapterText(await exports.loadChapterContent(novel, 2)),
    'Legacy text',
  );
  assert.equal(
    await exports.saveChapterContent(novel, 3, { content: '' }),
    false,
  );
  assert.equal(files.has(exports.getChapterPath(novel, 3)), false);
});
