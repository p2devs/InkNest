import { parseReadAllComicsDetails } from '../../../Components/Func/parseFunc';

export const HomePageCardClasses = {
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
  readcomicsonline: {
    'hot-comic-updates': {
      cardClass: '.schedule-avatar',
      cardTitleClass: '.schedule-name a',
      cardLinkClass: 'a',
      imageClass: '.schedule-avatar img',
      genresClass: null,
      statusClass: null,
      dateClass: null,
    },
    'latest-release': {
      cardClass: '.col-sm-6',
      cardTitleClass: '.media-body h5.media-heading a.chart-title',
      cardLinkClass: '.media-body h5.media-heading a.chart-title',
      imageClass: '.media-left a img',
      genresClass: null,
      statusClass: null,
      dateClass: '.media-body small',
      lastPageClass: '.pagenavi span.page-numbers.dots',
    },
    'most-viewed': {
      cardClass: 'li.list-group-item',
      cardTitleClass: '.media-body h5.media-heading a.chart-title',
      cardLinkClass: '.media-body h5.media-heading a.chart-title',
      imageClass: '.media-left a img',
      genresClass: null,
      statusClass: null,
      dateClass: null,
    },
  },
  readallcomics: {
    'all-comic': {
      cardClass: '.post',
      cardTitleClass: '.front-link',
      imageClass: 'img',
      genresClass: null, // Not applicable for readallcomics
      statusClass: null, // Not applicable for readallcomics
      dateClass: '.pinbin-copy span', // Date is inside this span tag
      lastPageClass: '.pagenavi span.page-numbers.dots',
      cardLinkClass: '.front-link',
    },
  },
  comichubfree: {
    'all-comic': {
      cardClass: '.episode-details.box-content',
      cardTitleClass: '.box-info h3.series-title',
      cardLinkClass: '.box-info h3.series-title a',
      imageClass: '.box-image a img',
      genresClass: '.box-info a.genre',
      chapterInfo: '.box-info a.chapter-title',
      imageAttr: 'data-src',
    },
    'hot-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      chapterInfo: '.mb-right .detail a',
      statusClass: '.mb-right .detail',
      imageAttr: 'data-src',
    },
    'new-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      statusClass: '.mb-right .detail',
      imageAttr: 'data-src',
    },
    'popular-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      statusClass: '.mb-right .detail',
      imageAttr: 'data-src',
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
  readcomicsonline: {
    detailsContainer: '.list-container',
    title: '.listmanga-header',
    imgSrc: '.boxed img.img-responsive',
    getImageAttr: 'src',
    summary: 'div.manga.well p',
    chaptersList: 'ul.chapters li',
    chapterTitle: 'h5.chapter-title-rtl a',
    chapterLink: 'h5.chapter-title-rtl a',
    chapterDate: 'div.date-chapter-title-rtl',
    detailsDL: 'dl.dl-horizontal dt',
    pagination: 'ul.pagination li a',
  },
  comichubfree: {
    detailsContainer: '.movie-info',
    title: '.movie-dl dt:contains("Alternate name:") + dd',
    imgSrc: '.movie-image img',
    getImageAttr: 'data-src',
    summary: '#film-content',
    chaptersList: '#list tr',
    chapterTitle: 'td:first-child a',
    chapterLink: 'td:first-child a',
    chapterDate: 'td:last-child',
    detailsDL: '.movie-dl dt',
    pagination: '.pagination li a',
  },
  readallcomics: {
    container: '.description-archive',
    title: 'h1',
    image: 'img',
    imageAttr: 'src',
    genre: 'p strong:nth-of-type(1)',
    author: 'p strong:nth-of-type(2)',
    volumeDescription: 'hr.style-six',
    summarySelector: 'strong',
    chapters: '.list-story li a',
    chapterTitleAttr: 'title',
    chapterLinkAttr: 'href',
    customParser: parseReadAllComicsDetails,
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

export const ComicBookPageClasses = {
  readcomicsonline: {
    imageContainer: '.imagecnt',
    imageSelector: 'img.img-responsive[data-src]',
    imageAttr: 'data-src',
    titleSelector: 'img.img-responsive',
    titleAttr: 'alt',
  },
  comichubfree: {
    imageContainer: '.chapter-container.chapter-all',
    imageSelector: 'img.chapter_img[data-src]',
    imageAttr: 'data-src',
    titleSelector: 'img.chapter_img',
    titleAttr: 'alt',
  },
  readallcomics: {
    imageContainer: 'div[style*="margin:0px auto"]',
    imageSelector: 'img',
    imageAttr: 'src',
    titleSelector: 'h3[style*="color: #0363df"]',
    titleAttr: 'alt',
    detailsLinkSelector: 'a[rel="category tag"]',
  },
  comicbookplus: {
    useJsVars: true,
    websiteVar: 'website',
    comicLocVar: 'comicloc',
    numPagesVar: 'comicnumpages',
    imagePattern: '{website}{comicloc}/{page}.jpg',
  },
};
