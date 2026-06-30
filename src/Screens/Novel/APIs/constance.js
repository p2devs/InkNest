/**
 * NovelFire.net CSS Selectors for HTML Parsing
 * Used with cheerio for parsing novel pages
 */

export const NovelHomePageClasses = {
  novelfire: {
    // Home page sections
    recommends: {
      sectionTitle: 'h3:contains("Recommends")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src', // Lazy loading
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
      authorClass: 'span.author, a[href*="/author/"]',
    },
    'most-read': {
      sectionTitle: 'h3 span:contains("Most Read")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
    },
    'new-trend': {
      sectionTitle: 'h3 span:contains("New Trend")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
    },
    'user-rated': {
      sectionTitle: 'h3 span:contains("User Rated")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
    },
    'latest-novels': {
      sectionTitle: 'h3:contains("Latest Novels")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
    },
    'completed-stories': {
      sectionTitle: 'h3:contains("Completed Stories")',
      sectionBody: '.section-body',
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
    },
    // Generic fallback for any novel list
    'all-novels': {
      cardClass: 'li.novel-item',
      cardLinkClass: 'a[href*="/book/"]',
      cardTitleClass: 'a[href*="/book/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'data-src',
      imageFallbackAttr: 'src',
      ratingClass: '.badge._br',
      ratingIcon: 'i.icon-star',
      chaptersClass: 'span:contains("Chapters")',
      authorClass: 'span.author, a[href*="/author/"]',
    },
  },
  wtrlab: {
    // WTR-Lab home page sections
    newNovels: {
      sectionTitle: 'h2, .section-title',
      sectionBody: '.novel-list, .content',
      cardClass: '.novel-item, a[href*="/novel/"]',
      cardLinkClass: 'a[href*="/novel/"]',
      cardTitleClass: '.novel-title, h3, h4',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'src',
      imageFallbackAttr: 'data-src',
      ratingClass: '.rating, span:contains("★")',
      chaptersClass: 'span:contains("Chapters"), .chapters',
      statusClass: '.status',
      genresClass: '.genres a, .tags a',
    },
    ranking: {
      sectionTitle: 'h2:contains("Ranking"), .section-title:contains("Ranking")',
      sectionBody: 'table, .ranking-list',
      cardClass: 'tr, .ranking-item',
      cardLinkClass: 'a[href*="/novel/"]',
      cardTitleClass: 'a[href*="/novel/"]',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'src',
      imageFallbackAttr: 'data-src',
      ratingClass: '.rating, span:contains("★")',
      chapters: '.chapters',
      views: '.views, span:contains("view")',
    },
    trending: {
      sectionTitle: 'h2:contains("Trending"), .section-title:contains("Trending")',
      sectionBody: '.novel-list, .trending-list',
      cardClass: '.novel-item, a[href*="/novel/"]',
      cardLinkClass: 'a[href*="/novel/"]',
      cardTitleClass: '.novel-title, h3, h4',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'src',
      imageFallbackAttr: 'data-src',
      ratingClass: '.rating, span:contains("★")',
      chaptersClass: 'span:contains("Chapters"), .chapters',
      genresClass: '.genres a',
    },
    // Generic fallback for novel list pages
    'all-novels': {
      cardClass: '.novel-item, a[href*="/novel/"]',
      cardLinkClass: 'a[href*="/novel/"]',
      cardTitleClass: '.novel-title, h3, h4',
      titleAttr: 'title',
      imageClass: 'img',
      imageAttr: 'src',
      imageFallbackAttr: 'data-src',
      ratingClass: '.rating, span:contains("★")',
      chaptersClass: 'span:contains("Chapters"), .chapters',
      statusClass: '.status',
      genresClass: '.genres a, .tags a',
    },
  },
};

