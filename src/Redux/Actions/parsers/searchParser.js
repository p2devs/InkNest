/**
 * Search parsing utilities for different comic sources
 */

// Search source configurations
export const SEARCH_SOURCES = {
  readcomicsonline: {
    id: 'readcomicsonline',
    baseUrl: 'https://readcomicsonline.ru',
    searchPath: '/search',
    queryParam: 'query',
  },
  comichubfree: {
    id: 'comichubfree',
    baseUrl: 'https://comichubfree.com',
    searchPath: '/ajax/search',
    queryParam: 'key',
  },
  readallcomics: {
    id: 'readallcomics',
    baseUrl: 'https://readallcomics.com',
    searchPath: '/',
    queryParam: 'story',
  },
};

/**
 * Builds search URL for a given source
 *
 * @param {string} sourceId - The search source identifier
 * @param {string} query - The search query
 * @returns {string} - Complete search URL
 */
export const buildSearchUrl = (sourceId, query) => {
  const source = SEARCH_SOURCES[sourceId];
  if (!source) {
    throw new Error(`Unsupported source: ${sourceId}`);
  }

  const { baseUrl, searchPath, queryParam } = source;

  if (sourceId === 'readallcomics') {
    const formattedQuery = query.replace(/ /g, '+');
    return `${baseUrl}${searchPath}?${queryParam}=${formattedQuery}&s=&type=comic`;
  }

  return `${baseUrl}${searchPath}?${queryParam}=${encodeURIComponent(query)}`;
};

/**
 * Parses ReadComicsOnline search results
 *
 * @param {Object} responseData - API response data
 * @param {string} baseUrl - Base URL for the source
 * @returns {Array} - Formatted search results
 */
export const parseReadComicsOnlineResults = (responseData, baseUrl) => {
  const suggestions = responseData?.suggestions || [];
  return suggestions.map(item => ({
    title: item.value,
    data: item.data,
    link: `${baseUrl}/comic/${item.data}`,
  }));
};

/**
 * Parses ComicHubFree search results
 *
 * @param {Object} responseData - API response data
 * @param {string} baseUrl - Base URL for the source
 * @returns {Array} - Formatted search results
 */
export const parseComicHubFreeResults = (responseData, baseUrl) => {
  const json = responseData || [];
  return json.map(item => ({
    title: item.title,
    data: item.slug,
    link: `${baseUrl}/comic/${item.slug}`,
  }));
};

/**
 * Parses ReadAllComics search results from HTML
 *
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL for the source
 * @returns {Array} - Formatted search results
 */
export const parseReadAllComicsResults = ($, baseUrl) => {
  const results = [];

  $('ul.list-story.categories li a').each((_, element) => {
    const title = $(element).text().trim();
    const href = $(element).attr('href');

    results.push({
      title,
      data: href.split('/').filter(Boolean).pop(), // get last part of URL
      link: href.startsWith('http') ? href : `${baseUrl}${href}`,
    });
  });

  return results;
};

/**
 * Routes search result parsing to the appropriate parser
 *
 * @param {string} sourceId - The search source identifier
 * @param {Object} data - Response data (could be JSON or Cheerio instance)
 * @returns {Array} - Formatted search results
 */
export const parseSearchResults = (sourceId, data) => {
  const source = SEARCH_SOURCES[sourceId];
  if (!source) {
    throw new Error(`Unsupported source: ${sourceId}`);
  }

  const { baseUrl } = source;

  switch (sourceId) {
    case 'readcomicsonline':
      return parseReadComicsOnlineResults(data, baseUrl);
    case 'comichubfree':
      return parseComicHubFreeResults(data, baseUrl);
    case 'readallcomics':
      return parseReadAllComicsResults(data, baseUrl);
    default:
      throw new Error(`No parser for source: ${sourceId}`);
  }
};
