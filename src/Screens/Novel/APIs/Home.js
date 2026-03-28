/**
 * Novel Home API
 * Fetches and parses home page data for multiple sources
 */

import cheerio from 'cheerio';
import {NovelHostName} from '../../../Utils/APIs';
import {NovelHomePageClasses} from './constance';
import {
  parseNovelHomeSections,
  NOVELFIRE_HOME_CONFIG,
} from '../../../Redux/Actions/parsers/novelHomeParser';
import {
  recordSourceError,
  recordSourceSuccess,
} from '../../../Utils/sourceStatus';

/**
 * Get home page config for a source
 * @param {string} hostKey - Source key (e.g., 'novelfire')
 * @returns {Object|null} - Home page config
 */
const getHomeConfig = hostKey => {
  if (hostKey === 'novelfire') {
    return NOVELFIRE_HOME_CONFIG;
  }
  if (hostKey === 'wtrlab') {
    return WTRLAB_HOME_CONFIG;
  }
  return null;
};

/**
 * WTR-Lab home page configuration
 */
const WTRLAB_HOME_CONFIG = {
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
    },
    {
      name: 'Trending',
      url: '/en/trending',
      cardSelector: '.novel-item, a[href*="/novel/"]',
      titleSelector: '.novel-title, h3, h4',
      linkSelector: 'a[href*="/novel/"]',
      imageSelector: 'img',
      imageAttr: 'src',
    },
    {
      name: 'Ranking',
      url: '/en/ranking/daily',
      cardSelector: 'tr, .ranking-item',
      titleSelector: 'a[href*="/novel/"]',
      linkSelector: 'a[href*="/novel/"]',
      imageSelector: 'img',
      imageAttr: 'src',
    },
  ],
};

/**
 * Fetch novel home page data
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of sections with novels
 */
