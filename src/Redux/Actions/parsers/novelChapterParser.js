/**
 * Novel chapter content parsing utilities
 * Generic parser for extracting chapter content from various novel sources
 */

/**
 * Cleans HTML entities and normalizes text
 *
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
const cleanText = (text) => {
  if (!text) {
    return '';
  }
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Base64 decode helper for React Native environments
 * @param {string} str - Base64 encoded string
 * @returns {string} - Decoded string
 */
const base64Decode = (str) => {
  try {
    // Try using the global atob if available
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    // Manual base64 decode as fallback
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    while (i < str.length) {
      const enc1 = chars.indexOf(str.charAt(i++));
      const enc2 = chars.indexOf(str.charAt(i++));
      const enc3 = chars.indexOf(str.charAt(i++));
      const enc4 = chars.indexOf(str.charAt(i++));
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      output += String.fromCharCode(chr1);
      if (enc3 !== 64) output += String.fromCharCode(chr2);
      if (enc4 !== 64) output += String.fromCharCode(chr3);
    }
    // Handle UTF-8 encoding
    return decodeURIComponent(escape(output));
  } catch (e) {
    console.log('[base64Decode] Failed to decode:', e.message);
    return str;
  }
};

/**
 * Convert base64 string to Uint8Array
 * @param {string} base64 - Base64 encoded string
 * @returns {Uint8Array} - Byte array
 */
const base64ToUint8Array = (base64) => {
  const binaryString = base64Decode(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Decrypt WTR-Lab arr: format content
 * Format: arr:iv:authTag:ciphertext (all base64 encoded)
 * Uses AES-GCM decryption
 * @param {string} encryptedData - The arr: prefixed encrypted string
 * @returns {string} - Decrypted content
 */
const decryptWTRLabContent = (encryptedData) => {
  try {
    if (!encryptedData || !encryptedData.startsWith('arr:')) {
      return null;
    }

    console.log('[decryptWTRLabContent] Attempting to decrypt arr: format');
    
    // Parse the arr: format
    const parts = encryptedData.substring(4).split(':');
    console.log('[decryptWTRLabContent] Parts count:', parts.length);
    
    if (parts.length < 2) {
      console.log('[decryptWTRLabContent] Invalid arr: format - not enough parts');
      return null;
    }

    // The format appears to be: arr:iv:authTag:ciphertext
    // Or possibly: arr:keyId:iv:ciphertext
    const ivBase64 = parts[0];
    const authTagOrKeyBase64 = parts[1];
    const ciphertextBase64 = parts.slice(2).join(':'); // In case ciphertext contains colons

    console.log('[decryptWTRLabContent] IV (base64):', ivBase64.substring(0, 20));
    console.log('[decryptWTRLabContent] Auth/Key (base64):', authTagOrKeyBase64.substring(0, 20));
    console.log('[decryptWTRLabContent] Ciphertext (base64) length:', ciphertextBase64.length);

    // Try to decode the parts
    const iv = base64ToUint8Array(ivBase64);
    const authTagOrKey = base64ToUint8Array(authTagOrKeyBase64);
    const ciphertext = base64ToUint8Array(ciphertextBase64);

    console.log('[decryptWTRLabContent] IV bytes:', iv.length);
    console.log('[decryptWTRLabContent] Auth/Key bytes:', authTagOrKey.length);
    console.log('[decryptWTRLabContent] Ciphertext bytes:', ciphertext.length);

    // Check if Web Crypto API is available
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      console.log('[decryptWTRLabContent] Web Crypto API available');
      // This would need to be async, so we'll return null for now
      // and handle this in a different way
      return null;
    }

    // Try simple XOR decryption (some sites use simple XOR)
    // This is a fallback attempt
    console.log('[decryptWTRLabContent] Trying simple decryption methods');
    
    // Try decoding each part as UTF-8 directly
    for (const part of parts) {
      try {
        const decoded = base64Decode(part);
        if (decoded && decoded.length > 50 && /[a-zA-Z]/.test(decoded)) {
          console.log('[decryptWTRLabContent] Found readable content in part:', decoded.substring(0, 100));
          return decoded;
        }
      } catch (e) {
        // Ignore decode errors
      }
    }

    // Try combining all parts and decoding
    const combined = parts.join('');
    try {
      const decoded = base64Decode(combined);
      if (decoded && decoded.length > 50) {
        console.log('[decryptWTRLabContent] Decoded combined parts:', decoded.substring(0, 100));
        return decoded;
      }
    } catch (e) {
      // Ignore
    }

    console.log('[decryptWTRLabContent] Could not decrypt - Web Crypto API not available or key unknown');
    return null;
  } catch (e) {
    console.log('[decryptWTRLabContent] Decryption error:', e.message);
    return null;
  }
};

/**
 * Extracts plain text content from a selector
 *
 * @param {Object} $ - Cheerio instance
 * @param {string} contentSelector - CSS selector for content container
 * @returns {string} - Extracted plain text
 */
export const extractChapterText = ($, contentSelector) => {
  const paragraphs = [];
  const container = $(contentSelector);

  if (!container.length) {
    return '';
  }

  // Extract all paragraph text
  container.find('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 0) {
      paragraphs.push(cleanText(text));
    }
  });

  // If no paragraphs found, try getting direct text content
  if (paragraphs.length === 0) {
    const directText = container.text().trim();
    if (directText) {
      paragraphs.push(cleanText(directText));
    }
  }

  return paragraphs.join('\n\n');
};

/**
 * Extracts images from chapter content
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} config.contentSelector - CSS selector for content container
 * @param {string} config.imageSelector - CSS selector for images (default: 'img')
 * @param {string} config.imageAttr - Attribute to get image URL (default: 'src')
 * @returns {Array} - Array of image objects with src and optional caption
 */
