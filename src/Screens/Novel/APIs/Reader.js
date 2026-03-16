/**
 * NovelFire.net Reader API
 * Fetches and parses chapter content
 */

import { parseNovelChapter } from './novelParser';

const NOVELFIRE_BASE = 'https://novelfire.net';

/**
 * Fetch chapter content
 * @param {string} chapterLink - Chapter link (e.g., '/book/shadow-slave/chapter-1')
 * @returns {Promise<Object>} Chapter content object
 */
export async function getNovelChapter(chapterLink) {
  try {
    // Ensure link is properly formatted
    const link = chapterLink.startsWith('http') ? chapterLink : `${NOVELFIRE_BASE}${chapterLink}`;

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
    const chapter = parseNovelChapter(html);

    return {
      ...chapter,
      link: chapterLink,
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
}

/**
 * Fetch multiple chapters for offline reading
 * @param {string} novelLink - Novel link
 * @param {number} startChapter - Starting chapter number
 * @param {number} endChapter - Ending chapter number
 * @returns {Promise<Array>} Array of chapter contents
 */
export async function getMultipleChapters(novelLink, startChapter, endChapter) {
  const chapters = [];

  for (let i = startChapter; i <= endChapter; i++) {
    try {
      const chapterLink = `${novelLink}/chapter-${i}`;
      const chapter = await getNovelChapter(chapterLink);
      chapters.push(chapter);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching chapter ${i}:`, error);
    }
  }

  return chapters;
}

export default {
  getNovelChapter,
  getMultipleChapters,
};