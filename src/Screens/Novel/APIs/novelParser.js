/**
 * NovelFire.net HTML Parser
 * Parses HTML responses from novelfire.net
 */

const NOVELFIRE_BASE = 'https://novelfire.net';

/**
 * Extract text content from HTML string
 */
const extractText = (html, pattern, groupIndex = 1) => {
  const match = html.match(pattern);
  return match ? match[groupIndex]?.trim() : null;
};

/**
 * Extract all matches from HTML string
 */
const extractAllMatches = (html, pattern) => {
  const matches = [];
  let match;
  const regex = new RegExp(pattern.source, pattern.flags);
  while ((match = regex.exec(html)) !== null) {
    matches.push(match);
  }
  return matches;
};

/**
 * Clean HTML entities and tags from text
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Parse novel card from HTML
 */
const parseNovelCard = (cardHtml) => {
  if (!cardHtml) return null;

  const linkMatch = cardHtml.match(/href="([^"]*\/book\/[^"]+)"/);
  
  // Handle both src and data-src for lazy loading, and relative URLs
  let coverImage = null;
  const imageMatch = cardHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                     cardHtml.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
  if (imageMatch?.[1]) {
    // Handle relative URLs
    if (imageMatch[1].startsWith('/')) {
      coverImage = `${NOVELFIRE_BASE}${imageMatch[1]}`;
    } else if (imageMatch[1].startsWith('http')) {
      coverImage = imageMatch[1];
    } else {
      coverImage = `${NOVELFIRE_BASE}/${imageMatch[1]}`;
    }
  }
  
  const titleMatch = cardHtml.match(/title="([^"]+)"/) ||
                     cardHtml.match(/<h[34][^>]*class="[^"]*novel-title[^"]*"[^>]*>([^<]+)<\/h[34]>/i) ||
                     cardHtml.match(/<h[34][^>]*>([^<]+)<\/h[34]>/);
  
  // Rating from badge: <span class="badge _br"><i class="icon-star"></i>4.7</span>
  const ratingMatch = cardHtml.match(/<i class="icon-star"><\/i>(\d+\.?\d*)/i) ||
                      cardHtml.match(/rating["\s:]+(\d+\.?\d*)/i) ||
                      cardHtml.match(/(\d+\.?\d*)\s*<i[^>]*class="[^"]*star[^"]*"/i);
  
  // Chapters: <span>238 Chapters</span>
  const chaptersMatch = cardHtml.match(/(\d+)\s*Chapters/i) ||
                        cardHtml.match(/(\d+)\s*chapters/i);
  
  const authorMatch = cardHtml.match(/author["\s:]+([^"<,]+)/i) ||
                      cardHtml.match(/<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i);
  
  const statusMatch = cardHtml.match(/status["\s:]+(\w+)/i) ||
                      cardHtml.match(/<span[^>]*class="[^"]*status[^"]*"[^>]*>([^<]+)<\/span>/i);

  return {
    title: cleanText(titleMatch?.[1]),
    link: linkMatch ? `${NOVELFIRE_BASE}${linkMatch[1]}` : null,
    coverImage,
    author: cleanText(authorMatch?.[1]),
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    chapters: chaptersMatch ? parseInt(chaptersMatch[1], 10) : null,
    status: cleanText(statusMatch?.[1]) || 'Ongoing',
  };
};

/**
 * Parse home page sections
 */
export const parseNovelHome = (html) => {
  if (!html) return null;

  const sections = [];

  // Helper function to parse novels from a section
  const parseNovelsFromSection = (sectionHtml) => {
    const novels = [];
    
    // Find all novel items: <li class="novel-item">...</li>
    const novelItemPattern = /<li[^>]*class="[^"]*novel-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    const novelMatches = extractAllMatches(sectionHtml, novelItemPattern);

    novelMatches.forEach((match) => {
      const novel = parseNovelCard(match[1]);
      if (novel?.title && novel?.link) {
        novels.push(novel);
      }
    });

    // Also try finding novel links directly
    if (novels.length === 0) {
      const novelLinkPattern = /<a[^>]*href="\/book\/[^"]+"[^>]*>([\s\S]*?)<\/a>/gi;
      const linkMatches = extractAllMatches(sectionHtml, novelLinkPattern);

      linkMatches.forEach((match) => {
        const novel = parseNovelCard(match[0]);
        if (novel?.title && novel?.link) {
          novels.push(novel);
        }
      });
    }

    return novels;
  };

  // Parse Recommends section
  const recommendsMatch = html.match(/<h3[^>]*>Recommends<\/h3>[\s\S]*?<div class="section-body">([\s\S]*?)<\/div>\s*<\/section>/i);
  if (recommendsMatch) {
    const novels = parseNovelsFromSection(recommendsMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'Recommends', novels });
    }
  }

  // Parse Ranking section (contains Most Read, New Trend, User Rated tabs)
  const rankingMatch = html.match(/<h3><span>Most Read<\/span><\/h3>([\s\S]*?)<h3>/i);
  if (rankingMatch) {
    const novels = parseNovelsFromSection(rankingMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'Most Read', novels });
    }
  }

  // Parse New Trend tab
  const newTrendMatch = html.match(/<h3><span>New Trend<\/span><\/h3>([\s\S]*?)(?:<h3>|<\/div>\s*<\/div>)/i);
  if (newTrendMatch) {
    const novels = parseNovelsFromSection(newTrendMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'New Trend', novels });
    }
  }

  // Parse User Rated tab
  const userRatedMatch = html.match(/<h3><span>User Rated<\/span><\/h3>([\s\S]*?)(?:<h3>|<\/div>\s*<\/div>)/i);
  if (userRatedMatch) {
    const novels = parseNovelsFromSection(userRatedMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'User Rated', novels });
    }
  }

  // Parse Latest Novels section
  const latestMatch = html.match(/<h3[^>]*>Latest Novels<\/h3>[\s\S]*?<div class="section-body"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/i);
  if (latestMatch) {
    const novels = parseNovelsFromSection(latestMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'Latest Novels', novels });
    }
  }

  // Parse Completed Stories section
  const completedMatch = html.match(/<h3[^>]*>Completed Stories<\/h3>[\s\S]*?<div class="section-body"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/i);
  if (completedMatch) {
    const novels = parseNovelsFromSection(completedMatch[1]);
    if (novels.length > 0) {
      sections.push({ name: 'Completed Stories', novels });
    }
  }

  // Fallback: If no sections found, try to parse all novels on page
  if (sections.length === 0) {
    const allNovels = [];
    const novelItemPattern = /<li[^>]*class="[^"]*novel-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    const novelMatches = extractAllMatches(html, novelItemPattern);

    novelMatches.forEach((match) => {
      const novel = parseNovelCard(match[1]);
      if (novel?.title && novel?.link) {
        allNovels.push(novel);
      }
    });

    if (allNovels.length > 0) {
      sections.push({ name: 'Featured', novels: allNovels.slice(0, 20) });
    }
  }

  return sections.length > 0 ? sections : null;
};

