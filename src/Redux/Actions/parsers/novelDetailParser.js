/**
 * Novel detail parsing utilities
 */

import {normalizeImageUrl} from '../utils/dataHelpers';

/**
 * Parses novel details using standard configuration
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} link - Novel URL
 * @returns {Object} - Parsed novel details
 */
export const parseNovelDetails = ($, config, link) => {
  const detailsContainer = $(config.detailsContainer);
  const title = $(config.title).first().text().trim();

  // Try to get image from configured selector, check both src and data-src
  const $img = detailsContainer.find(config.imgSrc);
  let imgSrc = $img.attr(config.getImageAttr) ||
               $img.attr('data-src') ||
               $img.attr('src');
  imgSrc = normalizeImageUrl(imgSrc);

  const genres = parseNovelGenres($, config);
  const details = parseDetailsSection($, detailsContainer, config);

  // Parse summary - extract paragraphs if available
  let summary = '';
  if (config.summary) {
    const $summary = $(config.summary);
    const paragraphs = [];
    $summary.find('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        paragraphs.push(text);
      }
    });
    summary = paragraphs.length > 0 ? paragraphs.join('\n\n') : $summary.text().trim();
  }

  // Parse author directly if selector exists
  const author = config.author ? $(config.author).first().text().trim() : null;

  // Parse rating directly if selector exists
  const rating = parseRating($, config);

  return {
    title,
    imgSrc,
    type: details.Type || 'Novel',
    status: details.Status || parseStatusFromText($, config) || 'Ongoing',
    genres: genres.length > 0 ? genres : details.Genres || [],
    author: author || details.Author || details['Author(s)'] || null,
    alternativeName: details.Alternative || details['Alternative name'] || details['Alternative Title'] || null,
    views: details.Views || null,
    rating: rating || details.Rating || null,
    summary,
    link,
    // Novel-specific fields
    chapters: details.Chapters || details['Total Chapters'] || null,
    bookmarked: details.Bookmarked || details.Bookmarks || null,
    tags: details.Tags || [],
    source: details.Source || null,
    year: details.Year || details['Release Year'] || null,
  };
};

/**
 * Parses genre information from the page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Array} - Array of genre strings
 */
export const parseNovelGenres = ($, config) => {
  const genres = [];
  if (config.genre) {
    $(config.genre).each((_, el) => {
      const genreText = $(el).text().trim();
      if (genreText) {
        genres.push(genreText);
      }
    });
  }
  return genres;
};

/**
 * Parses the details section (dl/dt/dd or table structure)
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} detailsContainer - The container element
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed details as key-value pairs
 */
const parseDetailsSection = ($, detailsContainer, config) => {
  const details = {};

  if (!config.detailsDL) {
    return details;
  }

  // Table-based structure
  if (config.detailsValue) {
    detailsContainer.find(config.detailsDL).each((i, el) => {
      const key = $(el).text().trim().replace(':', '');
      const valueCell = $(el).next(config.detailsValue);
      if (valueCell.length) {
        const links = valueCell.find('a');
        if (links.length > 0) {
          const list = [];
          links.each((_, a) => list.push($(a).text().trim()));
          details[key] = list;
        } else {
          details[key] = valueCell.text().trim();
        }
      }
    });
  }
  // Standard dl/dt/dd structure
  else {
    detailsContainer.find(config.detailsDL).each((i, el) => {
      const key = $(el).text().trim().replace(':', '');
      const dd = $(el).next('dd');
      const keyLower = key.toLowerCase();

      if (keyLower === 'tags' || keyLower === 'genres') {
        const list = [];
        dd.find('a').each((_, a) => list.push($(a).text().trim()));
        details[key] = list;
      } else {
        details[key] = dd.text().trim();
      }
    });
  }

  return details;
};

/**
 * Parses status from text content when not in details section
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {string|null} - Status string or null
 */
const parseStatusFromText = ($, config) => {
  if (!config.status) {
    return null;
  }

  const statusText = $(config.status).text().trim().toLowerCase();

  if (statusText.includes('completed') || statusText === 'completed') {
    return 'Completed';
  }
  if (statusText.includes('ongoing') || statusText === 'ongoing') {
    return 'Ongoing';
  }
  if (statusText.includes('hiatus') || statusText === 'hiatus') {
    return 'Hiatus';
  }
  if (statusText.includes('cancelled') || statusText === 'cancelled') {
    return 'Cancelled';
  }

  return statusText || null;
};

