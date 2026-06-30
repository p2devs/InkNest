/**
 * Chapter parsing utilities
 */

import APICaller from '../../Controller/Interceptor';

// Host-specific configuration
const HOST_CONFIGS = {
  comicbookplus: {
    domain: 'comicbookplus.com',
    baseUrl: 'https://comicbookplus.com',
    skipPagination: true,
    transformLink: (link) => {
      if (link && link.startsWith('/?')) {
        return 'https://comicbookplus.com' + link.substring(1);
      }
      return link;
    },
  },
};

/**
 * Determines if a URL belongs to a specific host
 *
 * @param {string} url - The URL to check
 * @param {string} hostKey - The host key to check against
 * @returns {boolean} - True if URL matches the host
 */
const isHost = (url, hostKey) => {
  const config = HOST_CONFIGS[hostKey];
  return config && url.includes(config.domain);
};

/**
 * Fetches chapters with pagination support
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} link - Comic URL
 * @returns {Array} - Array of chapter objects
 */
export const fetchChaptersWithPagination = async ($, config, link) => {
  const chapters = [];
  const visitedPages = new Set();
  let currentLink = link;
  let currentCheerio = $;

  const hostKey = Object.keys(HOST_CONFIGS).find(key => isHost(link, key));
  const hostConfig = hostKey ? HOST_CONFIGS[hostKey] : null;

  while (!visitedPages.has(currentLink)) {
    visitedPages.add(currentLink);

    // Parse chapters from current page
    const pageChapters = parseChaptersFromPage(
      currentCheerio,
      config,
      hostConfig
    );
    chapters.push(...pageChapters);

    // Skip pagination for hosts that don't use it
    if (hostConfig?.skipPagination || !config.pagination) {
      break;
    }

    // Find next page link
    const nextPageLink = currentCheerio(config.pagination)
      .filter((i, el) => currentCheerio(el).text().trim().toLowerCase() === 'next')
      .attr('href');

    if (!nextPageLink) {break;}

    // Fetch next page
    const response = await APICaller.get(nextPageLink);
    currentLink = nextPageLink;
    currentCheerio = require('cheerio').load(response.data);
  }

  return chapters;
};

/**
 * Parses chapters from a single page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {Object} hostConfig - Host-specific configuration
 * @returns {Array} - Array of chapter objects
 */
const parseChaptersFromPage = ($, config, hostConfig) => {
  const chapters = [];

  $(config.chaptersList).each((i, el) => {
    const chapterTitle = $(el).find(config.chapterTitle).text().trim();
    let chapterLink = $(el).find(config.chapterLink).attr('href');
    const chapterDate = $(el).find(config.chapterDate).text().trim();

    // Apply host-specific link transformation
    if (hostConfig?.transformLink) {
      chapterLink = hostConfig.transformLink(chapterLink);
    }

    if (chapterTitle && chapterLink) {
      chapters.push({
        title: chapterTitle,
        link: chapterLink,
        date: chapterDate,
      });
    }
  });

  return chapters;
};

/**
 * Gets pagination information from the page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Array} - Array of pagination links
 */
export const getChapterPagination = ($, config) => {
  const pages = [];

  if (!config.pagination) {
    return pages;
  }

  $(config.pagination).each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      pages.push({text, link: href});
    }
  });

  return pages;
};
