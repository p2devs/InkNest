import {getComicSourceKey, resolveComicUrl} from '../../../Utils/APIs';

export const parseHomePageCards = ($, tagConfig, pageUrl) => {
  const comicsData = [];
  const source = getComicSourceKey(pageUrl);
  const seen = new Set();

  if (!tagConfig) {
    return comicsData;
  }

  $(tagConfig.cardClass).each((_, element) => {
    const heading = $(element).find(tagConfig.cardTitleClass).first();
    const title = heading.attr('title')?.trim() || heading.text().trim();
    const anchor = tagConfig.cardLinkClass
      ? $(element).find(tagConfig.cardLinkClass)
      : heading;
    const link = resolveComicUrl(anchor.attr('href'), pageUrl);
    if (!title || !link || getComicSourceKey(link) !== source || seen.has(link))
      return;
    seen.add(link);

    const img = $(element).find(tagConfig.imageClass).first();
    const image = resolveComicUrl(
      img.attr(tagConfig.imageAttr || 'src') || img.attr('src'),
      pageUrl,
    );

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
