const cheerio = require('cheerio');

const {
  parseWTRLabChapter,
} = require('../src/Redux/Actions/parsers/novelChapterParser');

describe('parseWTRLabChapter', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('parses array-based reader payloads into readable paragraphs', () => {
    const $ = cheerio.load('<html><body></body></html>');

    const result = parseWTRLabChapter(
      $,
      {},
      {
        data: {
          data: {
            body: ['First paragraph', 'Second paragraph'],
          },
        },
      },
      {title: 'Chapter 1'},
    );

    expect(result.title).toBe('Chapter 1');
    expect(result.paragraphs).toEqual([
      'First paragraph',
      'Second paragraph',
    ]);
    expect(result.text).toBe('First paragraph\n\nSecond paragraph');
  });

  it('supports object entries inside array-based reader payloads', () => {
    const $ = cheerio.load('<html><body></body></html>');

    const result = parseWTRLabChapter(
      $,
      {},
      {
        data: {
          data: {
            body: [{text: 'Alpha'}, {content: 'Beta'}],
          },
        },
      },
      {title: 'Chapter 2'},
    );

    expect(result.title).toBe('Chapter 2');
    expect(result.paragraphs).toEqual(['Alpha', 'Beta']);
    expect(result.text).toBe('Alpha\n\nBeta');
  });
});
