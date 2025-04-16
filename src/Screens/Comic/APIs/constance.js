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
    },
  },
  comichubfree: {
    'latest-release': {
      cardClass: '.episode-details.box-content',
      cardTitleClass: '.box-info h3.series-title',
      cardLinkClass: '.box-info h3.series-title a',
      imageClass: '.box-image a img',
      genresClass: '.box-info a.genre',
      chapterInfo: '.box-info a.chapter-title',
    },
    'hot-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      chapterInfo: '.mb-right .detail a',
      statusClass: '.mb-right .detail',
    },
    'new-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      statusClass: '.mb-right .detail',
    },
    'popular-comic': {
      cardClass: '.cartoon-box',
      cardTitleClass: '.mb-right h3 a',
      cardLinkClass: '.mb-right h3 a',
      imageClass: '.lazyload',
      statusClass: '.mb-right .detail',
    }
  },
};