export const NovelDetailPageClasses = {
  novelfire: {
    // Main container
    detailsContainer: '.novel-info, .header-body, .novel-header',

    // Title
    title: 'h1.novel-title, h1',

    // Cover image
    imgSrc: '.novel-image img, .cover img, .novel-cover img',
    getImageAttr: 'src',

    // Author - novelfire uses itemprop
    author: '.author span[itemprop="author"], a[href*="/author/"], .author a',

    // Rating
    rating: 'strong.nub, .rating-value, .novel-rating',
    ratingMeta: 'meta[itemprop="ratingValue"]',

    // Stats
    chaptersCount: '.stats:contains("Chapters"), strong:contains("Chapters")',
    chaptersIcon: 'i.icon-book-open',
    views: '.stats:contains("K"), strong:has(i.icon-eye)',
    viewsIcon: 'i.icon-eye',
    bookmarked: 'strong:has(i.icon-bookmark)',
    bookmarkedIcon: 'i.icon-bookmark',

    // Status
    status: 'strong.ongoing, strong.completed, strong.hiatus, .novel-status',
    statusClass: {
      ongoing: 'ongoing',
      completed: 'completed',
      hiatus: 'hiatus',
    },

    // Summary
    summary: '.content.expand-wrapper, .summary, .description, .novel-summary',
    summaryParagraphs: 'p',

    // Genres - used by parseNovelGenres
    genre: 'a.property-item[href*="/genre-"], .genres a, .novel-genres a',
    genres: 'a.property-item[href*="/genre-"], .genres a, .novel-genres a',

    // Details section (table/dl structure)
    detailsDL: 'dt, .detail-label, .info-label',
    detailsValue: 'dd, .detail-value, .info-value',

    // Chapter list (on detail page)
    chaptersList: 'a[href*="/chapter-"]',
    chapterTitle: '',
    chapterLink: '',
    chapterNumberPattern: 'chapter-(\\d+)',

    // Alternative selectors for different page layouts
    alternative: {
      title: 'h1',
      image: 'img[alt*="cover"], img.cover',
      author: 'a[href*="/author/"]',
      summary: '.novel-summary, .synopsis',
    },
  },
  wtrlab: {
    // Main container
    detailsContainer: '.novel-details, main, .content',

    // Title - WTR-Lab has English and Chinese titles
    title: 'h1, .novel-title',
    alternateTitle: '.alternate-title, h2',

    // Cover image
    imgSrc: '.cover img, .novel-cover img, img[alt*="cover"]',
    getImageAttr: 'src',

    // Author
    author: 'a[href*="/author/"], .author a',

    // Status
    status: '.status, span:contains("Ongoing"), span:contains("Completed")',

    // Stats
    views: 'span:contains("views"), .views',
    chaptersCount: 'span:contains("Chapters"), .chapters',
    charactersCount: 'span:contains("Characters"), .characters',
    readersCount: 'span:contains("Readers"), .readers',

    // Rating
    rating: '.rating, span:contains("★")',
    reviewCount: '.reviews, span:contains("reviews")',

    // Summary
    summary: '.summary, .description, .novel-summary',
    summaryParagraphs: 'p',

    // Genres & Tags
    genre: '.genres a, .tags a, a[href*="/novel-list?genre="]',
    genres: '.genres a, .tags a, a[href*="/novel-list?genre="]',
    tags: '.tags a, .protagonist-archetypes a',

    // Meta information
    dateAdded: 'span:contains("DATE ADDED"), .date-added',
    requestedBy: 'a[href*="/profile/"]',
    releasedBy: 'a[href*="/profile/"]',

    // Rankings
    rankings: '.rankings a, a[href*="/ranking/"]',

    // Chapter list
    chaptersList: '.chapter-list a, a[href*="/chapter-"]',
    chapterPagination: '.pagination',

    // Similar novels
    similarNovels: '.similar-novels a[href*="/novel/"]',

    // Details section
    detailsDL: 'dt, .detail-label, .info-label',
    detailsValue: 'dd, .detail-value, .info-value',
  },
};

