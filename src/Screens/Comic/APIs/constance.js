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