export async function getNovelHome(hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    throw new Error(`Unknown host key: ${hostKey}`);
  }

  // Use separate fetcher for WTR-Lab
  if (hostKey === 'wtrlab') {
    return getWTRLabHome(baseUrl);
  }

  let statusCode = null;
  try {
    const response = await fetch(`${baseUrl}/home`, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const config = getHomeConfig(hostKey);

    if (!config) {
      throw new Error(`No config found for host: ${hostKey}`);
    }

    const sections = parseNovelHomeSections($, config, {baseUrl});

    // Record successful request
    recordSourceSuccess(hostKey);

    return sections;
  } catch (error) {
    console.error('Error fetching novel home:', error);

    // Track source-specific errors
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Fetch WTR-Lab home data from multiple endpoints
 * WTR-Lab has separate pages for novel-list, trending, and ranking
 * @param {string} baseUrl - Base URL for WTR-Lab
 * @returns {Promise<Array>} Array of sections with novels
 */
async function getWTRLabHome(baseUrl) {
  const sections = [];
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  console.log('[WTR-Lab] Fetching home data from', baseUrl);

  try {
    // Fetch novel list page
    try {
      console.log('[WTR-Lab] Fetching novel-list...');
      const novelListResponse = await fetch(`${baseUrl}/en/novel-list`, {
        method: 'GET',
        headers,
      });

      if (novelListResponse.ok) {
        const html = await novelListResponse.text();
        const $ = cheerio.load(html);
        const novels = parseWTRLabNovelList($, baseUrl);

        if (novels.length > 0) {
          sections.push({
            name: 'Novel List',
            novels: novels.slice(0, 20), // Limit to 20 novels
          });
          console.log(`[WTR-Lab] Novel List: ${novels.length} novels`);
        }
      } else {
        console.log(`[WTR-Lab] Novel-list response: ${novelListResponse.status}`);
      }
    } catch (err) {
      console.error('[WTR-Lab] Error fetching novel-list:', err.message);
    }

    // Fetch trending page
    try {
      console.log('[WTR-Lab] Fetching trending...');
      const trendingResponse = await fetch(`${baseUrl}/en/trending`, {
        method: 'GET',
        headers,
      });

      if (trendingResponse.ok) {
        const html = await trendingResponse.text();
        const $ = cheerio.load(html);
        const novels = parseWTRLabNovelList($, baseUrl);

        if (novels.length > 0) {
          sections.push({
            name: 'Trending',
            novels: novels.slice(0, 20),
          });
          console.log(`[WTR-Lab] Trending: ${novels.length} novels`);
        }
      } else {
        console.log(`[WTR-Lab] Trending response: ${trendingResponse.status}`);
      }
    } catch (err) {
      console.error('[WTR-Lab] Error fetching trending:', err.message);
    }

    // Fetch ranking page
    try {
      console.log('[WTR-Lab] Fetching ranking...');
      const rankingResponse = await fetch(`${baseUrl}/en/ranking/daily`, {
        method: 'GET',
        headers,
      });

      if (rankingResponse.ok) {
        const html = await rankingResponse.text();
        const $ = cheerio.load(html);
        const novels = parseWTRLabRanking($, baseUrl);

        if (novels.length > 0) {
          sections.push({
            name: 'Daily Ranking',
            novels: novels.slice(0, 20),
          });
          console.log(`[WTR-Lab] Daily Ranking: ${novels.length} novels`);
        }
      } else {
        console.log(`[WTR-Lab] Ranking response: ${rankingResponse.status}`);
      }
    } catch (err) {
      console.error('[WTR-Lab] Error fetching ranking:', err.message);
    }

    // Record successful request if we got any data
    if (sections.length > 0) {
      recordSourceSuccess('wtrlab');
      console.log(`[WTR-Lab] Successfully fetched ${sections.length} sections`);
    } else {
      console.log('[WTR-Lab] No sections found');
      recordSourceError('wtrlab', 404);
    }

    return sections;
  } catch (error) {
    console.error('[WTR-Lab] Error fetching home:', error);
    recordSourceError('wtrlab', error.status || 500);
    throw error;
  }
}

/**
 * Parse WTR-Lab novel list page
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @returns {Array} Array of novels
 */
function parseWTRLabNovelList($, baseUrl) {
  const novels = [];
  const seenLinks = new Set();
  const seenNovelIds = new Set();

  // First, find all images with /api/v2/img src to build a map
  const imageMap = {};
  $('img[src*="/api/v2/img"]').each((index, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    // Find the closest novel link
    const $closestLink = $img.closest('a[href*="/en/novel/"]');
    if ($closestLink.length > 0) {
      const href = $closestLink.attr('href');
      const novelIdMatch = href.match(/\/novel\/(\d+)\//);
      if (novelIdMatch) {
        imageMap[novelIdMatch[1]] = src;
      }
    }
  });

  // Also check for data-src attributes (lazy loading)
  $('img[data-src*="/api/v2/img"]').each((index, img) => {
    const $img = $(img);
    const src = $img.attr('data-src');
    // Find the closest novel link
    const $closestLink = $img.closest('a[href*="/en/novel/"]');
    if ($closestLink.length > 0) {
      const href = $closestLink.attr('href');
      const novelIdMatch = href.match(/\/novel\/(\d+)\//);
      if (novelIdMatch) {
        if (!imageMap[novelIdMatch[1]]) {
          imageMap[novelIdMatch[1]] = src;
        }
      }
    }
  });

  console.log(`[WTR-Lab] Found ${Object.keys(imageMap).length} images in imageMap`);

  // WTR-Lab uses links with href pattern /en/novel/{id}/{slug}
  $('a[href*="/en/novel/"]').each((index, element) => {
    const $el = $(element);

    // Get link
    let link = $el.attr('href');

    if (!link) {
      return; // Skip if no link
    }

    // Skip non-novel links (like /continue, /details, etc.)
    if (link.includes('/continue') || link.includes('/details') || link.includes('/start')) {
      return;
    }

    // Normalize link
    if (link && !link.startsWith('http')) {
      link = link.startsWith('/') ? `${baseUrl}${link}` : `${baseUrl}/${link}`;
    }

    // Skip duplicates
    if (seenLinks.has(link)) {
      return;
    }
    seenLinks.add(link);

    // Get title - it's the link text
    let title = $el.text().trim();

    // Clean up title - remove extra whitespace and newlines
    title = title.split('\n')[0].trim();

    // Remove ranking prefixes like "#1", "#2", etc.
    title = title.replace(/^#\d+\s*/i, '').trim();

    // Skip if title is too short or empty
    if (!title || title.length < 2) {
      return;
    }

    // Extract novel ID from link for cover image
    // Link format: /en/novel/{id}/{slug} or https://wtr-lab.com/en/novel/{id}/{slug}
    const novelIdMatch = link.match(/\/novel\/(\d+)\//);
    const novelId = novelIdMatch ? novelIdMatch[1] : null;

    // Skip if we've already seen this novel ID
    if (novelId && seenNovelIds.has(novelId)) {
      return;
    }
    if (novelId) {
      seenNovelIds.add(novelId);
    }

    // Get the parent element to find additional info
    const $parent = $el.parent();
    const parentText = $parent.text();

    // Get status (Completed/Ongoing)
    let status = 'Ongoing';
    if (parentText.includes('Completed')) {
      status = 'Completed';
    }

    // Get chapters count
    const chaptersMatch = parentText.match(/(\d+)\s*Chapters?/i);
    const chapters = chaptersMatch ? parseInt(chaptersMatch[1], 10) : null;

    // Get image from the imageMap first, then fall back to DOM search
    let coverImage = null;
    
    if (novelId && imageMap[novelId]) {
      coverImage = imageMap[novelId];
    } else {
      // Fallback: look for img in nearby elements
      coverImage = 
        $el.find('img').attr('src') ||
        $el.find('img').attr('data-src') ||
        $parent.find('img').attr('src') ||
        $parent.find('img').attr('data-src');
    }

    // Handle WTR-Lab image URLs
    if (coverImage) {
      // Decode HTML entities (like &amp; -> &)
      coverImage = coverImage.replace(/&amp;/g, '&');
      
      // If image URL is relative (starts with /api), prepend base URL
      if (coverImage.startsWith('/api')) {
        coverImage = `${baseUrl}${coverImage}`;
      } else if (!coverImage.startsWith('http')) {
        coverImage = coverImage.startsWith('//') ? `https:${coverImage}` :
                     coverImage.startsWith('/') ? `${baseUrl}${coverImage}` :
                     `${baseUrl}/${coverImage}`;
      }
    }

    // Debug log for first few novels
    if (novels.length < 3) {
      console.log(`[WTR-Lab] Novel ${novels.length + 1}:`, {
        title: title.substring(0, 30),
        link,
        coverImage: coverImage ? coverImage.substring(0, 80) + '...' : null,
        novelId,
        status,
        chapters,
      });
    }

    novels.push({
      title,
      link,
      coverImage,
      status,
      chapters,
      novelId,
    });
  });

  console.log(`[WTR-Lab] Parsed ${novels.length} novels from list page`);
  return novels;
}

/**
 * Parse WTR-Lab ranking page (table format)
 * @param {Object} $ - Cheerio instance
 * @param {string} baseUrl - Base URL
 * @returns {Array} Array of novels
 */
function parseWTRLabRanking($, baseUrl) {
  const novels = [];
  const seenLinks = new Set();
  const seenNovelIds = new Set();

  // First, find all images with /api/v2/img src to build a map
  const imageMap = {};
  $('img[src*="/api/v2/img"]').each((index, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    // Find the closest novel link
    const $closestLink = $img.closest('a[href*="/en/novel/"]');
    if ($closestLink.length > 0) {
      const href = $closestLink.attr('href');
      const novelIdMatch = href.match(/\/novel\/(\d+)\//);
      if (novelIdMatch) {
        imageMap[novelIdMatch[1]] = src;
      }
    }
  });

  // Also check for data-src attributes (lazy loading)
  $('img[data-src*="/api/v2/img"]').each((index, img) => {
    const $img = $(img);
    const src = $img.attr('data-src');
    // Find the closest novel link
    const $closestLink = $img.closest('a[href*="/en/novel/"]');
    if ($closestLink.length > 0) {
      const href = $closestLink.attr('href');
      const novelIdMatch = href.match(/\/novel\/(\d+)\//);
      if (novelIdMatch) {
        if (!imageMap[novelIdMatch[1]]) {
          imageMap[novelIdMatch[1]] = src;
        }
      }
    }
  });

  console.log(`[WTR-Lab Ranking] Found ${Object.keys(imageMap).length} images in imageMap`);

  // WTR-Lab ranking uses links with href pattern /en/novel/{id}/{slug}
  // Each novel has a rank number shown as #1, #2, etc.
  $('a[href*="/en/novel/"]').each((index, element) => {
    const $el = $(element);

    // Get link
    let link = $el.attr('href');

    if (!link) {
      return;
    }

    // Skip non-novel links (like /continue, /details, etc.)
    if (link.includes('/continue') || link.includes('/details') || link.includes('/start')) {
      return;
    }

    // Normalize link
    if (link && !link.startsWith('http')) {
      link = link.startsWith('/') ? `${baseUrl}${link}` : `${baseUrl}/${link}`;
    }

    // Skip duplicates
    if (seenLinks.has(link)) {
      return;
    }
    seenLinks.add(link);

    // Get title - it's the link text
    let title = $el.text().trim();

    // Clean up title
    title = title.split('\n')[0].trim();

    // Remove ranking prefixes like "#1", "#2", etc.
    title = title.replace(/^#\d+\s*/i, '').trim();

    // Skip if title is too short or empty
    if (!title || title.length < 2) {
      return;
    }

    // Extract novel ID from link for cover image
    // Link format: /en/novel/{id}/{slug} or https://wtr-lab.com/en/novel/{id}/{slug}
    const novelIdMatch = link.match(/\/novel\/(\d+)\//);
    const novelId = novelIdMatch ? novelIdMatch[1] : null;

    // Skip if we've already seen this novel ID
    if (novelId && seenNovelIds.has(novelId)) {
      return;
    }
    if (novelId) {
      seenNovelIds.add(novelId);
    }

    // Get the parent element to find additional info
    const $parent = $el.parent();
    const parentText = $parent.text();

    // Get status (Completed/Ongoing/Dropped)
    let status = 'Ongoing';
    if (parentText.includes('Completed')) {
      status = 'Completed';
    } else if (parentText.includes('Dropped')) {
      status = 'Dropped';
    }

    // Get chapters count
    const chaptersMatch = parentText.match(/(\d+)\s*Chapters?/i);
    const chapters = chaptersMatch ? parseInt(chaptersMatch[1], 10) : null;

    // Get daily views for ranking
    const viewsMatch = parentText.match(/(\d+(?:,\d+)*)\s*(?:Daily\s*)?views?/i);
    const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : null;

    // Get image from the imageMap first, then fall back to DOM search
    let coverImage = null;
    
    if (novelId && imageMap[novelId]) {
      coverImage = imageMap[novelId];
    } else {
      // Fallback: look for img in nearby elements
      coverImage = 
        $el.find('img').attr('src') ||
        $el.find('img').attr('data-src') ||
        $parent.find('img').attr('src') ||
        $parent.find('img').attr('data-src');
    }

    // Handle WTR-Lab image URLs
    if (coverImage) {
      // Decode HTML entities (like &amp; -> &)
      coverImage = coverImage.replace(/&amp;/g, '&');
      
      // If image URL is relative (starts with /api), prepend base URL
      if (coverImage.startsWith('/api')) {
        coverImage = `${baseUrl}${coverImage}`;
      } else if (!coverImage.startsWith('http')) {
        coverImage = coverImage.startsWith('//') ? `https:${coverImage}` :
                     coverImage.startsWith('/') ? `${baseUrl}${coverImage}` :
                     `${baseUrl}/${coverImage}`;
      }
    }

    // Debug log for first few novels
    if (novels.length < 3) {
      console.log(`[WTR-Lab Ranking] Novel ${novels.length + 1}:`, {
        title: title.substring(0, 30),
        link,
        coverImage: coverImage ? coverImage.substring(0, 80) + '...' : null,
        novelId,
        status,
        chapters,
      });
    }

    novels.push({
      title,
      link,
      coverImage,
      status,
      chapters,
      views,
      novelId,
    });
  });

  console.log(`[WTR-Lab] Parsed ${novels.length} novels from ranking page`);
  return novels;
}

/**
 * Fetch novels by genre
 * @param {string} genre - Genre name (e.g., 'Action', 'Fantasy')
 * @param {number} page - Page number
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of novels
 */
export async function getNovelsByGenre(genre, page = 1, hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    throw new Error(`Unknown host key: ${hostKey}`);
  }

  let statusCode = null;
  try {
    const genreSlug = genre.toLowerCase().replace(/\s+/g, '-');
    const url = `${baseUrl}/genre-${genreSlug}/sort-popular/status-all/all-novel?page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const config = getHomeConfig(hostKey);

    if (!config) {
      throw new Error(`No config found for host: ${hostKey}`);
    }

    const sections = parseNovelHomeSections($, config, {baseUrl});

    // Record successful request
    recordSourceSuccess(hostKey);

    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching novels by genre:', error);

    // Track source-specific errors
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Fetch latest novels
 * @param {number} page - Page number
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of novels
 */
export async function getLatestNovels(page = 1, hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    throw new Error(`Unknown host key: ${hostKey}`);
  }

  let statusCode = null;
  try {
    const url = `${baseUrl}/genre-all/sort-new/status-all/all-novel?page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const config = getHomeConfig(hostKey);

    if (!config) {
      throw new Error(`No config found for host: ${hostKey}`);
    }

    const sections = parseNovelHomeSections($, config, {baseUrl});

    // Record successful request
    recordSourceSuccess(hostKey);

    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching latest novels:', error);

    // Track source-specific errors
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Fetch completed novels
 * @param {number} page - Page number
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @returns {Promise<Array>} Array of novels
 */
export async function getCompletedNovels(page = 1, hostKey = 'novelfire') {
  const baseUrl = NovelHostName[hostKey];

  if (!baseUrl) {
    throw new Error(`Unknown host key: ${hostKey}`);
  }

  let statusCode = null;
  try {
    const url = `${baseUrl}/genre-all/sort-popular/status-completed/all-novel?page=${page}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    statusCode = response.status;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const config = getHomeConfig(hostKey);

    if (!config) {
      throw new Error(`No config found for host: ${hostKey}`);
    }

    const sections = parseNovelHomeSections($, config, {baseUrl});

    // Record successful request
    recordSourceSuccess(hostKey);

    return sections?.[0]?.novels || [];
  } catch (error) {
    console.error('Error fetching completed novels:', error);

    // Track source-specific errors
    if (statusCode) {
      recordSourceError(hostKey, statusCode);
    }

    throw error;
  }
}

export default {
  getNovelHome,
  getNovelsByGenre,
  getLatestNovels,
  getCompletedNovels,
};