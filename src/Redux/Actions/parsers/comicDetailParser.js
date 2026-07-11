/**
 * Comic detail parsing utilities
 */

import {normalizeImageUrl} from '../utils/dataHelpers';

/**
 * Custom detail parser for readcomicsonline.ru (2026 redesign — Tailwind layout).
 *
 * Returns the full comic-details object INCLUDING chapters (called via the
 * config.customParser hook, so it must be self-contained and synchronous).
 * New structure:
 *   - title: <h1>, cover: <meta og:image>, summary: .leading-relaxed
 *   - metadata: <dl class="space-y-2"> rows of <span.text-slate-500>Label:</span> value
 *   - views: .rc-chip containing 👁
 *   - chapters: <a> rows inside <div class="divide-y">, title in span.font-medium,
 *     date in span.text-xs (the <a> itself is the row/link).
 */
export const parseReadComicsOnlineDetails = ($, config, link) => {
  const title = $('h1').first().text().trim();
  const imgSrc = $('meta[property="og:image"]').attr('content') || '';
  const summary = $('.leading-relaxed').first().text().trim();

  const genres = [];
  const meta = {};
  $('dl.space-y-2 > div').each((_, div) => {
    const $d = $(div);
    const label = $d
      .find('span.text-slate-500')
      .first()
      .text()
      .trim()
      .replace(/:$/, '')
      .toLowerCase();
    if (!label) {
      return;
    }
    const links = $d.find('a');
    const value = links.length
      ? links.map((i, a) => $(a).text().trim()).get()
      : $d.text().replace($d.find('span').first().text(), '').trim();
    if (label.includes('genre')) {
      genres.push(...[].concat(value));
    } else {
      meta[label] = value;
    }
  });

  let views = null;
  $('.rc-chip').each((_, c) => {
    const t = $(c).text().trim();
    if (/\d/.test(t) && /👁|view/i.test(t)) {
      views = t.replace(/[^0-9]/g, '');
    }
  });

  const chapters = [];
  $('div.divide-y a').each((_, a) => {
    const $a = $(a);
    const chapterTitle = $a.find('span.font-medium').first().text().trim();
    const chapterLink = $a.attr('href');
    if (chapterTitle && chapterLink) {
      chapters.push({
        title: chapterTitle,
        link: chapterLink,
        date: $a.find('span.text-xs').first().text().trim(),
      });
    }
  });

  const pick = (...keys) => {
    for (const k of keys) {
      if (meta[k]) {
        return Array.isArray(meta[k]) ? meta[k].join(', ') : meta[k];
      }
    }
    return null;
  };

  return {
    title,
    imgSrc,
    type: pick('type'),
    status: pick('status'),
    releaseDate: pick('release', 'released', 'date of release', 'year'),
    categories: pick('category', 'categories'),
    tags: [],
    genres,
    author: pick('author', 'artist', 'writer'),
    alternativeName: pick('alternative', 'alternative name', 'alternate name'),
    views,
    rating: pick('rating'),
    summary,
    link,
    chapters,
    pagination: [],
  };
};

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
