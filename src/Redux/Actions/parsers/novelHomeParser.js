/**
 * Novel home page parsing utilities
 * Generic parser for extracting novel sections and cards from home pages
 */

import {normalizeImageUrl} from '../utils/dataHelpers';

/**
 * Parses novel home page sections using configuration
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {Object} options - Additional options (baseUrl, etc.)
 * @returns {Array} - Array of sections with novels
 */
export const parseNovelHomeSections = ($, config, options = {}) => {
  const {baseUrl = ''} = options;
  const sections = [];

  if (!config || !config.sections) {
    return sections;
  }

  // Parse each configured section
  config.sections.forEach(sectionConfig => {
    const novels = extractNovelCards($, sectionConfig, {baseUrl});

    if (novels.length > 0) {
      sections.push({
        name: sectionConfig.name,
        novels,
      });
    }
  });

  return sections;
};

/**
 * Extracts novel cards from a section
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} sectionConfig - Section configuration
 * @param {Object} options - Additional options
 * @returns {Array} - Array of parsed novel cards
 */
export const extractNovelCards = ($, sectionConfig, options = {}) => {
  const novels = [];
  const {baseUrl = ''} = options;

  if (!sectionConfig.cardSelector) {
    return novels;
  }

  $(sectionConfig.cardSelector).each((index, element) => {
    const novel = parseNovelCard($, element, {
      ...sectionConfig,
      baseUrl,
    });

    if (novel?.title && novel?.link) {
      novels.push(novel);
    }
  });

  return novels;
};

/**
 * Parses an individual novel card element
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} element - Cheerio element
 * @param {Object} cardConfig - Card parsing configuration
 * @returns {Object|null} - Parsed novel data or null
 */
export const parseNovelCard = ($, element, cardConfig) => {
  const $el = $(element);
  const {
    titleSelector,
    linkSelector,
    imageSelector,
    imageAttr = 'src',
    authorSelector,
    ratingSelector,
    chaptersSelector,
    statusSelector,
    baseUrl = '',
    linkAttr = 'href',
  } = cardConfig;

  // Extract title
  const title = titleSelector
    ? $el.find(titleSelector).text().trim() || $el.find(titleSelector).attr('title')
    : $el.text().trim();

  // Extract link
  let link = linkSelector
    ? $el.find(linkSelector).attr(linkAttr)
    : $el.attr(linkAttr);

  // Normalize link
  if (link) {
    link = normalizeLink(link, baseUrl);
  }

  // Extract cover image
  let coverImage = null;
  if (imageSelector) {
    const $img = $el.find(imageSelector);
    // Try data-src first (lazy loading), then src
    coverImage = $img.attr('data-src') || $img.attr(imageAttr);
    coverImage = normalizeImageUrl(coverImage);

    // Handle relative URLs
    if (coverImage && !coverImage.startsWith('http')) {
      coverImage = baseUrl + (coverImage.startsWith('/') ? '' : '/') + coverImage;
    }
  }

  // Extract author
  const author = authorSelector
    ? $el.find(authorSelector).text().trim()
    : null;

  // Extract rating
  let rating = null;
  if (ratingSelector) {
    const ratingText = $el.find(ratingSelector).text().trim();
    const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
    if (ratingMatch) {
      rating = parseFloat(ratingMatch[1]);
    }
  }

  // Extract chapters count
  let chapters = null;
  if (chaptersSelector) {
    const chaptersText = $el.find(chaptersSelector).text().trim();
    const chaptersMatch = chaptersText.match(/(\d+)/);
    if (chaptersMatch) {
      chapters = parseInt(chaptersMatch[1], 10);
    }
  }

  // Extract status
  const status = statusSelector
    ? $el.find(statusSelector).text().trim() || 'Ongoing'
    : 'Ongoing';

  return {
    title,
    link,
    coverImage,
    author,
    rating,
    chapters,
    status,
  };
};

/**
 * Normalizes a link URL
 *
 * @param {string} link - The link to normalize
 * @param {string} baseUrl - The base URL
 * @returns {string} - Normalized link
 */
