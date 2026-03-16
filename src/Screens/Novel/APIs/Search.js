/**
 * NovelFire.net Search API
 * Fetches and parses search results
 */

import { parseSearchResults } from './novelParser';

const NOVELFIRE_BASE = 'https://novelfire.net';

/**
 * Search novels
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @returns {Promise<Array>} Array of novels
 */
export async function searchNovels(query, page = 1) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${NOVELFIRE_BASE}/search?keyword=${encodedQuery}&type=title&page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return parseSearchResults(html);
  } catch (error) {
    console.error('Error searching novels:', error);
    throw error;
  }
}

/**
 * Search novels by author
 * @param {string} authorName - Author name
 * @returns {Promise<Array>} Array of novels
 */
export async function searchByAuthor(authorName) {
  try {
    const encodedAuthor = encodeURIComponent(authorName);
    const url = `${NOVELFIRE_BASE}/search?keyword=${encodedAuthor}&type=author`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const novels = parseSearchResults(html);

    // Filter results to only include novels by the specified author
    return novels?.filter(novel =>
      novel.author?.toLowerCase().includes(authorName.toLowerCase())
    ) || [];
  } catch (error) {
    console.error('Error searching by author:', error);
    throw error;
  }
}

export default {
  searchNovels,
  searchByAuthor,
};