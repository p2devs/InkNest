/**
 * Novel Reader API
 * Fetches and parses chapter content from multiple sources
 */

import cheerio from 'cheerio';
import { NovelHostName } from '../../../Utils/APIs';
import { NovelChapterPageClasses } from './constance';
import { parseNovelChapter, parseWTRLabChapter } from '../../../Redux/Actions/parsers/novelChapterParser';
import {
  recordSourceError,
  recordSourceSuccess,
} from '../../../Utils/sourceStatus';

/**
 * Detect source hostKey from a URL
 * @param {string} link - Full URL or path
 * @returns {string} hostKey (e.g., 'novelfire')
 */
export function getHostKeyFromLink(link) {
  if (!link) return 'novelfire';

  console.log('[getHostKeyFromLink] Checking link:', link);

  // Check if link contains a known host
  for (const [key, baseUrl] of Object.entries(NovelHostName)) {
    const hostWithoutProtocol = baseUrl.replace('https://', '').replace('http://', '');
    console.log('[getHostKeyFromLink] Checking host:', key, hostWithoutProtocol, 'includes:', link.includes(hostWithoutProtocol));
    if (link.includes(hostWithoutProtocol)) {
      console.log('[getHostKeyFromLink] Matched host:', key);
      return key;
    }
  }

  console.log('[getHostKeyFromLink] No match found, defaulting to novelfire');
  // Default to novelfire
  return 'novelfire';
}

const WTR_LAB_JUNK_PATTERNS = [
  '!function(',
  'window.matchMedia(',
  'document.body.classList',
  'document.documentElement.setAttribute',
  'localStorage.getItem("config")',
  'data-bs-theme',
  ':root {',
  '--bprogress-color',
];

const hasEncryptedWTRLabBody = readerData =>
  typeof readerData?.data?.data?.body === 'string' &&
  readerData.data.data.body.startsWith('arr:');

const isLikelyJunkChapterText = text => {
  if (typeof text !== 'string') {
    return true;
  }

  const normalized = text.trim();
  if (!normalized) {
    return true;
  }

  const sample = normalized.slice(0, 1500);
  return WTR_LAB_JUNK_PATTERNS.some(pattern => sample.includes(pattern));
};

/**
 * Fetch chapter content
 * @param {string} chapterLink - Chapter link (e.g., '/book/shadow-slave/chapter-1')
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @param {string} readingMode - Reading mode for WTR-Lab ('web' | 'webplus' | 'ai')
 * @returns {Promise<Object>} Chapter content object
 */