/**
 * Parses rating from the page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {number|null} - Rating value or null
 */
const parseRating = ($, config) => {
  if (!config.rating) {
    return null;
  }

  const ratingText = $(config.rating).text().trim();
  const ratingMatch = ratingText.match(/(\d+\.?\d*)/);

  return ratingMatch ? parseFloat(ratingMatch[1]) : null;
};

/**
 * Parses chapter list with pagination info
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Object containing chapters array and pagination info
 */
export const parseChapterList = ($, config) => {
  const chapters = [];
  const pagination = {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    totalChapters: 0,
  };

  // Support both 'chapterList' and 'chaptersContainer' property names
  const containerSelector = config.chapterList || config.chaptersContainer;

  if (!config.chapterItem) {
    return {chapters, pagination};
  }

  // Try to find chapters in container first, then fall back to entire document
  let $context;
  if (containerSelector && $(containerSelector).length > 0) {
    $context = $(containerSelector);
    console.log('[parseChapterList] Using container:', containerSelector);
  } else {
    // Fall back to searching entire document
    $context = $.root();
    console.log('[parseChapterList] Falling back to root, container not found:', containerSelector);
  }

  // Debug: Log how many chapter items we find
  const foundItems = $context.find(config.chapterItem).length;
  console.log('[parseChapterList] Found chapter items:', foundItems);

  // Parse chapters
  $context.find(config.chapterItem).each((index, el) => {
    const $el = $(el);
    const $link = config.chapterLink ? $el.find(config.chapterLink) : $el;

    let chapterLink = $link.attr('href') || $el.attr('href');
    const chapterTitle = config.chapterTitle
      ? $el.find(config.chapterTitle).text().trim()
      : $link.text().trim() || $el.text().trim();

    // Extract chapter number from link or title
    let chapterNumber = index + 1;
    if (chapterLink) {
      const numberMatch = chapterLink.match(/chapter-(\d+)/i) ||
                          chapterLink.match(/\/(\d+)\/?$/);
      if (numberMatch) {
        chapterNumber = parseInt(numberMatch[1], 10);
      }
    } else if (chapterTitle) {
      const titleMatch = chapterTitle.match(/chapter\s*(\d+)/i) ||
                         chapterTitle.match(/(\d+)/);
      if (titleMatch) {
        chapterNumber = parseInt(titleMatch[1], 10);
      }
    }

    if (chapterLink) {
      chapters.push({
        number: chapterNumber,
        title: chapterTitle || `Chapter ${chapterNumber}`,
        link: chapterLink,
      });
    }
  });

  // Remove duplicates based on chapter number
  const uniqueChapters = [];
  const seenNumbers = new Set();
  chapters.forEach((chapter) => {
    if (!seenNumbers.has(chapter.number)) {
      seenNumbers.add(chapter.number);
      uniqueChapters.push(chapter);
    }
  });

  // Parse pagination using both DOM and regex methods
  const html = $.html();

  // Method 1: DOM-based pagination
  if (config.pagination) {
    const $pagination = $(config.pagination);

    // Find current page
    if (config.currentPage) {
      const $current = $pagination.find(config.currentPage);
      if ($current.length) {
        pagination.currentPage = parseInt($current.text().trim(), 10) || 1;
      }
    }

    // Check for next/prev links
    if (config.nextPage) {
      pagination.hasNext = $pagination.find(config.nextPage).length > 0;
    }
    if (config.prevPage) {
      pagination.hasPrev = $pagination.find(config.prevPage).length > 0;
    }
  }

  // Method 2: Regex-based pagination (more reliable for some sites)
  // Find all page number links
  const pageLinkPattern = /<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>(\d+)<\/a>/gi;
  const pageMatches = [];
  let match;
  while ((match = pageLinkPattern.exec(html)) !== null) {
    pageMatches.push(match);
  }

  if (pageMatches.length > 0) {
    // Get the highest page number
    const pageNumbers = pageMatches.map(m => parseInt(m[1], 10));
    pagination.totalPages = Math.max(...pageNumbers);
  }

  // Check for "Next" link via regex
  const nextMatch = html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>Next/i) ||
                    html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>»/i);
  if (nextMatch) {
    pagination.hasNext = true;
    const nextPageNum = parseInt(nextMatch[1], 10);
    if (nextPageNum > pagination.totalPages) {
      pagination.totalPages = nextPageNum;
    }
  }

  // Check for "Previous" link via regex
  const prevMatch = html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>Prev/i) ||
                    html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>«/i);
  if (prevMatch) {
    pagination.hasPrev = true;
  }

  // Extract current page from URL if not found
  if (pagination.currentPage === 1) {
    const currentPageMatch = html.match(/page=(\d+)/);
    if (currentPageMatch) {
      pagination.currentPage = parseInt(currentPageMatch[1], 10);
    }
  }

  // If we have many chapters but only 1 page detected, check for next page
  if (pagination.totalPages === 1 && uniqueChapters.length >= 100) {
    const hasNextLink = html.match(/chapters\?page=(\d+)/i);
    if (hasNextLink) {
      const nextPageNum = parseInt(hasNextLink[1], 10);
      if (nextPageNum > pagination.currentPage) {
        pagination.hasNext = true;
        pagination.totalPages = Math.max(pagination.totalPages, nextPageNum);
      }
    }
  }

  pagination.totalChapters = uniqueChapters.length;

  console.log('[parseChapterList] Pagination:', pagination);

  return {
    chapters: uniqueChapters,
    pagination,
  };
};

