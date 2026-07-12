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
 * Parses readcomicsonline advanced-search results (2026 Tailwind redesign).
 *
 * The full search is a Laravel POST form (/advanced-search, field `name`) that
 * server-renders result cards: <a class="group" href="/comic/…"><img alt src>
 * <p>title</p></a>. Covers are on the open cdn.readcomicsonline.ru.
 *
 * @param {Object} $ - Cheerio instance of the POST response
 * @returns {Array} - Formatted search results
 */
export const parseAdvancedSearchResults = $ => {
  const results = [];
  $('a.group[href*="/comic/"]').each((_, a) => {
    const $a = $(a);
    const img = $a.find('img').first();
    const link = $a.attr('href');
    const title = (img.attr('alt') || $a.find('p').first().text() || '').trim();
    if (!title || !link) {
      return;
    }
    results.push({
      title,
      link,
      data: link.split('/').filter(Boolean).pop(),
      image: img.attr('src') || null,
    });
  });
  return results;
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

  $('ul.list-story.categories > li').each((_, element) => {
    const $li = $(element);

    // Get the main link (from book-link or cat-title)
    const bookLink = $li.find('a.book-link');
    const catTitleLink = $li.find('a.cat-title');

    // Use book-link href as primary, fallback to cat-title href
    const href = bookLink.attr('href') || catTitleLink.attr('href') || '';
    const title = catTitleLink.text().trim();

    // Get the comic image
    const imgSrc = $li.find('img.book-cover').attr('src') || '';

    // Get publisher
    const publisher = $li.find('.cat-publisher').text().trim();

    // Get total issues
    const totalIssuesText = $li.find('.cat-total-issues').text().trim();
    const totalIssues = totalIssuesText.match(/\d+/)?.[0] || '';

    // Get last updated date
    const lastUpdated = $li.find('.latest-date').text().trim();

    // Get latest chapter link and title
    const latestChapterLink = $li.find('a.latest-chapter').attr('href') || '';
    const latestChapterTitle = $li.find('a.latest-chapter').text().trim();

    if (title && href) {
      results.push({
        title,
        data: href.split('/').filter(Boolean).pop(),
        link: href.startsWith('http') ? href : `${baseUrl}${href}`,
        image: imgSrc,
        publisher: publisher.replace(/^Publisher:\s*/i, ''),
        totalIssues,
        lastUpdated: lastUpdated.replace(/^Updated:\s*/i, ''),
        latestChapter: {
          title: latestChapterTitle.replace(/^Latest:\s*/i, ''),
          link: latestChapterLink,
        },
      });
    }
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
    case 'readallcomics':
      return parseReadAllComicsResults(data, baseUrl);
    default:
      throw new Error(`No parser for source: ${sourceId}`);
  }
};