export const extractChapterImages = ($, config) => {
  const {
    contentSelector,
    imageSelector = 'img',
    imageAttr = 'src',
  } = config;

  const images = [];
  const seen = new Set();
  const container = $(contentSelector);

  if (!container.length) {
    return images;
  }

  container.find(imageSelector).each((_, el) => {
    // Try multiple attributes for lazy-loaded images
    const src =
      $(el).attr(imageAttr)?.trim() ||
      $(el).attr('data-src')?.trim() ||
      $(el).attr('data-lazy-src')?.trim() ||
      $(el).attr('data-original')?.trim();

    if (src && !seen.has(src)) {
      seen.add(src);

      // Get alt text or caption if available
      const alt = $(el).attr('alt')?.trim() || '';
      const caption = $(el).next('figcaption, .caption').text().trim() || '';

      images.push({
        src,
        alt,
        caption: caption || alt,
      });
    }
  });

  return images;
};

/**
 * Parses chapter content using standard configuration
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {string} config.contentSelector - CSS selector for main content
 * @param {string} config.titleSelector - CSS selector for chapter title
 * @param {string} config.prevSelector - CSS selector for previous chapter link
 * @param {string} config.nextSelector - CSS selector for next chapter link
 * @param {boolean} config.extractImages - Whether to extract images (default: false)
 * @param {string} config.paragraphSelector - CSS selector for paragraphs (default: 'p')
 * @returns {Object} - Parsed chapter data
 */
export const parseNovelChapter = ($, config) => {
  const {
    contentSelector = '#content, .chapter-content, article, .content',
    titleSelector = 'h1, h2, h3, h4, .chapter-title',
    prevSelector = '.prev, .prevchap, a[rel="prev"]',
    nextSelector = '.next, .nextchap, a[rel="next"]',
    extractImages = false,
    paragraphSelector = 'p',
    excludeSelectors = [],
  } = config;

  const content = {
    title: '',
    paragraphs: [],
    text: '',
    images: [],
    prevChapter: null,
    nextChapter: null,
  };

  // Extract title
  const titleEl = $(titleSelector).first();
  content.title = titleEl.text().trim();

  // Find content container
  const container = $(contentSelector).first();

  console.log('[parseNovelChapter] contentSelector:', contentSelector);
  console.log('[parseNovelChapter] container found:', container.length);
  console.log('[parseNovelChapter] title:', content.title);

  if (container.length) {
    // Remove excluded elements (ads, navigation, etc.)
    if (excludeSelectors.length > 0) {
      excludeSelectors.forEach((selector) => {
        container.find(selector).remove();
      });
    }

    // Extract paragraphs
    container.find(paragraphSelector).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 0) {
        content.paragraphs.push(cleanText(text));
      }
    });

    console.log('[parseNovelChapter] paragraphs found:', content.paragraphs.length);

    // Join paragraphs into text
    content.text = content.paragraphs.join('\n\n');

    // Extract images if requested
    if (extractImages) {
      content.images = extractChapterImages($, {
        contentSelector,
        imageSelector: 'img',
        imageAttr: 'src',
      });
    }
  }

  // Extract navigation links
  const prevEl = $(prevSelector).first();
  const nextEl = $(nextSelector).first();

  // Check for disabled state
  const isPrevDisabled = prevEl.hasClass('disabled') ||
                         prevEl.hasClass('isDisabled') ||
                         prevEl.attr('disabled');

  const isNextDisabled = nextEl.hasClass('disabled') ||
                         nextEl.hasClass('isDisabled') ||
                         nextEl.attr('disabled');

  if (!isPrevDisabled) {
    const prevHref = prevEl.attr('href');
    if (prevHref && !prevHref.toLowerCase().startsWith('javascript')) {
      content.prevChapter = prevHref;
    }
  }

  if (!isNextDisabled) {
    const nextHref = nextEl.attr('href');
    if (nextHref && !nextHref.toLowerCase().startsWith('javascript')) {
      content.nextChapter = nextHref;
    }
  }

  return content;
};

/**
 * Parses chapter content in paginated format
 * Some sites split chapters across multiple pages
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed chapter data with pagination info
 */
export const parsePaginatedChapter = ($, config) => {
  const {
    // contentSelector is available for future use
    paginationSelector = '.pagination, .page-nav',
    currentPageSelector = '.current, .active',
  } = config;

  const baseContent = parseNovelChapter($, { ...config, extractImages: true });

  // Extract pagination info
  const pagination = {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    pages: [],
  };

  const paginationEl = $(paginationSelector);

  if (paginationEl.length) {
    // Find current page
    const currentEl = paginationEl.find(currentPageSelector).first();
    if (currentEl.length) {
      pagination.currentPage = parseInt(currentEl.text().trim(), 10) || 1;
    }

    // Find all page links
    paginationEl.find('a').each((_, el) => {
      const href = $(el).attr('href');
      const pageNum = parseInt($(el).text().trim(), 10);
      if (href && pageNum) {
        pagination.pages.push({ number: pageNum, url: href });
        pagination.totalPages = Math.max(pagination.totalPages, pageNum);
      }
    });

    // Check for next/prev
    pagination.hasNext = pagination.currentPage < pagination.totalPages;
    pagination.hasPrev = pagination.currentPage > 1;
  }

  return {
    ...baseContent,
    pagination,
  };
};

/**
 * Parses chapter content with HTML preserved
 * Useful for chapters with complex formatting
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed chapter data with HTML content
 */
