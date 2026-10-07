import { getNovelChapter, getNovelHostKeyFromLink } from '../APIs';
import { loadVerifiedChapter } from '../Utils/OfflineStorage';
import { getChapterText } from './chapterText';

// Chapter text for narration outside the reader: saved text first, then the
// source. Sources that need the interactive reader (WTR-Lab extraction,
// challenge pages) are reported, never guessed. Resolves { text, data }.
export async function loadNarrationChapter(
  novelLink,
  chapterLink,
  number,
  { beforeNetwork } = {},
) {
  const saved = await loadVerifiedChapter(novelLink, chapterLink, number);
  if (saved) {
    return { text: saved.text, data: saved, saved: true };
  }
  const hostKey = getNovelHostKeyFromLink(chapterLink);
  if (hostKey === 'wtrlab') {
    throw new Error('Open this chapter in the reader to listen to it.');
  }
  await beforeNetwork?.();
  const data = await getNovelChapter(chapterLink, hostKey);
  const text = getChapterText(data);
  if (!text) {
    throw new Error('Chapter text is unavailable. Open it in the reader.');
  }
  return { text, data, saved: false };
}