/**
 * Parses complete novel page with both details and chapters
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} link - Novel URL
 * @returns {Object} - Combined novel details with chapters
 */
export const parseNovelPage = ($, config, link) => {
  const details = parseNovelDetails($, config, link);
  const {chapters, pagination} = parseChapterList($, config);

  return {
    ...details,
    chapterList: chapters,
    chapterPagination: pagination,
  };
};

/**
 * Parses WTR-Lab specific novel details
 * WTR-Lab has a unique HTML structure that requires custom parsing
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} link - Novel URL
 * @returns {Object} - Parsed novel details
 */
export const parseWTRLabDetails = ($, config, link) => {
  const details = {
    title: null,
    imgSrc: null,
    author: null,
    status: 'Ongoing',
    summary: '',
    genres: [],
    tags: [],
    views: null,
    chapters: null,
    characters: null,
    readers: null,
    rating: null,
    link,
  };

  // Title - WTR-Lab uses h1 for the main title
  details.title = $('h1').first().text().trim();

  // Alternate title (Chinese title) - usually in h2 or after h1
  const alternateTitle = $('h2').first().text().trim();
  if (alternateTitle) {
    details.alternateTitle = alternateTitle;
  }

  // Cover image - use multiple approaches to find it
  let coverImage = null;
  
  // Debug: Log all images found on the page
  const allImages = [];
  $('img').each((index, img) => {
    const $img = $(img);
    const src = $img.attr('src');
    const dataSrc = $img.attr('data-src');
    const alt = $img.attr('alt');
    if (src || dataSrc) {
      allImages.push({src: src?.substring(0, 60), dataSrc: dataSrc?.substring(0, 60), alt});
    }
  });
  console.log('[parseWTRLabDetails] All images found:', allImages.length);
  if (allImages.length > 0) {
    console.log('[parseWTRLabDetails] First 3 images:', allImages.slice(0, 3));
  }
  
  // First, try og:image meta tag (most reliable for cover images)
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    coverImage = ogImage;
    console.log('[parseWTRLabDetails] Found og:image:', coverImage.substring(0, 80) + '...');
  }
  
  // Second, try to find images with /api/v2/img in src
  if (!coverImage) {
    const apiImages = [];
    $('img[src*="/api/v2/img"]').each((index, img) => {
      const $img = $(img);
      const src = $img.attr('src');
      if (src) {
        apiImages.push(src);
      }
    });
    console.log('[parseWTRLabDetails] Found api images:', apiImages.length, apiImages.slice(0, 2));
    if (apiImages.length > 0) {
      // Use the first api image (usually the cover)
      coverImage = apiImages[0];
    }
  }

  // Also check for data-src attributes (lazy loading)
  if (!coverImage) {
    const lazyImages = [];
    $('img[data-src*="/api/v2/img"]').each((index, img) => {
      const $img = $(img);
      const src = $img.attr('data-src');
      if (src) {
        lazyImages.push(src);
      }
    });
    console.log('[parseWTRLabDetails] Found lazy api images:', lazyImages.length);
    if (lazyImages.length > 0 && !coverImage) {
      coverImage = lazyImages[0];
    }
  }

  // Fallback: try other image selectors
  if (!coverImage) {
    const coverImg = $('img[alt*="cover"], .cover img, .novel-cover img, img').first();
    if (coverImg.length) {
      coverImage = coverImg.attr('src') || coverImg.attr('data-src');
      console.log('[parseWTRLabDetails] Fallback image found:', coverImage?.substring(0, 60));
    }
  }

  // Process cover image URL
  if (coverImage) {
    // Decode HTML entities (like &amp; -> &)
    coverImage = coverImage.replace(/&amp;/g, '&');
    
    // If image URL is relative (starts with /api), prepend base URL
    if (coverImage.startsWith('/api')) {
      coverImage = `https://wtr-lab.com${coverImage}`;
    } else if (!coverImage.startsWith('http')) {
      coverImage = coverImage.startsWith('//') ? `https:${coverImage}` :
                   coverImage.startsWith('/') ? `https://wtr-lab.com${coverImage}` :
                   `https://wtr-lab.com/${coverImage}`;
    }
    details.imgSrc = coverImage;
  }

  console.log('[parseWTRLabDetails] Final cover image:', details.imgSrc ? details.imgSrc.substring(0, 100) + '...' : null);

  // Parse the info section - WTR-Lab shows: Status, Views, Chapters, Characters, Readers
  // Format: "•Ongoing · 18Views162Chapters · 277KCharacters3Readers"
  const infoText = $('body').text();
  
  // Status
  if (infoText.includes('Completed')) {
    details.status = 'Completed';
  } else if (infoText.includes('Ongoing')) {
    details.status = 'Ongoing';
  }

  // Views
  const viewsMatch = infoText.match(/(\d+(?:\.\d+)?[KM]?)\s*Views/i);
  if (viewsMatch) {
    details.views = viewsMatch[1];
  }

  // Chapters
  const chaptersMatch = infoText.match(/(\d+)\s*Chapters/i);
  if (chaptersMatch) {
    details.chapters = parseInt(chaptersMatch[1], 10);
  }

  // Characters
  const charactersMatch = infoText.match(/(\d+(?:\.\d+)?[KM]?)\s*Characters/i);
  if (charactersMatch) {
    details.characters = charactersMatch[1];
  }

  // Readers
  const readersMatch = infoText.match(/(\d+(?:\.\d+)?[KM]?)\s*Readers/i);
  if (readersMatch) {
    details.readers = readersMatch[1];
  }

  // Rating - look for star rating
  const ratingMatch = infoText.match(/★\s*(\d+\.?\d*)/);
  if (ratingMatch) {
    details.rating = parseFloat(ratingMatch[1]);
  }

  // Author - WTR-Lab has author links
  const authorLink = $('a[href*="/author/"]').first();
  if (authorLink.length) {
    details.author = authorLink.text().trim();
  }

  // Genres - WTR-Lab has genre links with /novel-list?genre=
  $('a[href*="/novel-list?genre="]').each((_, el) => {
    const genre = $(el).text().trim();
    if (genre && !details.genres.includes(genre)) {
      details.genres.push(genre);
    }
  });

  // Summary - WTR-Lab has the summary in a specific section
  // Look for the summary text after "Novel Summary" or in the main content area
  let summaryParts = [];
  
  // Try to find summary paragraphs
  $('.summary p, .description p, .novel-summary p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20) {
      summaryParts.push(text);
    }
  });

  // If no summary found with selectors, try to extract from the page
  if (summaryParts.length === 0) {
    // Look for text after "Novel Summary" heading
    const pageText = $('body').text();
    const summaryStart = pageText.indexOf('Novel Summary');
    if (summaryStart !== -1) {
      const afterSummary = pageText.substring(summaryStart + 14).trim();
      // Get the first few paragraphs
      const lines = afterSummary.split('\n').filter(l => l.trim().length > 20);
      summaryParts = lines.slice(0, 5);
    }
  }

  details.summary = summaryParts.join('\n\n');

  // Rankings - WTR-Lab shows ranking badges
  const rankings = [];
  $('a[href*="/ranking/"]').each((_, el) => {
    const rankText = $(el).text().trim();
    if (rankText) {
      rankings.push(rankText);
    }
  });
  if (rankings.length > 0) {
    details.rankings = rankings;
  }

  console.log('[parseWTRLabDetails] Parsed details:', {
    title: details.title?.substring(0, 30),
    author: details.author,
    status: details.status,
    chapters: details.chapters,
    genres: details.genres.length,
    hasCoverImage: !!details.imgSrc,
  });

  return details;
};

export default {
  parseNovelDetails,
  parseNovelGenres,
  parseChapterList,
  parseNovelPage,
  parseWTRLabDetails,
};