export const parseChapterWithHtml = ($, config) => {
  const { contentSelector = '#content, .chapter-content, article' } = config;

  const baseContent = parseNovelChapter($, config);

  // Get raw HTML content
  const container = $(contentSelector).first();
  const htmlContent = container.html() || '';

  return {
    ...baseContent,
    html: htmlContent,
  };
};

/**
 * Creates the chapter data object for storage
 *
 * @param {Object} parsedData - Parsed data from parser functions
 * @param {Object} metadata - Additional metadata (chapter number, link, etc.)
 * @returns {Object} - Complete chapter data object
 */
export const createChapterData = (parsedData, metadata = {}) => ({
  title: parsedData.title || '',
  content: parsedData.text || '',
  paragraphs: parsedData.paragraphs || [],
  images: parsedData.images || [],
  prevChapter: parsedData.prevChapter || null,
  nextChapter: parsedData.nextChapter || null,
  chapterNumber: metadata.chapterNumber || 0,
  link: metadata.link || '',
  lastReadPosition: 0,
  downloadedAt: new Date().toISOString(),
});

/**
 * Parses NovelFire chapter format specifically
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed chapter data
 */
export const parseNovelFireChapter = ($, config = {}) => {
  return parseNovelChapter($, {
    contentSelector: '#content, .chapter-content',
    titleSelector: 'h4, h1.chapter-title, .chapter-title',
    prevSelector: '.prevchap, a.prev',
    nextSelector: '.nextchap, a.next',
    excludeSelectors: ['.ads', '.advertisement', '.ad-container'],
    ...config,
  });
};

/**
 * Parses ReadLightNovel chapter format
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Object} - Parsed chapter data
 */
export const parseReadLightNovelChapter = ($, config = {}) => {
  return parseNovelChapter($, {
    contentSelector: '.chapter-content, .text-content',
    titleSelector: 'h1, h2.chapter-title',
    prevSelector: '.prev a, a[rel="prev"]',
    nextSelector: '.next a, a[rel="next"]',
    excludeSelectors: ['.ads', '.ad-block'],
    ...config,
  });
};

const normalizeWTRLabParagraphs = rawContent => {
  if (Array.isArray(rawContent)) {
    return rawContent
      .flatMap(entry => {
        if (typeof entry === 'string') {
          return entry;
        }

        if (entry && typeof entry === 'object') {
          return (
            entry.text ||
            entry.content ||
            entry.body ||
            entry.value ||
            ''
          );
        }

        return '';
      })
      .map(text => cleanText(String(text || '').trim()))
      .filter(Boolean);
  }

  if (typeof rawContent !== 'string' || rawContent.length === 0) {
    return [];
  }

  const normalizedText = rawContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  return normalizedText
    .split(/\n\n+|\n+/)
    .map(paragraph => cleanText(paragraph.trim()))
    .filter(Boolean);
};

/**
 * WTR-Lab specific chapter parser
 * WTR-Lab has a unique structure where content may be in different containers
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @param {Object} readerApiData - Data from the WTR-Lab reader API (optional)
 * @param {Object} chapterMetadata - Chapter metadata from __NEXT_DATA__ (optional)
 * @returns {Object} - Parsed chapter data
 */
