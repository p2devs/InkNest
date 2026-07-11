import {ComicHostName} from '../../../Utils/APIs';

export const buildComicsRequestParams = (hostName, page, type = null) => {
  if (hostName === ComicHostName.readallcomics) {
    return page > 1 ? `?paged=${page}` : '';
  }

  let params = `${type ?? ''}?page=${page}`;
  if (
    (page === 1 || page == null) &&
    hostName === ComicHostName.readcomicsonline
  ) {
    params = '';
  }

  if (hostName === ComicHostName.comicbookplus) {
    params = `?cbplus=latestuploads_l_s_${page}`;
  }

  return params;
};

/**
 * Custom home parser for readcomicsonline.ru.
 *
 * The site was redesigned to a modern Tailwind layout (2026), so the old
 * Bootstrap/jQuery selectors no longer match. New structure:
 *   - hot-comic-updates: each card is an <a class="hot-item"> (link on itself),
 *     cover <img src>, title in <img alt>.
 *   - latest-release: <div class="release-card"> with an inner <a href*="/comic/">
 *     and cover <img src>/<img alt>.
 *   - most-viewed: a ranked <ul> list of <li><a><span>title</span> (no cover).
 * Covers are served from cdn.readcomicsonline.ru (not Cloudflare-challenged).
 */
export const parseReadComicsOnlineHome = ($, {type} = {}) => {
  const comicsData = [];
  const push = (title, link, image) => {
    if (title && link) {
      comicsData.push({
        title: title.trim(),
        link,
        image: image || null,
        genres: null,
        status: null,
        publishDate: null,
      });
    }
  };

  if (type === 'hot-comic-updates') {
    $('a.hot-item').each((_, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      push(img.attr('alt'), $el.attr('href'), img.attr('src'));
    });
  } else if (type === 'most-viewed') {
    $('ul.divide-y li a[href*="/comic/"]').each((_, el) => {
      const $el = $(el);
      push($el.find('span').first().text(), $el.attr('href'), null);
    });
  } else {
    // latest-release (default)
    $('.release-card').each((_, el) => {
      const $el = $(el);
      const img = $el.find('img').first();
      const link = $el.find('a[href*="/comic/"]').first().attr('href');
      const title = img.attr('alt') || $el.find('.line-clamp-2').first().text();
      push(title, link, img.attr('src'));
    });
  }

  return comicsData;
};

export const parseHomePageCards = ($, tagConfig, {hostName, type} = {}) => {
  const comicsData = [];

  if (!tagConfig) {
    return comicsData;
  }

  $(tagConfig.cardClass).each((index, element) => {
    const title =
      type === 'hot-comic-updates'
        ? $(tagConfig.cardTitleClass).eq(index).text().trim()
        : $(element).find(tagConfig.cardTitleClass).text().trim();
    let link = $(element).find(tagConfig.cardLinkClass).attr('href');
    if (link) {
      link = link.replace(/\/\d+$/, '');
      if (hostName === ComicHostName.comicbookplus && link.startsWith('/?')) {
        link = hostName + link.substring(1);
      }
    }

    let image = $(element)
      .find(tagConfig.imageClass)
      .attr(tagConfig.imageAttr ?? 'src');

    if (
      (type === 'latest-release' || type === 'most-viewed') &&
      image &&
      image.startsWith('//')
    ) {
      image = 'https:' + image;
    }

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

    let publishDate = null;
    if (tagConfig.dateClass) {
      const dateText = $(element).find(tagConfig.dateClass).text().trim();
      publishDate =
        type === 'latest-release'
          ? dateText.split('\n')[0].trim()
          : dateText;
    }

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

export const extractLastPage = ($, tagConfig) => {
  if (!tagConfig) {
    return null;
  }

  if (tagConfig.lastPageClass) {
    const lastPage = $(tagConfig.lastPageClass)
      .next()
      .text()
      .trim()
      .replaceAll(',', '');

    if (lastPage) {
      return lastPage;
    }
  }

  if (!tagConfig.paginationLinkClass) {
    return null;
  }

  const pageNumbers = $(tagConfig.paginationLinkClass)
    .map((_, element) => Number($(element).text().trim()))
    .get()
    .filter(pageNumber => Number.isFinite(pageNumber));

  if (pageNumbers.length === 0) {
    return null;
  }

  return String(Math.max(...pageNumbers));
};
