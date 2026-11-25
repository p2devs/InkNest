/**
 * Comic book page parsing utilities
 */
import {getComicSourceKey, resolveComicUrl} from '../../../Utils/APIs';
import {ComicIssuePageClasses} from '../../../Screens/Comic/APIs/constance';

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
