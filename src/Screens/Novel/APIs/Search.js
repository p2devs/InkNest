/**
 * Novel Search API
 * Fetches and parses search results from multiple sources
 */

import { parseSearchResults } from './novelParser';
import { NovelHostName } from '../../../Utils/APIs';
import { NovelSearchPageClasses } from './constance';
import {
  recordSourceError,
  recordSourceSuccess,
} from '../../../Utils/sourceStatus';

/**
 * Search novels
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of novels
 */
export async function searchNovels(query, page = 1, hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    console.error(`Unknown hostKey: ${hostKey}`);
    return null;
  }

  try {
    const encodedQuery = encodeURIComponent(query);

    // WTR-Lab uses different search URL pattern
    let url;
    if (hostKey === 'wtrlab') {
      url = `${baseUrl}/en/novel-list?search=${encodedQuery}&page=${page}`;
    } else {
      url = `${baseUrl}/search?keyword=${encodedQuery}&type=title&page=${page}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      recordSourceError(hostKey, response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const results = parseSearchResults(html);

    // Record successful request
    recordSourceSuccess(hostKey);

    return results;
  } catch (error) {
    console.error('Error searching novels:', error);

    // Track error if not already tracked (network errors, etc.)
    const statusCode = error?.response?.status || error?.status;
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Search novels by author
 * @param {string} authorName - Author name
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of novels
 */
export async function searchByAuthor(authorName, hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    console.error(`Unknown hostKey: ${hostKey}`);
    return null;
  }

  try {
    const encodedAuthor = encodeURIComponent(authorName);
    const url = `${baseUrl}/search?keyword=${encodedAuthor}&type=author`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      recordSourceError(hostKey, response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const novels = parseSearchResults(html);

    // Filter results to only include novels by the specified author
    const filteredResults = novels?.filter(novel =>
      novel.author?.toLowerCase().includes(authorName.toLowerCase())
    ) || [];

    // Record successful request
    recordSourceSuccess(hostKey);

    return filteredResults;
  } catch (error) {
    console.error('Error searching by author:', error);

    // Track error if not already tracked (network errors, etc.)
    const statusCode = error?.response?.status || error?.status;
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Get search page config for a source
 * @param {string} hostKey - Source key
 * @returns {Object|null} Search page configuration
 */
export function getSearchConfig(hostKey) {
  return NovelSearchPageClasses[hostKey] || null;
}

export default {
  searchNovels,
  searchByAuthor,
  getSearchConfig,
};