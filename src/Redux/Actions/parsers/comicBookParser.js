/**
 * Comic book page parsing utilities
 */

// Host-specific URL transformations
const URL_TRANSFORMATIONS = {
  comichubfree: (url) => `${url}/all`,
};

/**
 * Applies host-specific URL transformations
 *
 * @param {string} url - Original URL
 * @param {string} hostKey - Host identifier
 * @returns {string} - Transformed URL
 */
export const transformComicBookUrl = (url, hostKey) => {
  const transformer = URL_TRANSFORMATIONS[hostKey];
  return transformer ? transformer(url) : url;
};

/**
 * Parses comic book images using standard configuration
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed comic book data
 */
export const parseStandardComicBook = ($, config) => {
  const {
    imageContainer,
    imageSelector,
    imageAttr,
    titleSelector,
    titleAttr,
    detailsLinkSelector,
    detailsLinkAttr = 'href',
  } = config;

  const container = $(imageContainer);
  const imgSources = [];
  let title = '';
  let detailsLink = '';
  let detailPageTitle = '';

  // Extract images
  container.find(imageSelector).each((_, el) => {
    const src = $(el).attr(imageAttr)?.trim();
    if (src) {imgSources.push(src);}
  });

  // Extract title
  title = container.find(titleSelector).first().attr(titleAttr)?.trim() || '';

  // Extract details page link if available
  if (detailsLinkSelector) {
    const detailAnchor = $(detailsLinkSelector).first();
    detailsLink = detailAnchor.attr(detailsLinkAttr)?.trim() || '';
    detailPageTitle = detailAnchor.text().trim() || '';
  }

  return {
    images: imgSources,
    title,
    detailsLink,
    detailPageTitle,
  };
};

/**
 * Parses ComicBookPlus pages that use JavaScript variables
 *
 * @param {string} html - Raw HTML content
 * @param {Object} $ - Cheerio instance
 * @returns {Object} - Parsed comic book data
 */
export const parseComicBookPlusPage = (html, $) => {
  const imgSources = [];
  let detailsLink = '';

  // Get the base image URL from the main comic image
  const mainComicImg = $('#maincomic').attr('src');

  // Extract number of pages from JavaScript variable
  const numPagesMatch = html.match(/comicnumpages\s*=\s*(\d+)/);

  if (mainComicImg && numPagesMatch) {
    const numPages = parseInt(numPagesMatch[1], 10);
    // Get base URL by removing the page number (e.g., /1.jpg -> /)
    const baseUrl = mainComicImg.replace(/\/\d+\.jpg$/, '/');

    // Generate image URLs for all pages (0-indexed)
    for (let i = 0; i < numPages; i++) {
      imgSources.push(`${baseUrl}${i}.jpg`);
    }
  }

  // Get title and details link from page
  const card = $('div.indexcardwrapper');
  const titleLink = card.find('a[href*="?cid="]').first();

  if (titleLink.length) {
    detailsLink = 'https://comicbookplus.com' + titleLink.attr('href');
  }

  return {
    images: imgSources,
    title: '',
    detailsLink,
    detailPageTitle: '',
  };
};

/**
 * Creates the comic book data object
 *
 * @param {Object} parsedData - Parsed data from parser functions
 * @returns {Object} - Complete comic book data object
 */
export const createComicBookData = parsedData => ({
  images: parsedData.images,
  title: parsedData.title,
  lastReadPage: 0,
  BookmarkPages: [],
  detailsLink: parsedData.detailsLink,
  detailPageTitle: parsedData.detailPageTitle,
});
