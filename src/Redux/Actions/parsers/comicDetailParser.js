/**
 * Comic detail parsing utilities
 */

import {normalizeImageUrl} from '../utils/dataHelpers';

/**
 * Parses comic details using standard configuration
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} link - Comic URL
 * @returns {Object} - Parsed comic details
 */
export const parseComicDetails = async ($, config, link) => {
  const detailsContainer = $(config.detailsContainer);
  const title = $(config.title).first().text().trim();
  let imgSrc = detailsContainer
    .find(config.imgSrc)
    .attr(config.getImageAttr);
  imgSrc = normalizeImageUrl(imgSrc);

  const genres = parseGenres($, config);
  const details = parseDetailsSection($, detailsContainer, config);
  const summary = config.summary ? $(config.summary).text().trim() : '';

  return {
    title,
    imgSrc,
    type: details.Type || null,
    status: details.Status || null,
    releaseDate: getReleaseDate(details),
    categories: getCategories(details),
    tags: details.Tags || [],
    genres: genres.length > 0 ? genres : details.Genres || [],
    author: details.Author || details.Contributor || null,
    alternativeName: details.Alternative || details['Alternative name'] || null,
    views: details.Views || null,
    rating: details.Rating || null,
    summary,
    link,
    // Additional comicbookplus-specific fields
    publisher: details['Published by'] || null,
    availableBooks: details['Available Books'] || null,
    latestBook: details['Latest Book'] || null,
    externalLinks: details['External Links'] || null,
  };
};

/**
 * Parses genre information from the page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Array} - Array of genre strings
 */
const parseGenres = ($, config) => {
  const genres = [];
  if (config.genre) {
    $(config.genre).each((_, el) => {
      genres.push($(el).text().trim());
    });
  }
  return genres;
};

/**
 * Parses the details section (dl/dt/dd or table structure)
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} detailsContainer - The container element
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed details as key-value pairs
 */
const parseDetailsSection = ($, detailsContainer, config) => {
  const details = {};

  if (!config.detailsDL) {
    return details;
  }

  // Table-based structure (e.g., comicbookplus)
  if (config.detailsValue) {
    detailsContainer.find(config.detailsDL).each((i, el) => {
      const key = $(el).text().trim().replace(':', '');
      const valueCell = $(el).next(config.detailsValue);
      if (valueCell.length) {
        const links = valueCell.find('a');
        if (links.length > 0) {
          const list = [];
          links.each((_, a) => list.push($(a).text().trim()));
          details[key] = list;
        } else {
          details[key] = valueCell.text().trim();
        }
      }
    });
  }
  // Standard dl/dt/dd structure
  else {
    detailsContainer.find(config.detailsDL).each((i, el) => {
      const key = $(el).text().trim().replace(':', '');
      const dd = $(el).next('dd');
      const keyLower = key.toLowerCase();

      if (keyLower === 'tags' || keyLower === 'genres') {
        const list = [];
        dd.find('a').each((_, a) => list.push($(a).text().trim()));
        details[key] = list;
      } else {
        details[key] = dd.text().trim();
      }
    });
  }

  return details;
};

/**
 * Extracts release date from various possible fields
 *
 * @param {Object} details - Parsed details object
 * @returns {string|null} - Release date or null
 */
const getReleaseDate = details => {
  return details.Release
    || details.Released
    || details['Date of release']
    || details['Publication History']
    || null;
};/**
 * Extracts categories from various possible fields
 *
 * @param {Object} details - Parsed details object
 * @returns {string|null} - Categories or null
 */
const getCategories = details => {
  return details.Category
    || details.Categories
    || null;
};