/**
 * Parse novel details page
 */
export const parseNovelDetails = (html) => {
  if (!html) return null;

  // Extract title
  const titleMatch = html.match(/<h1[^>]*class="[^"]*novel-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

  // Extract author - novelfire uses: <div class="author"><span>Author:</span> <a href="/author/..."><span itemprop="author">AuthorName</span></a>
  const authorMatch = html.match(/<div class="author">[\s\S]*?<span itemprop="author">([^<]+)<\/span>/i) ||
                      html.match(/<a[^>]*href="\/author\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i);

  // Extract cover image - novelfire uses: https://novelfire.net/server-1/{slug}.jpg
  const imageMatch = html.match(/src="(https:\/\/novelfire\.net\/server-[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                     html.match(/og:image" content="([^"]+)"/i);

  // Extract rating - novelfire uses: <strong class="nub">4.7</strong>
  const ratingMatch = html.match(/<strong class="nub">(\d+\.?\d*)<\/strong>/i) ||
                      html.match(/"ratingValue":"(\d+\.?\d*)"/i);

  // Extract chapters count - novelfire uses: <i class="icon-book-open"></i> 238</strong><small>Chapters</small>
  const chaptersMatch = html.match(/<i class="icon-book-open"><\/i>\s*(\d+)<\/strong>/i) ||
                        html.match(/(\d+)\s*<\/strong><small>Chapters<\/small>/i);

  // Extract views - novelfire uses: <i class="icon-eye"></i> 42.1K</strong>
  const viewsMatch = html.match(/<i class="icon-eye"><\/i>\s*([\d.]+[KM]?)<\/strong>/i) ||
                     html.match(/icon-eye[^>]*>\s*([\d.]+[KM]?)\s*<\/strong>/i);

  // Extract bookmarked count - novelfire uses: <i class="icon-bookmark"></i> 544</strong>
  const bookmarkedMatch = html.match(/<i class="icon-bookmark"><\/i>\s*(\d+)<\/strong>/i);

  // Extract status - novelfire uses: <strong class="ongoing">Ongoing</strong> or <strong class="completed">Completed</strong>
  const statusMatch = html.match(/<strong class="(ongoing|completed|hiatus)">([^<]+)<\/strong>/i);

  // Extract summary - novelfire uses: <div class="content expand-wrapper"><p>...</p></div>
  const summaryMatch = html.match(/<div class="content expand-wrapper">([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  // Extract genres - novelfire uses: <a href="/genre-fantasy/..." class="property-item">Fantasy</a>
  const genres = [];
  const genrePattern = /<a[^>]*href="\/genre-[^"]+"[^>]*class="property-item"[^>]*>([^<]+)<\/a>/gi;
  const genreMatches = extractAllMatches(html, genrePattern);
  genreMatches.forEach((match) => {
    const genre = cleanText(match[1]);
    if (genre) genres.push(genre);
  });

  // Extract chapters (first few from details page)
  const chapters = [];
  const chapterPattern = /<a[^>]*href="(\/book\/[^"]+\/chapter-\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const chapterMatches = extractAllMatches(html, chapterPattern);

  chapterMatches.forEach((match, index) => {
    const chapterLink = match[1];
    const chapterTitleMatch = match[2].match(/>([^<]+)</) || match[2].match(/Chapter\s*(\d+)/i);
    const chapterNumberMatch = chapterLink.match(/chapter-(\d+)/i);

    chapters.push({
      number: chapterNumberMatch ? parseInt(chapterNumberMatch[1], 10) : index + 1,
      title: cleanText(chapterTitleMatch?.[1]) || `Chapter ${index + 1}`,
      link: `${NOVELFIRE_BASE}${chapterLink}`,
    });
  });

  // Clean author name (remove any HTML tags)
  let author = authorMatch?.[1] || null;
  if (author) {
    author = cleanText(author);
  }

  // Clean summary (extract text from paragraphs)
  let summary = '';
  if (summaryMatch?.[1]) {
    // Extract all paragraph text
    const pRegex = /<p>([\s\S]*?)<\/p>/gi;
    let pMatch;
    const paragraphs = [];
    while ((pMatch = pRegex.exec(summaryMatch[1])) !== null) {
      paragraphs.push(cleanText(pMatch[1]));
    }
    summary = paragraphs.join('\n\n');
  }

  return {
    title: cleanText(titleMatch?.[1]),
    author,
    coverImage: imageMatch?.[1],
    rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
    chapters: chaptersMatch ? parseInt(chaptersMatch[1], 10) : chapters.length,
    views: cleanText(viewsMatch?.[1]),
    bookmarked: bookmarkedMatch ? parseInt(bookmarkedMatch[1], 10) : null,
    status: statusMatch ? cleanText(statusMatch[2]) : 'Ongoing',
    summary,
    genres,
    chapterList: chapters,
  };
};

/**
 * Parse chapter list from chapters page
 * This is specifically for parsing the /chapters page
 */
export const parseChapterList = (html) => {
  if (!html) {
    return null;
  }

  const chapters = [];

  // Pattern for chapter links on the chapters page
  // Format: <a href="/book/{slug}/chapter-{number}">Chapter {number}</a>
  const chapterPattern = /<a[^>]*href="(\/book\/[^"]+\/chapter-\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const chapterMatches = extractAllMatches(html, chapterPattern);

  chapterMatches.forEach((match) => {
    const chapterLink = match[1];
    const chapterText = match[2];

    // Extract chapter number from link
    const chapterNumberMatch = chapterLink.match(/chapter-(\d+)/i);

    // Extract title from the link text
    const titleMatch = chapterText.match(/Chapter\s*\d+[^<]*/i) ||
                       chapterText.match(/>([^<]+)</);

    const chapterNumber = chapterNumberMatch ? parseInt(chapterNumberMatch[1], 10) : chapters.length + 1;

    chapters.push({
      number: chapterNumber,
      title: cleanText(titleMatch?.[0] || titleMatch?.[1]) || `Chapter ${chapterNumber}`,
      link: `${NOVELFIRE_BASE}${chapterLink}`,
    });
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

  // Extract pagination info
  const pagination = {
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  // Find current page - look for active page number or extract from URL
  const currentPageMatch = html.match(/page=(\d+)/);
  if (currentPageMatch) {
    pagination.currentPage = parseInt(currentPageMatch[1], 10);
  }

  // Find all page number links
  const pageLinkPattern = /<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>(\d+)<\/a>/gi;
  const pageMatches = extractAllMatches(html, pageLinkPattern);

  if (pageMatches.length > 0) {
    // Get the highest page number
    const pageNumbers = pageMatches.map(m => parseInt(m[1], 10));
    pagination.totalPages = Math.max(...pageNumbers);
  }

  // Check for "Next" link
  const nextMatch = html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>Next/i) ||
                    html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>»/i);
  pagination.hasNext = !!nextMatch;

  // Check for "Previous" link
  const prevMatch = html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>Prev/i) ||
                    html.match(/<a[^>]*href="[^"]*\?page=(\d+)"[^>]*>«/i);
  pagination.hasPrev = !!prevMatch;

  // If we have chapters but no pagination found, estimate based on chapter count
  if (pagination.totalPages === 1 && uniqueChapters.length >= 100) {
    // Check if there's a "Next" link in any form
    const hasNextLink = html.match(/chapters\?page=2/i);
    if (hasNextLink) {
      pagination.totalPages = 2; // At least 2 pages
      pagination.hasNext = true;
    }
  }

  return {
    chapters: uniqueChapters,
    pagination,
  };
};

