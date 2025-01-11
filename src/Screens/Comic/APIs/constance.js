export const HomePageCardClasses = {
    azcomic: {
        "popular-comics": {
            cardClass: '.eg-box',
            cardTitleClass: '.egb-serie',
            imageClass: '.eg-image img',
            genresClass: '.egb-details a',
            statusClass: '.egb-label',
            dateClass: null, // No date in the provided structure for popular-comics
        },
        "ongoing-comics": {
            cardClass: '.ig-grid .ig-box',
            cardTitleClass: '.igb-name',
            imageClass: '.igb-image img',
            genresClass: '.igb-genres a',
            statusClass: null, // No status in the provided structure for ongoing-comics
            dateClass: null, // No date in the provided structure for ongoing-comics
        },
        "new-comics": {
            cardClass: '.eg-box',
            cardTitleClass: '.egb-serie',
            imageClass: '.eg-image img',
            genresClass: '.egb-details a',
            statusClass: '.egb-label',
            dateClass: '.egb-episode', // Assumes the 'Latest Episode' label can be used for date
        }
    },
    readallcomics: {
        "all-comic": {
            cardClass: '.post',
            cardTitleClass: '.front-link',
            imageClass: 'img',
            genresClass: null, // Not applicable for readallcomics
            statusClass: null, // Not applicable for readallcomics
            dateClass: '.pinbin-copy span', // Date is inside this span tag
        }
    }
};