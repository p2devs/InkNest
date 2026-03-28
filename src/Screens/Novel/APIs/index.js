/**
 * Novel API Exports
 * All functions support optional hostKey parameter (default: 'novelfire')
 */

// Home API
export { getNovelHome, getNovelsByGenre, getLatestNovels, getCompletedNovels } from './Home';

// Details API
export { getNovelDetails, getChapterList, getHostKeyFromLink as getNovelHostKeyFromLink } from './Details';

// Reader API
export { getNovelChapter, getMultipleChapters, getHostKeyFromLink } from './Reader';

// Search API
export { searchNovels, searchByAuthor } from './Search';

// Legacy parsers (kept for backward compatibility)
export {
  parseNovelHome,
  parseNovelDetails,
  parseNovelChapter,
  parseSearchResults,
  parseRanking,
} from './novelParser';

// Source configuration
export { NovelHostName } from '../../../Utils/APIs';
export {
  NovelHomePageClasses,
  NovelDetailPageClasses,
  NovelChapterPageClasses,
  NovelSearchPageClasses,
} from './constance';