/**
 * Novel API Exports
 */

export { getNovelHome, getNovelsByGenre, getLatestNovels, getCompletedNovels } from './Home';
export { getNovelDetails, getChapterList } from './Details';
export { getNovelChapter, getMultipleChapters } from './Reader';
export { searchNovels, searchByAuthor } from './Search';
export {
  parseNovelHome,
  parseNovelDetails,
  parseNovelChapter,
  parseSearchResults,
  parseRanking,
} from './novelParser';