export async function getNovelChapter(chapterLink, hostKey = 'novelfire', readingMode = 'web') {
  // Detect hostKey from link if it's a full URL
  const detectedHostKey = chapterLink.startsWith('http')
    ? getHostKeyFromLink(chapterLink)
    : hostKey;

  const baseUrl = NovelHostName[detectedHostKey];

  try {
    // Ensure link is properly formatted
    let link = chapterLink.startsWith('http') ? chapterLink : `${baseUrl}${chapterLink}`;

    // WTR-Lab: Add /en prefix if needed and reading mode parameter
    if (detectedHostKey === 'wtrlab') {
      // Add /en prefix if not present
      if (!link.includes('/en/') && !link.includes('wtr-lab.com/en')) {
        link = link.replace('wtr-lab.com', 'wtr-lab.com/en');
      }

      // WTR-Lab has different reading modes:
      // - 'web': Server-side rendered HTML - but content still loaded via JS
      // - 'webplus': Enhanced web mode - might have more SSR content
      // - 'ai': AI-translated mode (default on website)
      // WTR-Lab: Use the reader API to get chapter content
      // The content is loaded via a POST API, not in the initial HTML
      console.log('[getNovelChapter] WTR-Lab: Using reader API for chapter content');

      const effectiveReadingMode = readingMode || 'web';
      const buildPageUrl = mode => {
        if (!mode || mode === 'ai') {
          return link;
        }

        const separator = link.includes('?') ? '&' : '?';
        return `${link}${separator}service=${mode}`;
      };

      const toReadableChapter = (chapter, modeUsed) => {
        const hasParagraphs =
          Array.isArray(chapter?.paragraphs) && chapter.paragraphs.length > 0;
        const hasText = typeof chapter?.text === 'string' && chapter.text.trim().length > 0;

        if (!hasParagraphs && !hasText) {
          return null;
        }

        if (isLikelyJunkChapterText(chapter?.text || '')) {
          console.log(
            '[getNovelChapter] Rejected WTR-Lab chapter candidate because it looks like page HTML/CSS/JS',
          );
          return null;
        }

        return {
          ...chapter,
          link: chapterLink,
          hostKey: detectedHostKey,
          requestedReadingMode: effectiveReadingMode,
          activeReadingMode: modeUsed,
        };
      };

      const pageUrl = buildPageUrl(effectiveReadingMode);

      console.log('[getNovelChapter] WTR-Lab using reading mode:', effectiveReadingMode);

      // First, fetch the page to get chapter metadata from __NEXT_DATA__
      const pageResponse = await fetch(pageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15',
        },
      });

      if (!pageResponse.ok) {
        throw new Error(`HTTP error! status: ${pageResponse.status}`);
      }

      const html = await pageResponse.text();
      const $ = cheerio.load(html);

      // Extract chapter metadata from __NEXT_DATA__
      const nextDataScript = $('script#__NEXT_DATA__').html();
      let nextData = null;
      if (nextDataScript) {
        try {
          nextData = JSON.parse(nextDataScript);
        } catch (e) {
          console.log('[getNovelChapter] Failed to parse WTR-Lab __NEXT_DATA__:', e.message);
        }
      }

      const serie = nextData?.props?.pageProps?.serie;
      const chapterData = serie?.chapter;

      if (!chapterData?.id || !chapterData?.raw_id || !chapterData?.order) {
        throw new Error('Could not find chapter metadata in WTR-Lab page data');
      }

      console.log('[getNovelChapter] WTR-Lab chapter metadata:', {
        chapterId: chapterData.id,
        rawId: chapterData.raw_id,
        chapterNo: chapterData.order,
        title: chapterData.title,
      });

      const readerApiUrl = 'https://wtr-lab.com/api/reader/get';
      const attemptedModes = [effectiveReadingMode];
      if (effectiveReadingMode !== 'ai') {
        attemptedModes.push('ai');
      }

      let lastReaderError = null;

      for (const mode of attemptedModes) {
        const modePageUrl = buildPageUrl(mode);
        const readerPayload = {
          translate: mode,
          language: 'en',
          raw_id: chapterData.raw_id,
          chapter_no: chapterData.order,
          retry: false,
          force_retry: false,
          chapter_id: chapterData.id,
        };

        console.log('[getNovelChapter] WTR-Lab calling reader API with payload:', readerPayload);

        try {
          const readerResponse = await fetch(readerApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'Accept-Language': 'en-US,en;q=0.9',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.3.1 Safari/605.1.15',
              'Origin': 'https://wtr-lab.com',
              'Referer': modePageUrl,
            },
            body: JSON.stringify(readerPayload),
          });

          if (!readerResponse.ok) {
            throw new Error(`Reader API error! status: ${readerResponse.status}`);
          }

          const readerData = await readerResponse.json();
          console.log('[getNovelChapter] WTR-Lab reader API response keys:', Object.keys(readerData));
          console.log('[getNovelChapter] WTR-Lab reader API response:', JSON.stringify(readerData).substring(0, 1000));

          if (hasEncryptedWTRLabBody(readerData)) {
            console.log(
              `[getNovelChapter] WTR-Lab ${mode} mode returned encrypted arr body, trying fallback mode`,
            );
            continue;
          }

          const chapter = toReadableChapter(
            parseWTRLabChapter($, {}, readerData, chapterData),
            mode,
          );

          console.log('[getNovelChapter] Parsed chapter:', {
            mode,
            title: chapter?.title,
            textLength: chapter?.text?.length,
            paragraphsCount: chapter?.paragraphs?.length,
          });

          if (chapter) {
            recordSourceSuccess(detectedHostKey);
            return chapter;
          }
        } catch (readerError) {
          lastReaderError = readerError;
          console.log(
            `[getNovelChapter] WTR-Lab ${mode} mode failed:`,
            readerError.message,
          );
        }
      }

      const htmlChapter = toReadableChapter(
        parseWTRLabChapter($, {}, null, chapterData),
        effectiveReadingMode,
      );

      if (htmlChapter) {
        recordSourceSuccess(detectedHostKey);
        return htmlChapter;
      }

      throw lastReaderError || new Error('Could not extract readable chapter content from WTR-Lab');
    }

    // For non-WTR-Lab sources, use the standard GET approach
    const response = await fetch(link, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Get source-specific config
    const config = NovelChapterPageClasses[detectedHostKey];

    // Parse chapter using generic parser with config
    const chapter = parseNovelChapter($, {
      contentSelector: config?.contentContainer || '#content, .chapter-content, article',
      titleSelector: config?.title || 'h1, h2, h3, h4, .chapter-title',
      prevSelector: config?.prevChapter || '.prev, .prevchap, a[rel="prev"]',
      nextSelector: config?.nextChapter || '.next, .nextchap, a[rel="next"]',
      paragraphSelector: config?.paragraphs || 'p',
    });

    console.log('[getNovelChapter] Parsed chapter:', {
      title: chapter?.title,
      textLength: chapter?.text?.length,
      paragraphsCount: chapter?.paragraphs?.length,
      prevChapter: chapter?.prevChapter,
      nextChapter: chapter?.nextChapter,
    });

    // Record successful request
    recordSourceSuccess(detectedHostKey);

    return {
      ...chapter,
      link: chapterLink,
      hostKey: detectedHostKey,
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);

    // Record error for source tracking
    const statusCode = error?.response?.status || error?.status;
    if (statusCode) {
      recordSourceError(detectedHostKey, statusCode);
    }

    throw error;
  }
}

/**
 * Fetch multiple chapters for offline reading
 * @param {string} novelLink - Novel link
 * @param {number} startChapter - Starting chapter number
 * @param {number} endChapter - Ending chapter number
 * @param {string} hostKey - Source key (default: 'novelfire')
 * @param {string} readingMode - Reading mode for WTR-Lab ('web' | 'webplus' | 'ai')
 * @returns {Promise<Array>} Array of chapter contents
 */
export async function getMultipleChapters(novelLink, startChapter, endChapter, hostKey = 'novelfire', readingMode = 'web') {
  const chapters = [];
  const baseUrl = NovelHostName[hostKey];

  for (let i = startChapter; i <= endChapter; i++) {
    try {
      let chapterLink;
      if (hostKey === 'wtrlab') {
        // WTR-Lab chapter URL format: /en/novel/{id}/{slug}/chapter-{num}
        const link = novelLink.startsWith('http') ? novelLink :
          (novelLink.startsWith('/en') ? `${baseUrl}${novelLink}` : `${baseUrl}/en${novelLink}`);
        chapterLink = `${link}/chapter-${i}`;
      } else {
        chapterLink = novelLink.startsWith('http')
          ? `${novelLink}/chapter-${i}`
          : `${baseUrl}${novelLink}/chapter-${i}`;
      }
      const chapter = await getNovelChapter(chapterLink, hostKey, readingMode);
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
  getHostKeyFromLink,
};
