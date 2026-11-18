/**
 * Comic book page parsing utilities
 */
import {getComicSourceKey, resolveComicUrl} from '../../../Utils/APIs';
import {ComicIssuePageClasses} from '../../../Screens/Comic/APIs/constance';

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

export const getComicReaderUrl = (source, issueUrl) =>
  ComicIssuePageClasses[source]?.allPages
    ? issueUrl.split(/[?#]/)[0].replace(/(?:\/all)?\/?$/, '/all')
    : issueUrl;

export const parseComicIssue = ($, source, pageUrl) => {
  const config = ComicIssuePageClasses[source];
  const images = $(config.images)
    .map((_, el) => {
      const img = $(el);
      return resolveComicUrl(
        img.attr(config.imageAttr || 'src') || img.attr('src'),
        pageUrl,
      );
    })
    .get();
  if (!images.length) throw new Error('This issue has no readable pages.');

  const series = $(config.seriesLink).first();
  const seriesTitle = config.seriesTitle
    ? $(config.seriesTitle).first()
    : series;
  const detailsLink = resolveComicUrl(series.attr('href'), pageUrl);
  if (getComicSourceKey(detailsLink) !== source)
    throw new Error('Could not identify the comic series.');
  return {
    images,
    title: $(config.title).first().text().trim(),
    detailPageTitle:
      (config.seriesTitleAttr && seriesTitle.attr(config.seriesTitleAttr)) ||
      seriesTitle.text().trim(),
    detailsLink,
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
