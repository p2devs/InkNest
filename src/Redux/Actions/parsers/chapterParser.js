import {load} from 'cheerio';
import APICaller from '../../Controller/Interceptor';
import {getComicSourceKey, resolveComicUrl} from '../../../Utils/APIs';
import {loadMoreLatestComics} from '../../../Screens/Comic/APIs/latestComics';

export const fetchChaptersWithPagination = async ($, config, link) => {
  const source = getComicSourceKey(link);
  const chapters = new Map();
  const visitedPages = new Set();
  let pageUrl = link;
  let page = $;

  const collectChapters = (document, url) => {
    document(config.chaptersList).each((_, el) => {
      const row = document(el);
      const anchor = row.find(config.chapterLink).first();
      const title = (
        config.chapterTitle ? row.find(config.chapterTitle) : anchor
      )
        .text()
        .trim();
      const chapterUrl = resolveComicUrl(anchor.attr('href'), url)?.split('#')[0];
      if (title && chapterUrl && getComicSourceKey(chapterUrl) === source) {
        const date = config.chapterDate
          ? row.find(config.chapterDate).text().trim()
          : '';
        chapters.set(chapterUrl, {title, link: chapterUrl, date});
      }
    });
  };

  while (pageUrl) {
    visitedPages.add(pageUrl);
    collectChapters(page, pageUrl);
    const next =
      config.nextChapterPage && page(config.nextChapterPage).attr('href');
    const nextUrl = resolveComicUrl(next, pageUrl);
    if (
      !nextUrl ||
      visitedPages.has(nextUrl) ||
      getComicSourceKey(nextUrl) !== source
    )
      break;
    const response = await APICaller.get(nextUrl);
    page = load(response.data);
    if (!page(config.chaptersList).length)
      throw new Error('Could not load the next page of issues.');
    pageUrl = nextUrl;
  }

  if (source === 'latestcomics' && $('#load-more-series').length) {
    for (let number = 2; ; number++) {
      const {html, hasMore} = await loadMoreLatestComics($, number, 'series');
      const previousSize = chapters.size;
      collectChapters(load(html), link);
      if (!hasMore) break;
      if (chapters.size === previousSize) {
        throw new Error('Latest Comics did not return the next issues.');
      }
    }
  }

  const result = Array.from(chapters.values());
  return config.newestFirst ? result.reverse() : result;
};

/**
 * Gets pagination information from the page
 *
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Parser configuration
 * @returns {Array} - Array of pagination links
 */
export const getChapterPagination = ($, config) => {
  const pages = [];

  if (!config.pagination) {
    return pages;
  }

  $(config.pagination).each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      pages.push({text, link: href});
    }
  });

  return pages;
};