/**
 * Parse chapter content
 */
export const parseNovelChapter = (html) => {
  if (!html) return null;

  // Extract chapter title from h4 inside content or h1
  let titleMatch = html.match(/<h4[^>]*>([^<]+)<\/h4>/i);
  if (!titleMatch) {
    titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  }
  if (!titleMatch) {
    titleMatch = html.match(/<span[^>]*class="chapter-title[^"]*"[^>]*>([^<]+)<\/span>/i);
  }

  // Extract chapter content - novelfire uses <div id="content">
  // We need to find the content div and extract all paragraphs
  let content = '';

  // Method 1: Look for <div id="content"> and extract all <p> tags
  const contentDivMatch = html.match(/<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<div\s|<script|$)/i);
  if (contentDivMatch) {
    content = contentDivMatch[1];
  } else {
    // Method 2: Try class-based content
    const classMatch = html.match(/<div[^>]*class="[^"]*chapter-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (classMatch) {
      content = classMatch[1];
    } else {
      // Method 3: Try article tag
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        content = articleMatch[1];
      }
    }
  }

  // Extract paragraphs from content
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(content)) !== null) {
    const text = cleanText(pMatch[1]);
    if (text && text.length > 0) {
      paragraphs.push(text);
    }
  }

  // Also extract h4 titles
  const h4Regex = /<h4[^>]*>([\s\S]*?)<\/h4>/gi;
  let h4Match;
  while ((h4Match = h4Regex.exec(content)) !== null) {
    const text = cleanText(h4Match[1]);
    if (text && text.length > 0) {
      paragraphs.unshift(text); // Add title at beginning
    }
  }

  // Join paragraphs with double newlines
  const cleanedContent = paragraphs.join('\n\n');

  // Extract previous and next chapter links
  // Check for disabled state (first/last chapter)
  const prevDisabled = html.match(/<a[^>]*class="[^"]*prev[^"]*isDisabled[^"]*"[^>]*>/i) ||
                       html.match(/<a[^>]*class="[^"]*prevchap[^"]*isDisabled[^"]*"[^>]*>/i);
  const nextDisabled = html.match(/<a[^>]*class="[^"]*next[^"]*isDisabled[^"]*"[^>]*>/i) ||
                       html.match(/<a[^>]*class="[^"]*nextchap[^"]*isDisabled[^"]*"[^>]*>/i);

  // Extract prev chapter link (skip if disabled or javascript:;)
  let prevChapter = null;
  if (!prevDisabled) {
    const prevMatch = html.match(/<a[^>]*class="[^"]*prevchap[^"]*"[^>]*href="([^"]+)"/i) ||
                      html.match(/<a[^>]*class="[^"]*prev[^"]*"[^>]*href="([^"]+)"/i) ||
                      html.match(/<a[^>]*rel="prev"[^>]*href="([^"]+)"/i);
    if (prevMatch && prevMatch[1]) {
      const href = prevMatch[1];
      // Skip javascript: links
      if (!href.startsWith('java')) {
        prevChapter = href.startsWith('http') ? href : `${NOVELFIRE_BASE}${href}`;
      }
    }
  }

  // Extract next chapter link (skip if disabled or javascript:;)
  let nextChapter = null;
  if (!nextDisabled) {
    const nextMatch = html.match(/<a[^>]*class="[^"]*nextchap[^"]*"[^>]*href="([^"]+)"/i) ||
                      html.match(/<a[^>]*class="[^"]*next[^"]*"[^>]*href="([^"]+)"/i) ||
                      html.match(/<a[^>]*rel="next"[^>]*href="([^"]+)"/i);
    if (nextMatch && nextMatch[1]) {
      const href = nextMatch[1];
      // Skip javascript: links
      if (!href.startsWith('java')) {
        nextChapter = href.startsWith('http') ? href : `${NOVELFIRE_BASE}${href}`;
      }
    }
  }

  return {
    title: cleanText(titleMatch?.[1]),
    content: cleanedContent,
    prevChapter,
    nextChapter,
  };
};

