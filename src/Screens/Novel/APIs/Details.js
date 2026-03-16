/**
 * NovelFire.net Details API
 * Fetches and parses novel details and chapter list
 */

import { parseNovelDetails, parseChapterList } from './novelParser';

const NOVELFIRE_BASE = 'https://novelfire.net';

/**
 * Fetch novel details
 * @param {string} novelLink - Novel link (e.g., '/book/shadow-slave')
 * @returns {Promise<Object>} Novel details object
 */
export async function getNovelDetails(novelLink) {
  try {
    // Ensure link is properly formatted
    const link = novelLink.startsWith('http') ? novelLink : `${NOVELFIRE_BASE}${novelLink}`;

    const response = await fetch(link, {
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
    const details = parseNovelDetails(html);

    // Fetch first page of chapters to get pagination info
    const chaptersData = await getChapterList(novelLink, 1);

    return {
      ...details,
      link: novelLink,
      chapterList: chaptersData.chapters,
      chapterPagination: chaptersData.pagination,
    };
  } catch (error) {
    console.error('Error fetching novel details:', error);
    throw error;
  }
}

/**
 * Fetch chapter list for a novel (single page)
 * @param {string} novelLink - Novel link
 * @param {number} page - Page number for paginated chapter lists
 * @returns {Promise<Object>} Object with chapters array and pagination info
 */
export async function getChapterList(novelLink, page = 1) {
  try {
    const link = novelLink.startsWith('http') ? novelLink : `${NOVELFIRE_BASE}${novelLink}`;
    const chaptersUrl = `${link}/chapters?page=${page}`;

    const response = await fetch(chaptersUrl, {
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
    const result = parseChapterList(html);

    return {
      chapters: result?.chapters || [],
      pagination: result?.pagination || { currentPage: page, totalPages: 1, hasNext: false, hasPrev: false },
    };
  } catch (error) {
    console.error('Error fetching chapter list:', error);
    throw error;
  }
}

export default {
  getNovelDetails,
  getChapterList,
};