const normalizeLink = (link, baseUrl) => {
  if (!link) {
    return link;
  }

  // Already absolute URL
  if (link.startsWith('http')) {
    return link;
  }

  // Handle query string URLs (e.g., /?page=...)
  if (link.startsWith('/?')) {
    return baseUrl + link.substring(1);
  }

  // Relative URL
  if (link.startsWith('/')) {
    return baseUrl + link;
  }

  return baseUrl + '/' + link;
};

/**
 * Default NovelFire.net home page configuration
 */
export const NOVELFIRE_HOME_CONFIG = {
  sections: [
    {
      name: 'Recommends',
      containerSelector: 'section:has(h3:contains("Recommends"))',
      cardSelector: 'li.novel-item',
      titleSelector: 'a[title]',
      linkSelector: 'a[href*="/book/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.badge._br',
      chaptersSelector: '.chapters',
      statusSelector: '.status',
    },
    {
      name: 'Most Read',
      containerSelector: '.ranking-section',
      cardSelector: 'li.novel-item',
      titleSelector: 'a[title]',
      linkSelector: 'a[href*="/book/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.badge._br',
      chaptersSelector: '.chapters',
      statusSelector: '.status',
    },
    {
      name: 'Latest Novels',
      containerSelector: 'section:has(h3:contains("Latest Novels"))',
      cardSelector: 'li.novel-item',
      titleSelector: 'a[title]',
      linkSelector: 'a[href*="/book/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.badge._br',
      chaptersSelector: '.chapters',
      statusSelector: '.status',
    },
    {
      name: 'Completed Stories',
      containerSelector: 'section:has(h3:contains("Completed Stories"))',
      cardSelector: 'li.novel-item',
      titleSelector: 'a[title]',
      linkSelector: 'a[href*="/book/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.badge._br',
      chaptersSelector: '.chapters',
      statusSelector: '.status',
    },
  ],
};

/**
 * Parse NovelFire home page with default configuration
 *
 * @param {Object} $ - Cheerio instance
 * @returns {Array} - Array of sections with novels
 */
export const parseNovelFireHome = $ => {
  return parseNovelHomeSections($, NOVELFIRE_HOME_CONFIG, {
    baseUrl: 'https://novelfire.net',
  });
};

/**
 * WTR-Lab home page configuration
 */
export const WTRLAB_HOME_CONFIG = {
  sourceKey: 'wtrlab',
  baseUrl: 'https://wtr-lab.com',
  sections: [
    {
      name: 'New Novels',
      url: '/en/novel-list',
      cardSelector: '.novel-item, a[href*="/novel/"]',
      titleSelector: '.novel-title, h3, h4',
      linkSelector: 'a[href*="/novel/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.rating',
      chaptersSelector: '.chapters, span:contains("Chapters")',
      statusSelector: '.status',
    },
    {
      name: 'Trending',
      url: '/en/trending',
      cardSelector: '.novel-item, a[href*="/novel/"]',
      titleSelector: '.novel-title, h3, h4',
      linkSelector: 'a[href*="/novel/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.rating',
      chaptersSelector: '.chapters, span:contains("Chapters")',
      statusSelector: '.status',
    },
    {
      name: 'Ranking',
      url: '/en/ranking/daily',
      cardSelector: 'tr, .ranking-item',
      titleSelector: 'a[href*="/novel/"]',
      linkSelector: 'a[href*="/novel/"]',
      imageSelector: 'img',
      imageAttr: 'src',
      authorSelector: '.author',
      ratingSelector: '.rating',
      chaptersSelector: '.chapters',
      statusSelector: '.status',
    },
  ],
};

/**
 * Parse WTR-Lab home page
 *
 * @param {Object} $ - Cheerio instance
 * @returns {Array} - Array of sections with novels
 */
export const parseWTRLabHome = $ => {
  return parseNovelHomeSections($, WTRLAB_HOME_CONFIG, {
    baseUrl: 'https://wtr-lab.com',
  });
};
