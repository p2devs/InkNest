/**
 * Novel Details API
 * Fetches and parses novel details and chapter list
 * Supports multiple sources via hostKey parameter
 */

import cheerio from 'cheerio';
import { NovelHostName } from '../../../Utils/APIs';
import { NovelDetailPageClasses, NovelChapterListPageClasses } from './constance';
import { parseNovelDetails, parseChapterList, parseWTRLabDetails } from '../../../Redux/Actions/parsers/novelDetailParser';
import {
  recordSourceError,
  recordSourceSuccess,
} from '../../../Utils/sourceStatus';
import { getHostKeyFromLink } from './Reader';

/**
 * Fetch novel details
 * @param {string} novelLink - Novel link (e.g., '/book/shadow-slave')
 * @param {string} hostKey - Source host key (default: 'novelfire')
 * @returns {Promise<Object>} Novel details object
 */
export async function getNovelDetails(novelLink, hostKey = 'novelfire') {
  // Auto-detect hostKey from link if not provided or default
  const resolvedHostKey = (hostKey === 'novelfire' && novelLink) 
    ? getHostKeyFromLink(novelLink) 
    : hostKey;
  
  console.log('[getNovelDetails] novelLink:', novelLink);
  console.log('[getNovelDetails] resolvedHostKey:', resolvedHostKey);
  
  const baseUrl = NovelHostName[resolvedHostKey] || NovelHostName.novelfire;
  const config = NovelDetailPageClasses[resolvedHostKey] || NovelDetailPageClasses.novelfire;

  try {
    // Ensure link is properly formatted
    // WTR-Lab links may already include /en prefix or be full URLs
    let link;
    if (novelLink.startsWith('http')) {
      link = novelLink;
    } else if (resolvedHostKey === 'wtrlab') {
      // WTR-Lab uses /en prefix for English pages
      link = novelLink.startsWith('/en') ? `${baseUrl}${novelLink}` : `${baseUrl}/en${novelLink}`;
    } else {
      link = `${baseUrl}${novelLink}`;
    }

    console.log('[getNovelDetails] Fetching from:', link);
    console.log('[getNovelDetails] resolvedHostKey:', resolvedHostKey);
    console.log('[getNovelDetails] baseUrl:', baseUrl);

    const response = await fetch(link, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    console.log('[getNovelDetails] Response status:', response.status);
    console.log('[getNovelDetails] Response OK:', response.ok);
    console.log('[getNovelDetails] Response URL:', response.url);

    if (!response.ok) {
      const statusCode = response.status;
      recordSourceError(resolvedHostKey, statusCode);
      throw new Error(`HTTP error! status: ${statusCode}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Use WTR-Lab specific parser for wtrlab source
    const details = resolvedHostKey === 'wtrlab'
      ? parseWTRLabDetails($, config, link)
      : parseNovelDetails($, config, link);

    console.log('[getNovelDetails] Parsed details:', {
      title: details.title?.substring(0, 30),
      imgSrc: details.imgSrc ? details.imgSrc.substring(0, 60) + '...' : null,
      coverImage: details.coverImage ? details.coverImage.substring(0, 60) + '...' : null,
    });

    // Record successful request
    recordSourceSuccess(resolvedHostKey);

    // Fetch first page of chapters to get pagination info
    // Pass total chapter count for WTR-Lab to generate chapters programmatically
    const chaptersData = await getChapterList(novelLink, 1, resolvedHostKey, details.chapters);

    console.log('[getNovelDetails] chaptersData:', {
      chaptersCount: chaptersData?.chapters?.length,
      pagination: chaptersData?.pagination,
    });

    const result = {
      ...details,
      // Normalize coverImage for backward compatibility
      coverImage: details.imgSrc || details.coverImage,
      link: novelLink,
      chapterList: chaptersData.chapters,
      chapterPagination: chaptersData.pagination,
    };
    
    console.log('[getNovelDetails] Final result coverImage:', result.coverImage ? result.coverImage.substring(0, 60) + '...' : null);
    
    return result;
  } catch (error) {
    console.error('Error fetching novel details:', error);
    throw error;
  }
}

/**
 * Fetch chapter list for a novel (single page)
 * @param {string} novelLink - Novel link
 * @param {number} page - Page number for paginated chapter lists
 * @param {string} hostKey - Source host key (default: 'novelfire')
 * @param {number} totalChapters - Total chapter count (optional, used for WTR-Lab)
 * @returns {Promise<Object>} Object with chapters array and pagination info
 */
export async function getChapterList(novelLink, page = 1, hostKey = 'novelfire', totalChapters = null) {
  console.log('[getChapterList] Called with:', { novelLink, page, hostKey, totalChapters });
  
  // Auto-detect hostKey from link if not provided or default
  const resolvedHostKey = (hostKey === 'novelfire' && novelLink) 
    ? getHostKeyFromLink(novelLink) 
    : hostKey;
  
  console.log('[getChapterList] resolvedHostKey:', resolvedHostKey);
  
  const baseUrl = NovelHostName[resolvedHostKey] || NovelHostName.novelfire;
  // Use NovelChapterListPageClasses for chapter list parsing
  const config = NovelChapterListPageClasses[resolvedHostKey] || NovelChapterListPageClasses.novelfire;

  try {
    // WTR-Lab: Use API to fetch all chapters
    console.log('[getChapterList] Checking if wtrlab:', resolvedHostKey, '=== "wtrlab":', resolvedHostKey === 'wtrlab');
    
    if (resolvedHostKey === 'wtrlab') {
      console.log('[getChapterList] WTR-Lab detected');
      
      // Extract novel ID and slug from link
      // Link format: https://wtr-lab.com/en/novel/{id}/{slug} or /en/novel/{id}/{slug}
      const novelIdMatch = novelLink.match(/\/novel\/(\d+)\//);
      const novelId = novelIdMatch ? novelIdMatch[1] : null;
      const slugMatch = novelLink.match(/\/novel\/\d+\/([^\/\?]+)/);
      const slug = slugMatch ? slugMatch[1] : '';
      
      console.log('[getChapterList] Extracted novelId:', novelId, 'slug:', slug, 'from link:', novelLink);
      
      if (!novelId) {
        console.error('[getChapterList] Could not extract novel ID from link:', novelLink);
        // Fallback to HTML parsing
        return await getChapterListFromHTML(novelLink, baseUrl, config, resolvedHostKey, page);
      }
      
      // If we have the total chapter count, generate chapters programmatically
      // This is the most reliable approach for WTR-Lab since the TOC is loaded dynamically
      if (totalChapters && totalChapters > 0) {
        console.log('[getChapterList] Generating chapters programmatically, total:', totalChapters);
        
        const chapters = [];
        for (let i = 1; i <= totalChapters; i++) {
          // WTR-Lab chapter URL format: /en/novel/{id}/{slug}/chapter-{number}
          const chapterLink = `https://wtr-lab.com/en/novel/${novelId}/${slug}/chapter-${i}`;
          chapters.push({
            number: i,
            title: `Chapter ${i}`,
            link: chapterLink,
            id: i,
          });
        }
        
        console.log('[getChapterList] Generated chapters:', chapters.length);
        
        recordSourceSuccess(resolvedHostKey);
        
        return {
          chapters,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            totalChapters: chapters.length,
          },
        };
      }
      
      // Fallback: Try API endpoint for chapters
      const apiUrl = `https://wtr-lab.com/api/v2/series/${novelId}/chapters`;
      console.log('[getChapterList] No totalChapters, trying API:', apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://wtr-lab.com/en/novel/${novelId}/`,
          },
        });
        
        console.log('[getChapterList] WTR-Lab API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[getChapterList] WTR-Lab API data:', {
            chaptersCount: data?.chapters?.length || data?.length,
            keys: Object.keys(data || {}),
            sampleChapter: data?.chapters?.[0] || data?.[0],
          });
          
          // Parse the API response
          // WTR-Lab API returns: { chapters: [{ id, number, title, ... }] } or just an array
          const chaptersArray = data?.chapters || data || [];
          
          if (chaptersArray.length > 0) {
            // Extract slug from novel link for building chapter URLs
            const slugMatch = novelLink.match(/\/novel\/\d+\/([^\/\?]+)/);
            const slug = slugMatch ? slugMatch[1] : '';
            
            const chapters = chaptersArray.map((chapter, index) => {
              // WTR-Lab chapter URL format: /en/novel/{id}/{slug}/chapter-{chapterId}-{chapterNumber}
              const chapterId = chapter.id || chapter.chapter_id || chapter._id || index + 1;
              const chapterNumber = chapter.number || chapter.chapter_number || chapter.num || (index + 1);
              const chapterTitle = chapter.title || chapter.name || `Chapter ${chapterNumber}`;
              
              // Build the chapter link
              const chapterLink = `https://wtr-lab.com/en/novel/${novelId}/${slug}/chapter-${chapterId}-${chapterNumber}`;
              
              return {
                number: chapterNumber,
                title: chapterTitle,
                link: chapterLink,
                id: chapterId,
              };
            });
            
            console.log('[getChapterList] Parsed chapters from API:', chapters.length);
            
            // Record successful request
            recordSourceSuccess(resolvedHostKey);
            
            return {
              chapters,
              pagination: {
                currentPage: 1,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
                totalChapters: chapters.length,
              },
            };
          }
        }
      } catch (apiError) {
        console.log('[getChapterList] API error, falling back to HTML:', apiError.message);
      }
      
      // Fallback to HTML parsing if API fails or returns empty
      console.log('[getChapterList] Falling back to HTML parsing');
      return await getChapterListFromHTML(novelLink, baseUrl, config, resolvedHostKey, page);
    }
    
    // For other sources, use HTML parsing
    return await getChapterListFromHTML(novelLink, baseUrl, config, resolvedHostKey, page);
  } catch (error) {
    console.error('Error fetching chapter list:', error);
    throw error;
  }
}

