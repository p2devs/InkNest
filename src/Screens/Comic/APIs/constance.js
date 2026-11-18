export const HomePageCardClasses = {
  xoxocomic: {
    cardClass: '.items .item > figure',
    cardTitleClass: 'figcaption h3 a',
    imageClass: '.image img',
    imageAttr: 'data-original',
  },
  ocecomic: {
    cardClass: 'main.Comics .items > .item',
    cardTitleClass: 'h2 a',
    imageClass: 'figure img',
    genresClass: '.genre a',
  },
  comichubfree: {
    cardClass: 'main .cartoon-box',
    cardTitleClass: '.mb-right h3',
    cardLinkClass: '.mb-right h3 a',
    imageClass: 'a.image img',
    imageAttr: 'data-src',
  },
  latestcomics: {
    cardClass: '.series-card',
    cardTitleClass: '.series-card-title',
    cardLinkClass: 'a.series-card-link',
    imageClass: '.series-card-thumb',
    getImageUrl: image =>
      image
        .attr('style')
        ?.match(/background-image:\s*url\(\s*(['"]?)(.*?)\1\s*\)/i)?.[2],
  },
  azcomic: {
    'popular-comics': {
      cardClass: '.eg-box',
      cardTitleClass: '.egb-serie',
      imageClass: '.eg-image img',
      genresClass: '.egb-details a',
      statusClass: '.egb-label',
      dateClass: null, // No date in the provided structure for popular-comics
    },
    'ongoing-comics': {
      cardClass: '.ig-grid .ig-box',
      cardTitleClass: '.igb-name',
      imageClass: '.igb-image img',
      genresClass: '.igb-genres a',
      statusClass: null, // No status in the provided structure for ongoing-comics
      dateClass: null, // No date in the provided structure for ongoing-comics
    },
    'new-comics': {
      cardClass: '.eg-box',
      cardTitleClass: '.egb-serie',
      imageClass: '.eg-image img',
      genresClass: '.egb-details a',
      statusClass: '.egb-label',
      dateClass: '.egb-episode', // Assumes the 'Latest Episode' label can be used for date
    },
  },
  comicbookplus: {
    'latest-uploads': {
      cardClass: '.cbpLtableleft, .cbpLtable, .cbpLtableright',
      cardTitleClass: '.w a.ya',
      cardLinkClass: '.w a.ya',
      imageClass: 'td.v img',
      genresClass: null,
      statusClass: null,
      dateClass: 'time[itemprop="dateModified"]',
      imageAttr: 'src',
    },
  },
};

export const ComicDetailPageClasses = {
  xoxocomic: {
    detailsContainer: '#item-detail',
    title: '.breadcrumb li:last-child [itemprop="name"]',
    imgSrc: '.col-image img',
    summary: '#item-detail .detail-content p',
    detailsDL: '.list-info .name',
    detailsValue: 'p',
    genre: '#item-detail .kind a',
    chaptersList: '#nt_listchapter li.row',
    chapterLink: '.chapter a',
    chapterDate: '.col-xs-3',
    nextChapterPage: '#nt_listchapter .pagination a[rel="next"]',
    newestFirst: true,
  },
  ocecomic: {
    detailsContainer: '#Comic .page.home',
    title: '#Comic .page.home h1',
    imgSrc: 'figure img',
    summary: '#Comic .page.home .about',
    detailsDL: '.info ul li:first-child',
    detailsValue: 'li',
    genre: '#Comic .page.home .info ul:has(span:contains("Genre")) a',
    chaptersList: '#Comic .issues li',
    chapterLink: 'a.issue-link',
  },
  comichubfree: {
    detailsContainer: '.movie-info',
    title: '.breadcrumb li:last-child [itemprop="name"]',
    imgSrc: '.movie-image img',
    getImageAttr: 'data-src',
    summary: '#film-content',
    detailsDL: '.movie-dl dt',
    chaptersList: '#list tr',
    chapterLink: 'td:first-child a',
    chapterDate: 'td:last-child',
    nextChapterPage: '.page-single .pagination a[rel="next"]',
    newestFirst: true,
  },
  latestcomics: {
    detailsContainer: 'main .series-header',
    title: 'main .series-title',
    imgSrc: '.series-header-thumbnail img',
    summary: 'main .series-description',
    chaptersList: 'article.chapter-item',
    chapterLink: 'a.chapter-link',
    chapterTitle: '.chapter-title',
    newestFirst: true,
  },
  comicbookplus: {
    detailsContainer: '.introtext',
    title: 'h1.sectionh1',
    imgSrc: '.introtext img.leftmargin',
    getImageAttr: 'src',
    summary: null,
    chaptersList: 'table.catlistings tr.overrow',
    chapterTitle: 'td.n a[itemprop="url"] span[itemprop="name"]',
    chapterLink: 'td.n a[itemprop="url"]',
    chapterDate: 'td.r:nth-child(7)',
    detailsDL: '.introtext table td.d',
    detailsValue: '.introtext table td.e',
    pagination: null,
    genre: '.introtext a[itemprop="genre"]',
    publisher: '.introtext span[itemprop="name"]',
    publisherLink: '.introtext a[itemprop="url"]',
  },
};

export const ComicIssuePageClasses = {
  xoxocomic: {
    allPages: true,
    images: '.reading-detail .page-chapter img',
    imageAttr: 'data-original',
    title: '.select-chapter option[selected]',
    seriesLink: '.chapter-nav a.backward',
    seriesTitleAttr: 'title',
  },
  ocecomic: {
    images: '#Comic .page.issue figure img',
    imageAttr: 'data-original',
    title: '#Comic .volume .pages > label',
    seriesLink: '#Comic .volume .nav a:has(.fa-home)',
    seriesTitle: '#Comic .share-box h4 b',
  },
  comichubfree: {
    allPages: true,
    images: '.chapter-container.chapter-all img.chapter_img',
    imageAttr: 'data-src',
    title: 'select[name="chapter_select"] option[selected]',
    seriesLink: '.breadcrumb a[href*="/comic/"]',
  },
  latestcomics: {
    images: 'main .entry-content .wp-block-image img',
    imageAttr: 'data-src',
    title: 'main .entry-title',
    seriesLink: 'main a.manga-series',
  },
};
