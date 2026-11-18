/**
 * Data helper utilities for Redux actions
 */

/**
 * Checks if comic data has loaded chapter/issue information
 *
 * @param {Object} data - The comic data to check
 * @returns {boolean} - True if data has chapters or issues
 */
export const hasLoadedChapterData = data => {
  if (!data) {
    return false;
  }
  const hasChapters = Array.isArray(data.chapters) && data.chapters.length > 0;
  const hasIssues = Array.isArray(data.issues) && data.issues.length > 0;
  return hasChapters || hasIssues;
};

/**
 * Builds watched data object for history tracking
 *
 * @param {Object} data - The comic data
 * @param {string} link - The comic link
 * @returns {Object} - Formatted watched data object
 */
export const buildWatchedData = (data, link) => ({
  title: data?.title,
  link,
  image: data?.imgSrc,
  lastOpenAt: new Date().getTime(),
});

/**
 * Normalizes image source URLs
 *
 * @param {string} imgSrc - The image source URL
 * @returns {string} - Normalized image URL
 */
export const normalizeImageUrl = imgSrc => {
  if (!imgSrc) {return imgSrc;}
  if (imgSrc.startsWith('//')) {
    return 'https:' + imgSrc;
  }
  return imgSrc;
};