/**
 * Fetch chapter list from HTML (fallback for non-API sources)
 */
async function getChapterListFromHTML(novelLink, baseUrl, config, resolvedHostKey, page) {
  try {
    // Build the chapters URL based on source
    let chaptersUrl;
    if (resolvedHostKey === 'wtrlab') {
      // WTR-Lab has chapters in the Table of Contents tab
      const link = novelLink.startsWith('http') ? novelLink :
        (novelLink.startsWith('/en') ? `${baseUrl}${novelLink}` : `${baseUrl}/en${novelLink}`);
      chaptersUrl = `${link}?tab=toc`;
    } else {
      const link = novelLink.startsWith('http') ? novelLink : `${baseUrl}${novelLink}`;
      chaptersUrl = `${link}/chapters?page=${page}`;
    }

    console.log('[getChapterList] Fetching HTML from:', chaptersUrl);

    const response = await fetch(chaptersUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });

    console.log('[getChapterList] Response status:', response.status);

    if (!response.ok) {
      const statusCode = response.status;
      recordSourceError(resolvedHostKey, statusCode);
      throw new Error(`HTTP error! status: ${statusCode}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('[getChapterListFromHTML] resolvedHostKey:', resolvedHostKey);
    console.log('[getChapterListFromHTML] HTML length:', html.length);
    
    // For WTR-Lab, try to extract chapters from the HTML more thoroughly
    if (resolvedHostKey === 'wtrlab') {
      console.log('[getChapterListFromHTML] WTR-Lab specific parsing');
      const chapters = [];
      const novelIdMatch = novelLink.match(/\/novel\/(\d+)\//);
      const novelId = novelIdMatch ? novelIdMatch[1] : null;
      const slugMatch = novelLink.match(/\/novel\/\d+\/([^\/\?]+)/);
      const slug = slugMatch ? slugMatch[1] : '';
      
      console.log('[getChapterListFromHTML] WTR-Lab novelId:', novelId, 'slug:', slug);
      
      // Find all chapter links with the pattern /chapter-{number}
      // WTR-Lab format: /en/novel/{id}/{slug}/chapter-{number}
      const chapterLinks = $('a[href*="/chapter-"]');
      console.log('[getChapterListFromHTML] Found chapter links:', chapterLinks.length);
      
      chapterLinks.each((index, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        const title = $el.text().trim();
        
        console.log('[getChapterListFromHTML] Chapter link:', href, 'title:', title?.substring(0, 30));
        
        // Extract chapter number from URL
        // Format 1: /chapter-{number} (e.g., /chapter-131)
        // Format 2: /chapter-{id}-{number} (e.g., /chapter-12345-131)
        let chapterNumber = null;
        let chapterId = null;
        
        // Try format 2 first: chapter-{id}-{number}
        const complexMatch = href.match(/chapter-(\d+)-(\d+)/);
        if (complexMatch) {
          chapterId = complexMatch[1];
          chapterNumber = parseInt(complexMatch[2], 10);
        } else {
          // Try format 1: chapter-{number}
          const simpleMatch = href.match(/chapter-(\d+)/);
          if (simpleMatch) {
            chapterNumber = parseInt(simpleMatch[1], 10);
            chapterId = chapterNumber; // Use number as ID
          }
        }
        
        if (chapterNumber) {
          // Build full URL if needed
          let chapterLink = href;
          if (!chapterLink.startsWith('http')) {
            chapterLink = chapterLink.startsWith('/') 
              ? `https://wtr-lab.com${chapterLink}` 
              : `https://wtr-lab.com/${chapterLink}`;
          }
          
          chapters.push({
            number: chapterNumber,
            title: title || `Chapter ${chapterNumber}`,
            link: chapterLink,
            id: chapterId,
          });
        }
      });
      
      console.log('[getChapterListFromHTML] WTR-Lab found chapters before dedup:', chapters.length);
      
      // Remove duplicates based on chapter number
      const uniqueChapters = [];
      const seenNumbers = new Set();
      chapters.forEach((chapter) => {
        if (!seenNumbers.has(chapter.number)) {
          seenNumbers.add(chapter.number);
          uniqueChapters.push(chapter);
        }
      });
      
      // Sort by chapter number
      uniqueChapters.sort((a, b) => a.number - b.number);
      
      console.log('[getChapterList] WTR-Lab HTML parsed chapters:', uniqueChapters.length);
      
      if (uniqueChapters.length > 0) {
        recordSourceSuccess(resolvedHostKey);
        return {
          chapters: uniqueChapters,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
            totalChapters: uniqueChapters.length,
          },
        };
      }
    }

    const result = parseChapterList($, config);
    console.log('[getChapterList] result.chapters.length:', result?.chapters?.length);

    recordSourceSuccess(resolvedHostKey);

    return {
      chapters: result?.chapters || [],
      pagination: result?.pagination || { currentPage: page, totalPages: 1, hasNext: false, hasPrev: false },
    };
  } catch (error) {
    console.error('Error fetching chapter list from HTML:', error);
    throw error;
  }
}

export default {
  getNovelDetails,
  getChapterList,
};

// Re-export getHostKeyFromLink from Reader.js
export { getHostKeyFromLink };