export const NovelChapterPageClasses = {
  novelfire: {
    // Chapter title
    title: 'h4, h1.chapter-title, span.chapter-title',

    // Content container
    contentContainer: '#content, .chapter-content, article',

    // Paragraphs within content
    paragraphs: 'p',

    // Navigation
    prevChapter: 'a.prevchap:not(.isDisabled), a.prev:not(.isDisabled), a[rel="prev"]',
    nextChapter: 'a.nextchap:not(.isDisabled), a.next:not(.isDisabled), a[rel="next"]',

    // Disabled navigation (first/last chapter)
    prevDisabled: 'a.prevchap.isDisabled, a.prev.isDisabled',
    nextDisabled: 'a.nextchap.isDisabled, a.next.isDisabled',

    // Chapter info
    chapterInfo: '.chapter-info, .chapter-header',
    novelTitle: '.novel-title, a[href*="/book/"]',

    // Settings/controls
    fontSizeControls: '.font-size-controls',
    themeControls: '.theme-controls',

    // Alternative content selectors
    alternativeContent: {
      contentDiv: 'div[id="content"]',
      articleContent: 'article',
      chapterDiv: '.chapter-body',
      textContent: '.text-content',
    },

    // Exclude from content
    excludeFromContent: 'script, style, .ads, .advertisement, .comments',
  },
  wtrlab: {
    // Chapter title
    title: 'h1, h2, .chapter-title',

    // Content container
    contentContainer: '.chapter-content, article, .content',

    // Paragraphs within content
    paragraphs: 'p',

    // Navigation
    prevChapter: 'a:contains("Prev"), a.prev, a[rel="prev"]',
    nextChapter: 'a:contains("Next"), a.next, a[rel="next"]',

    // Progress indicator
    progress: '.progress, span:contains("/")',

    // Reading mode selector (for reference, not parsed)
    modeSelector: '.mode-selector, .service-selector',

    // Exclude from content
    excludeFromContent: 'script, style, .ads, .advertisement, .comments, .popup',
  },
};

export const NovelSearchPageClasses = {
  novelfire: {
    // Search results container
    resultsContainer: '.search-results, .novel-list',

    // Individual result items
    cardClass: 'li.novel-item',

    // Card elements
    cardLinkClass: 'a[href*="/book/"]',
    cardTitleClass: 'a[href*="/book/"]',
    titleAttr: 'title',

    // Image
    imageClass: 'img',
    imageAttr: 'data-src',
    imageFallbackAttr: 'src',

    // Metadata
    rankClass: '.rank, span:contains("Rank")',
    chaptersClass: 'span:contains("Chapters")',
    ratingClass: '.badge._br',
    ratingIcon: 'i.icon-star',

    // Pagination
    pagination: '.pagination',
    paginationLinks: 'a[href*="?page="]',
    currentPage: '.pagination .active, .pagination .current',
    nextPage: 'a:contains("Next"), a:contains("»")',
    prevPage: 'a:contains("Prev"), a:contains("«")',

    // No results
    noResults: '.no-results, .empty-state',
  },
  wtrlab: {
    // Search results container
    resultsContainer: '.search-results, .novel-list',

    // Individual result items
    cardClass: '.novel-item, a[href*="/novel/"]',

    // Card elements
    cardLinkClass: 'a[href*="/novel/"]',
    cardTitleClass: '.novel-title, h3, h4',
    titleAttr: 'title',

    // Image
    imageClass: 'img',
    imageAttr: 'src',
    imageFallbackAttr: 'data-src',

    // Metadata
    statusClass: '.status',
    chaptersClass: 'span:contains("Chapters")',
    viewsClass: 'span:contains("views")',
    ratingClass: '.rating',
    genresClass: '.genres a',

    // Pagination
    pagination: '.pagination',
    paginationLinks: 'a[href*="?page="]',
    currentPage: '.pagination .active, .pagination .current',
    nextPage: 'a:contains("Next"), a:contains("»")',
    prevPage: 'a:contains("Prev"), a:contains("«")',

    // No results
    noResults: '.no-results, .empty-state',
  },
};

