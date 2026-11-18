import {ComicHostName} from '../../../Utils/APIs';

export const parseHomePageCards = ($, tagConfig) => {
  const comicsData = [];

  if (!tagConfig) {
    return comicsData;
  }

  $(tagConfig.cardClass).each((_, element) => {
    const title = $(element).find(tagConfig.cardTitleClass).text().trim();
    let link = $(element).find(tagConfig.cardLinkClass).attr('href');
    if (link) {
      link = link.replace(/\/\d+$/, '');
      if (link.startsWith('/?')) {
        link = ComicHostName.comicbookplus + link.substring(1);
      }
    }

    const image = $(element)
      .find(tagConfig.imageClass)
      .attr(tagConfig.imageAttr ?? 'src');

    const genres = [];
    if (tagConfig.genresClass) {
      $(element)
        .find(tagConfig.genresClass)
        .each((i, genreElem) => {
          genres.push($(genreElem).text().trim());
        });
    }

    const status = tagConfig.statusClass
      ? $(element).find(tagConfig.statusClass).text().trim()
      : null;

    const publishDate = tagConfig.dateClass
      ? $(element).find(tagConfig.dateClass).text().trim()
      : null;

    comicsData.push({
      title,
      link,
      image,
      genres: genres.length > 0 ? genres[0] : null,
      status,
      publishDate,
    });
  });

  return comicsData;
};
