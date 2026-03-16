/**
 * NovelFire.net Home API
 * Fetches and parses home page data
 */

import { parseNovelHome } from './novelParser';

const NOVELFIRE_BASE = 'https://novelfire.net';

/**
 * Fetch novel home page data
 * @returns {Promise<Array>} Array of sections with novels
 */
export async function getNovelHome() {
  try {
    const response = await fetch(`${NOVELFIRE_BASE}/home`, {
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
    return parseNovelHome(html);
  } catch (error) {
    console.error('Error fetching novel home:', error);
    throw error;
  }
}

/**
 * Fetch novels by genre
 * @param {string} genre - Genre name (e.g., 'Action', 'Fantasy')
 * @param {number} page - Page number
 * @returns {Promise<Array>} Array of novels
 */
export async function getNovelsByGenre(genre, page = 1) {
  try {
    const genreSlug = genre.toLowerCase().replace(/\s+/g, '-');
    const url = `${NOVELFIRE_BASE}/genre-${genreSlug}/sort-popular/status-all/all-novel?page=${page}`;

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
    const sections = parseNovelHome(html);
    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching novels by genre:', error);
    throw error;
  }
}

/**
 * Fetch latest novels
 * @param {number} page - Page number
 * @returns {Promise<Array>} Array of novels
 */
export async function getLatestNovels(page = 1) {
  try {
    const url = `${NOVELFIRE_BASE}/genre-all/sort-new/status-all/all-novel?page=${page}`;

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
    const sections = parseNovelHome(html);
    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching latest novels:', error);
    throw error;
  }
}

/**
 * Fetch completed novels
 * @param {number} page - Page number
 * @returns {Promise<Array>} Array of novels
 */
export async function getCompletedNovels(page = 1) {
  try {
    const url = `${NOVELFIRE_BASE}/genre-all/sort-popular/status-completed/all-novel?page=${page}`;

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
    const sections = parseNovelHome(html);
    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching completed novels:', error);
    throw error;
  }
}

export default {
  getNovelHome,
  getNovelsByGenre,
  getLatestNovels,
  getCompletedNovels,
};