export const parseWTRLabChapter = ($, config = {}, readerApiData = null, chapterMetadata = null) => {
  console.log('[parseWTRLabChapter] Starting WTR-Lab chapter parsing');
  console.log('[parseWTRLabChapter] readerApiData:', readerApiData ? 'provided' : 'not provided');
  console.log('[parseWTRLabChapter] chapterMetadata:', chapterMetadata ? 'provided' : 'not provided');

  const content = {
    title: '',
    paragraphs: [],
    text: '',
    images: [],
    prevChapter: null,
    nextChapter: null,
  };

  // If we have reader API data, use it directly
  if (readerApiData) {
    console.log('[parseWTRLabChapter] Processing reader API data');
    console.log('[parseWTRLabChapter] readerApiData keys:', Object.keys(readerApiData));
    
    // Log the full response for debugging
    console.log('[parseWTRLabChapter] Full readerApiData:', JSON.stringify(readerApiData).substring(0, 2000));
    
    // The reader API returns: { success, chapter, data: { data: { body: "arr:..." } }, tasks }
    // The body field contains encrypted content with format: arr:base64:base64:base64...
    let chapterText = null;
    
    // Check for nested data.data.body structure (WTR-Lab specific)
    if (readerApiData.data?.data?.body) {
      console.log('[parseWTRLabChapter] Found data.data.body field');
      const bodyValue = readerApiData.data.data.body;
      console.log(
        '[parseWTRLabChapter] body value type:',
        Array.isArray(bodyValue) ? 'array' : typeof bodyValue,
      );
      console.log('[parseWTRLabChapter] body value preview:', String(bodyValue).substring(0, 200));
      
      // Check if it's the arr: encrypted format
      if (typeof bodyValue === 'string' && bodyValue.startsWith('arr:')) {
        console.log('[parseWTRLabChapter] Found arr: encrypted format');
        
        // Try to decrypt the arr: format
        const decrypted = decryptWTRLabContent(bodyValue);
        if (decrypted) {
          console.log('[parseWTRLabChapter] Successfully decrypted arr: content');
          chapterText = decrypted;
        } else {
          // Fallback: try to decode each segment
          console.log('[parseWTRLabChapter] Decryption failed, trying segment decoding');
          const segments = bodyValue.substring(4).split(':');
          console.log('[parseWTRLabChapter] Number of segments:', segments.length);
          
          // Try to decode each segment
          const decodedParts = [];
          for (let i = 0; i < segments.length; i++) {
            try {
              const decoded = base64Decode(segments[i]);
              console.log(`[parseWTRLabChapter] Segment ${i} decoded length:`, decoded.length);
              console.log(`[parseWTRLabChapter] Segment ${i} preview:`, decoded.substring(0, 100));
              decodedParts.push(decoded);
            } catch (e) {
              console.log(`[parseWTRLabChapter] Failed to decode segment ${i}:`, e.message);
            }
          }
          
          // The content might be in one of the decoded segments
          for (const part of decodedParts) {
            if (part && part.length > 100 && !part.includes('\x00') && /[a-zA-Z]{10,}/.test(part)) {
              console.log('[parseWTRLabChapter] Found text-like content in decoded segment');
              chapterText = part;
              break;
            }
          }
          
          // If no text found, try combining all decoded parts
          if (!chapterText && decodedParts.length > 0) {
            chapterText = decodedParts.join('');
          }
        }
      } else {
        // Not arr: format, use directly. AI mode now returns an array of paragraphs.
        chapterText = bodyValue;
      }
    }
    
    // Check for data.data.content as fallback
    if (!chapterText && readerApiData.data?.data?.content) {
      console.log('[parseWTRLabChapter] Found data.data.content field');
      chapterText = readerApiData.data.data.content;
    }
    
    // Check for 'data' field which might contain the content
    if (!chapterText && readerApiData.data) {
      console.log('[parseWTRLabChapter] Found data field, type:', typeof readerApiData.data);
      if (typeof readerApiData.data === 'string') {
        chapterText = readerApiData.data;
      } else if (typeof readerApiData.data === 'object') {
        // Data might be an object with content inside
        chapterText = readerApiData.data.content || 
                      readerApiData.data.text || 
                      readerApiData.data.body ||
                      readerApiData.data.html ||
                      readerApiData.data.chapter_text;
        console.log('[parseWTRLabChapter] data object keys:', Object.keys(readerApiData.data));
      }
    }
    
    // Check other common field names
    if (!chapterText) {
      chapterText = readerApiData.content ||
                    readerApiData.text ||
                    readerApiData.body ||
                    readerApiData.html ||
                    readerApiData.chapter_text ||
                    readerApiData.chapter_content;
    }
    
    // Check for 'encrypted' or 'encoded' data that needs decoding
    if (!chapterText && readerApiData.encrypted) {
      console.log('[parseWTRLabChapter] Found encrypted field');
      try {
        const decoded = base64Decode(readerApiData.encrypted);
        console.log('[parseWTRLabChapter] Decoded encrypted data length:', decoded.length);
        chapterText = decoded;
      } catch (e) {
        console.log('[parseWTRLabChapter] Failed to decode encrypted data:', e.message);
      }
    }
    
    // Check for 'encoded' field
    if (!chapterText && readerApiData.encoded) {
      console.log('[parseWTRLabChapter] Found encoded field');
      try {
        const decoded = base64Decode(readerApiData.encoded);
        console.log('[parseWTRLabChapter] Decoded encoded data length:', decoded.length);
        chapterText = decoded;
      } catch (e) {
        console.log('[parseWTRLabChapter] Failed to decode encoded data:', e.message);
      }
    }
    
    // Check for 'raw' field
    if (!chapterText && readerApiData.raw) {
      console.log('[parseWTRLabChapter] Found raw field');
      chapterText = readerApiData.raw;
    }
    
    // Check for 'result' field
    if (!chapterText && readerApiData.result) {
      console.log('[parseWTRLabChapter] Found result field');
      if (typeof readerApiData.result === 'string') {
        chapterText = readerApiData.result;
      } else if (typeof readerApiData.result === 'object') {
        chapterText = readerApiData.result.content ||
                      readerApiData.result.text ||
                      readerApiData.result.body ||
                      readerApiData.result.data;
      }
    }
    
    // Check for 'chapter' field
    if (!chapterText && readerApiData.chapter) {
      console.log('[parseWTRLabChapter] Found chapter field');
      if (typeof readerApiData.chapter === 'string') {
        chapterText = readerApiData.chapter;
      } else if (typeof readerApiData.chapter === 'object') {
        chapterText = readerApiData.chapter.content ||
                      readerApiData.chapter.text ||
                      readerApiData.chapter.body ||
                      readerApiData.chapter.data;
      }
    }
    
    // Check for 'html' field directly
    if (!chapterText && readerApiData.html) {
      console.log('[parseWTRLabChapter] Found html field');
      chapterText = readerApiData.html;
    }
    
    // If we found chapter text, process it
    const normalizedParagraphs = normalizeWTRLabParagraphs(chapterText);

    if (normalizedParagraphs.length > 0) {
      console.log(
        '[parseWTRLabChapter] Found chapter text, paragraphs:',
        normalizedParagraphs.length,
      );
      console.log(
        '[parseWTRLabChapter] Chapter text preview:',
        normalizedParagraphs.join('\n\n').substring(0, 300),
      );

      content.paragraphs = normalizedParagraphs;
      content.text = content.paragraphs.join('\n\n');

      console.log('[parseWTRLabChapter] Extracted from reader API - paragraphs:', content.paragraphs.length);
      console.log('[parseWTRLabChapter] First paragraph preview:', content.paragraphs[0] ? content.paragraphs[0].substring(0, 100) : 'empty');
    } else {
      console.log('[parseWTRLabChapter] No chapter text found in reader API data');
      console.log('[parseWTRLabChapter] Available fields:', Object.keys(readerApiData));
      
      // Log all field values to find content
      for (const [key, value] of Object.entries(readerApiData)) {
        if (typeof value === 'string') {
          console.log(`[parseWTRLabChapter] Field '${key}' (string):`, value.substring(0, 200));
        } else if (typeof value === 'object' && value !== null) {
          console.log(`[parseWTRLabChapter] Field '${key}' (object):`, JSON.stringify(value).substring(0, 200));
        } else {
          console.log(`[parseWTRLabChapter] Field '${key}':`, value);
        }
      }
    }
    
    // Get title from metadata or reader data
    content.title = chapterMetadata?.title || 
                    readerApiData.title || 
                    readerApiData.chapter_title ||
                    content.title;
    
    // If we found content, return it
    if (content.paragraphs.length > 0) {
      console.log('[parseWTRLabChapter] Successfully extracted from reader API');
      return content;
    }
  }

  // WTR-Lab is a Next.js app - try to extract content from __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__').html();
  if (nextDataScript) {
    try {
      console.log('[parseWTRLabChapter] Found __NEXT_DATA__');
      const nextData = JSON.parse(nextDataScript);
      console.log('[parseWTRLabChapter] __NEXT_DATA__ keys:', Object.keys(nextData));

      // Navigate through the Next.js data structure to find chapter content
      const props = nextData?.props || {};
      const pageProps = props?.pageProps || {};

      console.log('[parseWTRLabChapter] pageProps keys:', Object.keys(pageProps));

      // Log the FULL pageProps for debugging
      console.log('[parseWTRLabChapter] FULL pageProps:', JSON.stringify(pageProps, null, 2).substring(0, 2000));

      // WTR-Lab stores data in 'serie' key
      const serie = pageProps?.serie || {};

      console.log('[parseWTRLabChapter] serie keys:', Object.keys(serie));

      // Log the FULL serie object for debugging
      console.log('[parseWTRLabChapter] FULL serie:', JSON.stringify(serie, null, 2).substring(0, 3000));

      // Look for chapter content in serie
      if (serie) {
        // Check for serie_data - this might contain the content
        const serieData = serie?.serie_data || null;
        if (serieData) {
          console.log('[parseWTRLabChapter] serie_data keys:', Object.keys(serieData));
          console.log('[parseWTRLabChapter] FULL serie_data:', JSON.stringify(serieData, null, 2).substring(0, 2000));
          
          // Check for content in serie_data
          if (serieData.data) {
            console.log('[parseWTRLabChapter] serie_data.data keys:', Object.keys(serieData.data));
            console.log('[parseWTRLabChapter] serie_data.data:', JSON.stringify(serieData.data, null, 2).substring(0, 2000));
          }
        }
        
        // Check for chapter data
        const chapterData = serie?.chapter || serie?.currentChapter || null;
        console.log('[parseWTRLabChapter] chapterData:', chapterData ? 'found' : 'not found');

        if (chapterData) {
          console.log('[parseWTRLabChapter] chapterData keys:', Object.keys(chapterData));
          console.log('[parseWTRLabChapter] FULL chapterData:', JSON.stringify(chapterData, null, 2));

          // Extract title
          content.title = chapterData.title || chapterData.name || chapterData.chapterTitle || '';

          // Extract text content - WTR-Lab stores content in 'code' field
          let chapterText = chapterData.code ||
                            chapterData.content ||
                            chapterData.text ||
                            chapterData.body ||
                            chapterData.html ||
                            '';
          
          console.log('[parseWTRLabChapter] chapterText length:', chapterText ? chapterText.length : 0);
          console.log('[parseWTRLabChapter] chapterText preview:', chapterText ? chapterText.substring(0, 200) : 'empty');

          if (chapterText && typeof chapterText === 'string' && chapterText.length > 10) {
            // Handle HTML entities and tags
            chapterText = chapterText
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\\n/g, '\n') // Handle escaped newlines
              .replace(/\r\n/g, '\n');

            // Split into paragraphs
            const paragraphs = chapterText.split(/\n\n+|\n+/).filter(p => p.trim().length > 0);
            content.paragraphs = paragraphs.map(p => cleanText(p.trim()));
            content.text = content.paragraphs.join('\n\n');

            console.log('[parseWTRLabChapter] Extracted from chapterData - paragraphs:', content.paragraphs.length);
            console.log('[parseWTRLabChapter] First paragraph preview:', content.paragraphs[0] ? content.paragraphs[0].substring(0, 100) : 'empty');
            return content; // Return early since we found content
          }
        }
        
        // Check for API data fetched by Reader.js
        if ($._wtrLabApiData) {
          console.log('[parseWTRLabChapter] Found API data from Reader.js');
          const apiData = $._wtrLabApiData;
          console.log('[parseWTRLabChapter] API data keys:', Object.keys(apiData));
          
          // Try to extract content from API response
          let apiContent = apiData.content || apiData.text || apiData.body || 
                          apiData.code || apiData.data?.content || apiData.data?.text ||
                          apiData.chapter?.content || apiData.chapter?.text;
          
          if (apiContent && typeof apiContent === 'string' && apiContent.length > 10) {
            console.log('[parseWTRLabChapter] API content length:', apiContent.length);
            console.log('[parseWTRLabChapter] API content preview:', apiContent.substring(0, 200));
            
            // Handle HTML entities and tags
            apiContent = apiContent
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\\n/g, '\n')
              .replace(/\r\n/g, '\n');

            const paragraphs = apiContent.split(/\n\n+|\n+/).filter(p => p.trim().length > 0);
            content.paragraphs = paragraphs.map(p => cleanText(p.trim()));
            content.text = content.paragraphs.join('\n\n');
            
            // Get title from API if available
            content.title = apiData.title || apiData.name || apiData.chapter?.title || content.title;
            
            console.log('[parseWTRLabChapter] Extracted from API - paragraphs:', content.paragraphs.length);
            return content;
          }
        }

        // If no chapter data, check for chapters array and find current chapter
        if (!content.text && serie?.chapters) {
          console.log('[parseWTRLabChapter] Found chapters array, length:', serie.chapters.length);
        }

        // Check for content directly in serie
        if (!content.text && serie?.content) {
          console.log('[parseWTRLabChapter] Found content in serie');
          let chapterText = serie.content;
          if (typeof chapterText === 'string') {
            chapterText = chapterText.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n');
            chapterText = chapterText.replace(/<[^>]+>/g, '');
            const paragraphs = chapterText.split(/\n\n+|\n+/).filter(p => p.trim().length > 0);
            content.paragraphs = paragraphs.map(p => cleanText(p.trim()));
            content.text = content.paragraphs.join('\n\n');
          }
        }

        // Extract title from serie if not found
        if (!content.title && serie?.title) {
          content.title = serie.title;
        }
      }

      // Look for chapter content in various possible locations
      if (!content.text) {
        let chapterData = pageProps?.chapter ||
                           pageProps?.content ||
                           pageProps?.chapterContent ||
                           pageProps?.data?.chapter ||
                           null;

        if (chapterData) {
          console.log('[parseWTRLabChapter] Found chapterData keys:', Object.keys(chapterData));

          // Extract title
          content.title = chapterData.title || chapterData.name || chapterData.chapterTitle || '';

          // Extract text content - WTR-Lab stores content in 'code' field
          let chapterText = chapterData.code ||
                            chapterData.content ||
                            chapterData.text ||
                            chapterData.body ||
                            chapterData.html ||
                            '';

          if (chapterText && typeof chapterText === 'string') {
            // Handle HTML entities and tags
            chapterText = chapterText
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\\n/g, '\n') // Handle escaped newlines
              .replace(/\r\n/g, '\n');

            // Split into paragraphs
            const paragraphs = chapterText.split(/\n\n+|\n+/).filter(p => p.trim().length > 0);
            content.paragraphs = paragraphs.map(p => cleanText(p.trim()));
            content.text = content.paragraphs.join('\n\n');

            console.log('[parseWTRLabChapter] Extracted from __NEXT_DATA__ - paragraphs:', content.paragraphs.length);
          }
        }
      }
    } catch (e) {
      console.log('[parseWTRLabChapter] Error parsing __NEXT_DATA__:', e.message);
    }
  }

  // If we found content from __NEXT_DATA__, return it
  if (content.text && content.paragraphs.length > 0) {
    console.log('[parseWTRLabChapter] Successfully extracted from __NEXT_DATA__');
    return content;
  }

  // Fallback: Try to extract from HTML directly
  console.log('[parseWTRLabChapter] __NEXT_DATA__ not found or empty, trying HTML extraction');

  // Extract title - WTR-Lab typically has title in h1 or h2
  const titleSelectors = ['h1', 'h2', '.chapter-title', 'h3'];
  for (const selector of titleSelectors) {
    const titleEl = $(selector).first();
    const titleText = titleEl.text().trim();
    if (titleText && titleText.length > 5 && !titleText.toLowerCase().includes('wtr-lab')) {
      content.title = titleText;
      console.log('[parseWTRLabChapter] Found title:', content.title.substring(0, 50));
      break;
    }
  }

  // WTR-Lab content selectors to try - be more aggressive
  const contentSelectors = [
    // WTR-Lab specific - try these first
    'div[class*="chapter"]',
    'div[class*="content"]',
    'div[class*="reader"]',
    'div[class*="text"]',
    'div[class*="novel"]',
    // Standard selectors
    '.chapter-content',
    'article',
    '.content',
    '.chapter-body',
    '.text-content',
    'main',
    '#content',
    '.chapter-text',
    '.reader-content',
    '.novel-content',
    '.text-reader',
    // Very broad selectors
    'section',
    '.post',
    '.entry-content',
    '.post-content',
  ];

  let container = null;
  let foundContent = false;

  // Try each selector
  for (const selector of contentSelectors) {
    const elements = $(selector);
    elements.each((i, el) => {
      const $el = $(el);
      const paragraphs = $el.find('p');
      const text = $el.text().trim();
      const divCount = $el.find('div').length;
      
      // Log for debugging
      if (text.length > 100) {
        console.log('[parseWTRLabChapter] Selector:', selector, 'element:', i, 'text length:', text.length, 'paragraphs:', paragraphs.length, 'child divs:', divCount);
      }
      
      // Look for content with substantial text or paragraphs
      // Also check if this div has direct text content (not just nested divs)
      const directText = $el.clone().children().remove().end().text().trim();
      
      if ((paragraphs.length >= 3 || text.length > 1000) && !foundContent) {
        // Check if this looks like chapter content
        const lowerText = text.toLowerCase();
        const isNavigation = lowerText.includes('prev ch') && lowerText.includes('next ch');
        const isFooter = lowerText.includes('copyright') && lowerText.includes('wtr-lab');
        
        if (!isNavigation && !isFooter) {
          container = $el;
          console.log('[parseWTRLabChapter] Found content with selector:', selector, 'element:', i);
          console.log('[parseWTRLabChapter] Content preview:', text.substring(0, 300));
          foundContent = true;
          return false; // Break the each loop
        }
      }
    });
    
    if (foundContent) break;
  }

  // If no container found with standard selectors, try to find all paragraphs in body
  if (!foundContent) {
    console.log('[parseWTRLabChapter] No standard container found, trying body paragraphs');

    // Get all paragraphs from body, excluding navigation and footer
    const allParagraphs = $('body').find('p').not('footer p').not('nav p').not('.footer p').not('.nav p');

    console.log('[parseWTRLabChapter] Found body paragraphs:', allParagraphs.length);
    
    // Log each paragraph for debugging
    allParagraphs.each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        console.log('[parseWTRLabChapter] Paragraph', i, ':', text.substring(0, 100));
      }
    });

    // Filter out short paragraphs and navigation text
    // WTR-Lab has many short paragraphs, so use a lower threshold
    const validParagraphs = [];
    allParagraphs.each((_, el) => {
      const text = $(el).text().trim();
      // Accept paragraphs > 5 characters that aren't navigation
      // WTR-Lab has short sentences like "hot.", "It's hot."
      if (text.length > 5 &&
          !text.toLowerCase().includes('prev ch') &&
          !text.toLowerCase().includes('next ch') &&
          !text.toLowerCase().match(/^chapter\s*\d+\s*\//) &&
          !text.includes('Problematic ad?') &&
          !text.includes('Become a contributor') &&
          !text.includes('Copyright ©') &&
          !text.includes('wtr-lab.com') &&
          !text.toLowerCase().includes('report it here') &&
          !text.toLowerCase().includes('disable popup')) {
        validParagraphs.push(text);
      }
    });

    console.log('[parseWTRLabChapter] Valid paragraphs after filtering:', validParagraphs.length);

    if (validParagraphs.length >= 3) {
      content.paragraphs = validParagraphs.map(p => cleanText(p));
      content.text = content.paragraphs.join('\n\n');
      foundContent = true;
    }
  }
  
  // If still no content, try extracting text directly from body
  // WTR-Lab might not use <p> tags
  if (!foundContent) {
    console.log('[parseWTRLabChapter] Trying to extract text directly from body');
    
    // Get the raw HTML from body for inspection
    const bodyHtml = $('body').html() || '';
    console.log('[parseWTRLabChapter] Body HTML length for raw extraction:', bodyHtml.length);
    console.log('[parseWTRLabChapter] Body HTML preview:', bodyHtml.substring(0, 1000));
    
    // Get the body text BEFORE removing elements
    const bodyTextBeforeCleanup = $('body').text();
    console.log('[parseWTRLabChapter] Body text length before cleanup:', bodyTextBeforeCleanup.length);
    console.log('[parseWTRLabChapter] Body text preview:', bodyTextBeforeCleanup.substring(0, 500));
    
    // Check if the chapter content is actually in the body
    const contentIndicators = ['Fang Xiaoluo', 'On the 23rd day', 'hot', 'It\'s hot', 'Traveling Through Time'];
    for (const indicator of contentIndicators) {
      if (bodyTextBeforeCleanup.includes(indicator)) {
        console.log('[parseWTRLabChapter] Found indicator in body text:', indicator);
      }
      if (bodyHtml.includes(indicator)) {
        console.log('[parseWTRLabChapter] Found indicator in body HTML:', indicator);
        const idx = bodyHtml.indexOf(indicator);
        console.log('[parseWTRLabChapter] Context around', indicator, ':', bodyHtml.substring(Math.max(0, idx - 200), idx + 300));
      }
    }
    
    // Try to find the content container by looking for specific patterns
    // WTR-Lab content might be in a specific div structure
    console.log('[parseWTRLabChapter] Searching for content in all elements...');
    
    // Search all elements for chapter content
    $('*').each((i, el) => {
      const $el = $(el);
      const tagName = el.tagName?.toLowerCase();
      const text = $el.text().trim();
      const className = $el.attr('class') || '';
      
      // Skip script, style, and navigation elements
      if (['script', 'style', 'nav', 'footer', 'header'].includes(tagName)) {
        return;
      }
      
      // Look for elements containing chapter content indicators
      if (text.length > 100 && (
        text.includes('Fang Xiaoluo') ||
        text.includes('hot') ||
        text.includes('Traveling Through Time')
      )) {
        console.log('[parseWTRLabChapter] Found content in element:', tagName, 'class:', className);
        console.log('[parseWTRLabChapter] Element text length:', text.length);
        console.log('[parseWTRLabChapter] Element text preview:', text.substring(0, 300));
      }
    });
    
    // Split by newlines and filter
    const lines = bodyTextBeforeCleanup.split(/\n+/);
    const validLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Filter out short lines, navigation, and common non-content text
      // Be more lenient - accept lines > 5 chars that don't match navigation patterns
      // WTR-Lab has short sentences like "hot.", "It's hot."
      if (trimmed.length > 5 &&
          !trimmed.toLowerCase().includes('prev ch') &&
          !trimmed.toLowerCase().includes('next ch') &&
          !trimmed.toLowerCase().match(/^\d+\s*\/\s*\d+/) &&
          !trimmed.includes('Problematic ad?') &&
          !trimmed.includes('Become a contributor') &&
          !trimmed.includes('Copyright ©') &&
          !trimmed.includes('wtr-lab.com') &&
          !trimmed.toLowerCase().includes('intro') &&
          !trimmed.toLowerCase().includes('about us') &&
          !trimmed.toLowerCase().includes('contact us') &&
          !trimmed.toLowerCase().includes('privacy policy') &&
          !trimmed.toLowerCase().includes('terms of use') &&
          !trimmed.toLowerCase().includes('cookie policy') &&
          !trimmed.toLowerCase().includes('changelog') &&
          !trimmed.toLowerCase().includes('dmca') &&
          !trimmed.includes('ads by') &&
          !trimmed.includes('Pubfuture') &&
          !trimmed.toLowerCase().includes('report it here') &&
          !trimmed.toLowerCase().includes('disable popup') &&
          !trimmed.match(/^\[Image/i) &&
          !trimmed.match(/^image$/i)) {
        validLines.push(trimmed);
      }
    }
    
    console.log('[parseWTRLabChapter] Valid lines from body:', validLines.length);
    if (validLines.length > 0) {
      console.log('[parseWTRLabChapter] First 3 lines:', validLines.slice(0, 3));
    }
    
    if (validLines.length >= 3) {
      content.paragraphs = validLines.map(p => cleanText(p));
      content.text = content.paragraphs.join('\n\n');
      foundContent = true;
    }
  }

  // If we found a container, extract paragraphs from it
  if (container && !content.paragraphs.length) {
    container.find('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        content.paragraphs.push(cleanText(text));
      }
    });

    // If still no paragraphs, try getting text directly
    if (content.paragraphs.length === 0) {
      const directText = container.text().trim();
      if (directText && directText.length > 100) {
        // Split by double newlines or common paragraph separators
        const parts = directText.split(/\n\n+|\r\n\r\n+/);
        parts.forEach(part => {
          const cleaned = cleanText(part);
          if (cleaned && cleaned.length > 10) {
            content.paragraphs.push(cleaned);
          }
        });
      }
    }

    content.text = content.paragraphs.join('\n\n');
  }
  
  // LAST RESORT: If still no content, try to extract from raw HTML
  // This handles cases where cheerio parsing fails but content is in HTML
  if (!foundContent || content.paragraphs.length < 3) {
    console.log('[parseWTRLabChapter] Trying raw HTML extraction as last resort');
    
    // Get the raw HTML from body
    const bodyHtml = $('body').html() || '';
    console.log('[parseWTRLabChapter] Body HTML length for raw extraction:', bodyHtml.length);
    
    // Look for text between specific patterns
    // WTR-Lab content is often in divs without specific classes
    // Try to find text that looks like chapter content
    
    // Method 1: Extract text between common patterns
    // Remove script and style tags first
    let cleanHtml = bodyHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
    
    // Extract text content from remaining HTML
    // Handle <br> and </p> as paragraph breaks
    cleanHtml = cleanHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, ' ') // Remove remaining tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('[parseWTRLabChapter] Clean HTML text length:', cleanHtml.length);
    console.log('[parseWTRLabChapter] Clean HTML preview:', cleanHtml.substring(0, 500));
    
    // Split into paragraphs and filter
    const rawParagraphs = cleanHtml.split(/\n+/).map(p => p.trim()).filter(p => {
      // Filter out navigation, footer, and short text
      // WTR-Lab has short sentences, so use lower threshold
      const lowerP = p.toLowerCase();
      return p.length > 5 &&
        !lowerP.includes('prev ch') &&
        !lowerP.includes('next ch') &&
        !lowerP.includes('copyright') &&
        !lowerP.includes('wtr-lab.com') &&
        !lowerP.includes('problematic ad') &&
        !lowerP.includes('become a contributor') &&
        !lowerP.includes('intro') &&
        !lowerP.includes('about us') &&
        !lowerP.includes('contact us') &&
        !lowerP.includes('privacy policy') &&
        !lowerP.includes('terms of use') &&
        !lowerP.includes('cookie policy') &&
        !lowerP.includes('changelog') &&
        !lowerP.includes('dmca') &&
        !lowerP.includes('ads by') &&
        !lowerP.includes('pubfuture') &&
        !lowerP.match(/^\d+\s*\/\s*\d+/) &&
        !lowerP.match(/^\[image/i) &&
        !lowerP.includes('report it here') &&
        !lowerP.includes('disable popup') &&
        !lowerP.match(/^image$/i);
    });
    
    console.log('[parseWTRLabChapter] Raw paragraphs extracted:', rawParagraphs.length);
    if (rawParagraphs.length > 0) {
      console.log('[parseWTRLabChapter] First 3 raw paragraphs:', rawParagraphs.slice(0, 3));
    }
    
    if (rawParagraphs.length >= 3) {
      content.paragraphs = rawParagraphs;
      content.text = content.paragraphs.join('\n\n');
      foundContent = true;
    }
  }

  console.log('[parseWTRLabChapter] Final paragraphs count:', content.paragraphs.length);
  console.log('[parseWTRLabChapter] Text length:', content.text.length);

  // Extract navigation links
  // WTR-Lab has "Prev" and "Next" links
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim().toLowerCase();

    if (href && !href.toLowerCase().startsWith('javascript')) {
      if (text === 'prev' || text.includes('prev ch')) {
        content.prevChapter = href;
        console.log('[parseWTRLabChapter] Found prev chapter:', href);
      } else if (text === 'next' || text.includes('next ch')) {
        content.nextChapter = href;
        console.log('[parseWTRLabChapter] Found next chapter:', href);
      }
    }
  });

  // Also try standard navigation selectors
  if (!content.prevChapter) {
    const prevEl = $('a:contains("Prev"), a.prev, a[rel="prev"]').first();
    const prevHref = prevEl.attr('href');
    if (prevHref && !prevHref.toLowerCase().startsWith('javascript')) {
      content.prevChapter = prevHref;
    }
  }

  if (!content.nextChapter) {
    const nextEl = $('a:contains("Next"), a.next, a[rel="next"]').first();
    const nextHref = nextEl.attr('href');
    if (nextHref && !nextHref.toLowerCase().startsWith('javascript')) {
      content.nextChapter = nextHref;
    }
  }

  return content;
};

export default {
  parseNovelChapter,
  extractChapterText,
  extractChapterImages,
  parsePaginatedChapter,
  parseChapterWithHtml,
  createChapterData,
  parseNovelFireChapter,
  parseReadLightNovelChapter,
  parseWTRLabChapter,
};
