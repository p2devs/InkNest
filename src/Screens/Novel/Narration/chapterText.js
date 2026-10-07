const MAX_CHAPTER_CHARACTERS = 500000;

function getChapterText(chapter) {
  if (typeof chapter === 'string') {
    return chapter.replace(/\r\n?/g, '\n').trim();
  }
  if (!chapter || typeof chapter !== 'object') {
    return '';
  }
  if (typeof chapter.text === 'string' && chapter.text.trim()) {
    return getChapterText(chapter.text);
  }
  if (typeof chapter.content === 'string' && chapter.content.trim()) {
    return getChapterText(chapter.content);
  }
  if (Array.isArray(chapter.paragraphs)) {
    return chapter.paragraphs
      .filter(paragraph => typeof paragraph === 'string')
      .map(paragraph => paragraph.trim())
      .filter(Boolean)
      .join('\n\n');
  }
  return '';
}

function getChapterParagraphs(chapter) {
  return getChapterText(chapter)
    .split(/\n\s*\n/)
    .filter(Boolean);
}

// Spaces preserve native selection offsets, including brackets spanning paragraphs.
function getNarrationParagraphs(chapter) {
  let depth = 0;
  return getChapterParagraphs(chapter).map(paragraph =>
    paragraph
      .split('')
      .map(character => {
        if (character === '[') {
          depth += 1;
          return ' ';
        }
        if (character === ']' && depth > 0) {
          depth -= 1;
          return ' ';
        }
        return depth > 0 ? ' ' : character;
      })
      .join(''),
  );
}

// Keep query parameters: they can distinguish translations and chapter revisions.
function narrationKey({
  novelLink,
  chapterLink,
  language = 'en',
  translationMode = 'default',
}) {
  return JSON.stringify([novelLink, chapterLink, language, translationMode]);
}

function createNarrationChapter({
  novelLink,
  chapterLink,
  content,
  language = 'en',
  translationMode = 'default',
}) {
  const text = getChapterText(content);
  if (!novelLink || !chapterLink || !text) {
    throw new Error('Readable chapter text and its source links are required.');
  }
  if (text.length > MAX_CHAPTER_CHARACTERS) {
    throw new Error('This chapter is too large to prepare safely.');
  }
  if (/<(?:!doctype|html|script|body)\b/i.test(text)) {
    throw new Error(
      'The source returned a web page instead of readable chapter text.',
    );
  }
  return {
    key: narrationKey({ novelLink, chapterLink, language, translationMode }),
    revision: textRevision(text),
    novelLink,
    chapterLink,
    language,
    translationMode,
    text,
  };
}

// FNV-1a: detects edited chapter text for bookmarks; not a security hash.
/* eslint-disable no-bitwise */
function textRevision(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return `${text.length}:${(hash >>> 0).toString(16)}`;
}
/* eslint-enable no-bitwise */

// The first segment is short so a chapter starts speaking quickly; the rest
// are longer so there are fewer joins between audio files.
function segmentChapter(text, maxCharacters = 600, firstMaxCharacters = 220) {
  if (
    ![maxCharacters, firstMaxCharacters].every(
      limit => Number.isInteger(limit) && limit >= 32,
    )
  ) {
    throw new Error(
      'Segment size must be an integer of at least 32 characters.',
    );
  }
  const paragraphs = getNarrationParagraphs(text);
  const segments = [];
  paragraphs.forEach((paragraph, paragraphIndex) => {
    let remaining = paragraph.replace(/[ \t]+/g, ' ').trim();
    while (remaining) {
      const limit = segments.length
        ? maxCharacters
        : Math.min(firstMaxCharacters, maxCharacters);
      let end = Math.min(remaining.length, limit);
      if (end < remaining.length) {
        const window = remaining.slice(0, end);
        const sentenceEnds = [...window.matchAll(/[.!?。！？]["'”’]?\s+/g)];
        const sentence = sentenceEnds[sentenceEnds.length - 1];
        const whitespace = window.lastIndexOf(' ');
        if (sentence) {
          end = sentence.index + sentence[0].length;
        } else if (whitespace > 0) {
          end = whitespace;
        } else if (/[\uD800-\uDBFF]/.test(remaining[end - 1])) {
          end -= 1;
        }
      }
      const segment = remaining.slice(0, end).trim();
      const spoken = spokenText(segment);
      if (spoken) {
        segments.push({ paragraphIndex, text: segment, spoken });
      }
      remaining = remaining.slice(end).trim();
    }
  });
  return segments;
}

// Display text stays untouched; bracketed notes and decorative symbols are silent.
function spokenText(text) {
  const spoken = getNarrationParagraphs(text)
    .join('\n\n')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[[\]【】〔〕《》<>]/g, ' ')
    .replace(/[*#_~=|]{2,}/g, ' ')
    .replace(/(^|\s)[*#_~=|](?=\s|$)/g, ' ')
    .replace(/([!?])[!?]+/g, '$1')
    .replace(/\.{3,}|…+/g, '…')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return /[\p{L}\p{N}]/u.test(spoken) ? spoken : '';
}

module.exports = {
  spokenText,
  getChapterText,
  getChapterParagraphs,
  getNarrationParagraphs,
  createNarrationChapter,
  narrationKey,
  segmentChapter,
};