/**
 * Parse search results
 */
export const parseSearchResults = (html) => {
  if (!html) return null;

  const novels = [];
  
  // Pattern for search results: <li class="novel-item">...</li>
  const novelPattern = /<li[^>]*class="[^"]*novel-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = novelPattern.exec(html)) !== null) {
    const itemHtml = match[1];
    
    // Extract link and title from anchor tag
    const linkMatch = itemHtml.match(/href="\/book\/([^"]+)"/);
    const titleMatch = itemHtml.match(/title="([^"]+)"/);
    
    // Extract image - prefer data-src for lazy loading, fallback to src
    const imgMatch = itemHtml.match(/data-src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
                     itemHtml.match(/src="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    
    // Extract rank
    const rankMatch = itemHtml.match(/Rank\s*(\d+)/i);
    
    // Extract chapters count
    const chaptersMatch = itemHtml.match(/(\d+)\s*Chapters/i);
    
    if (linkMatch && titleMatch) {
      novels.push({
        title: titleMatch[1].trim(),
        link: `https://novelfire.net/book/${linkMatch[1]}`,
        slug: linkMatch[1],
        coverImage: imgMatch ? (imgMatch[1].startsWith('http') ? imgMatch[1] : `https://novelfire.net${imgMatch[1]}`) : null,
        rank: rankMatch ? parseInt(rankMatch[1], 10) : null,
        chapters: chaptersMatch ? parseInt(chaptersMatch[1], 10) : null,
      });
    }
  }

  return novels.length > 0 ? novels : null;
};

/**
 * Parse ranking page
 */
export const parseRanking = (html) => {
  if (!html) return null;

  const novels = [];
  const rankPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const matches = extractAllMatches(html, rankPattern);

  matches.forEach((match, index) => {
    const novel = parseNovelCard(match[0]);
    if (novel?.title && novel?.link) {
      novels.push({ ...novel, rank: index + 1 });
    }
  });

  return novels.length > 0 ? novels : null;
};

export default {
  parseNovelHome,
  parseNovelDetails,
  parseNovelChapter,
  parseSearchResults,
  parseRanking,
};