export const NovelChapterListPageClasses = {
  novelfire: {
    // Chapter list container
    chaptersContainer: '.chapter-list, .chapters',

    // Individual chapters
    chapterItem: 'a[href*="/chapter-"]',
    chapterLink: '',
    chapterTitle: '',

    // Chapter number extraction from URL
    chapterNumberPattern: 'chapter-(\\d+)',

    // Pagination
    pagination: '.pagination',
    paginationLinks: 'a[href*="?page="]',
    currentPage: '.pagination .active, .pagination .current',
    nextPage: 'a[href*="?page="]:contains("Next"), a:contains("»")',
    prevPage: 'a[href*="?page="]:contains("Prev"), a:contains("«")',

    // Total chapters info
    totalInfo: '.total-chapters, .chapter-count',
  },
  wtrlab: {
    // Chapter list container - WTR-Lab TOC tab has chapters in a table or list
    chaptersContainer: 'table, .chapter-list, .chapters, tbody',

    // Individual chapters - WTR-Lab uses links with /chapter-{id}-{number}
    chapterItem: 'a[href*="/chapter-"], tr a[href*="/chapter-"]',
    chapterLink: '',
    chapterTitle: '',

    // Chapter number extraction from URL
    // WTR-Lab format: /en/novel/{id}/{slug}/chapter-{chapterId}-{chapterNumber}
    chapterNumberPattern: 'chapter-\\d+-(\\d+)',

    // Pagination - WTR-Lab TOC may have pagination
    pagination: '.pagination, nav',
    paginationLinks: 'a[href*="?page="], a[href*="tab=toc"]',
    currentPage: '.pagination .active, .pagination .current',
    nextPage: 'a:contains("Next"), a:contains("»"), a[href*="page="]:not(.active)',
    prevPage: 'a:contains("Prev"), a:contains("«")',

    // Total chapters info
    totalInfo: '.total-chapters, .chapter-count',
  },
};

export const NovelRankingPageClasses = {
  novelfire: {
    // Ranking table
    rankingContainer: 'table, .ranking-list',

    // Individual rows
    rowClass: 'tr',

    // Row elements
    novelLink: 'a[href*="/book/"]',
    title: 'a[href*="/book/"]',
    image: 'img',
    imageAttr: 'data-src',

    // Rank (usually row index + 1)
    rankClass: '.rank, td:first-child',

    // Stats
    views: '.views, td:contains("K"), td:contains("M")',
    rating: '.rating, .badge._br',
    chapters: '.chapters',
  },
  wtrlab: {
    // Ranking container
    rankingContainer: '.ranking-list, table, .novel-list',

    // Ranking type tabs
    rankingTabs: '.ranking-type a, .tabs a',
    dailyTab: 'a[href*="/ranking/daily"]',
    weeklyTab: 'a[href*="/ranking/weekly"]',
    monthlyTab: 'a[href*="/ranking/monthly"]',
    allTimeTab: 'a[href*="/ranking/all_time"]',

    // Individual rows
    rowClass: 'tr, .ranking-item, .novel-item',

    // Row elements
    novelLink: 'a[href*="/novel/"]',
    title: 'a[href*="/novel/"], .novel-title',
    image: 'img',
    imageAttr: 'src',

    // Rank (usually row index + 1)
    rankClass: '.rank, td:first-child, .ranking-number',

    // Stats
    views: '.views, span:contains("view")',
    rating: '.rating, span:contains("★")',
    chapters: '.chapters, span:contains("Chapters")',
    readers: '.readers, span:contains("Readers")',

    // Status
    status: '.status, span:contains("Ongoing"), span:contains("Completed")',

    // Pagination
    pagination: '.pagination',
  },
};

// Base URL for novelfire.net
export const NOVELFIRE_BASE = 'https://novelfire.net';

// Image URL patterns
export const ImagePatterns = {
  novelfire: {
    // novelfire uses server-1, server-2, etc. for images
    serverPattern: /server-\d+/,
    // Image extensions
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    // Handle relative URLs
    makeAbsolute: (url) => {
      if (!url) {
        return null;
      }
      if (url.startsWith('http')) {
        return url;
      }
      if (url.startsWith('/')) {
        return `${NOVELFIRE_BASE}${url}`;
      }
      return `${NOVELFIRE_BASE}/${url}`;
    },
  },
};

// Status mappings
export const NovelStatus = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'Hiatus',
};

// Default values
export const Defaults = {
  status: 'Ongoing',
  rating: null,
  chapters: null,
  views: null,
  bookmarked: null,
};
