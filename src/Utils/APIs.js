export const ComicHostName = {
  xoxocomic: 'https://xoxocomic.com/',
  ocecomic: 'https://ocecomic.com/',
  comichubfree: 'https://comichubfree.com/',
  latestcomics: 'https://www.latestcomics.com/en/',
};
export const DEFAULT_COMIC_SOURCE = 'xoxocomic';

const comicHost = url =>
  /^https?:\/\/(?:www\.)?([a-z0-9.-]+)(?=[/?#]|$)/i
    .exec(url)?.[1]
    .toLowerCase();
const comicSourcesByHost = new Map(
  Object.entries(ComicHostName).map(([key, url]) => [comicHost(url), key]),
);

// Online comic entries can outlive their source in bookmarks and history.
export const getComicSourceKey = url =>
  typeof url === 'string' ? comicSourcesByHost.get(comicHost(url)) : undefined;

export const isSupportedComicUrl = url => Boolean(getComicSourceKey(url));

// React Native's URL implementation appends even root-relative links to the
// supplied base path. Choose the origin or document directory explicitly.
export const resolveComicUrl = (value, pageUrl) => {
  const href = value?.trim();
  if (!href || href.startsWith('#')) return null;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('//')) return 'https:' + href;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  const page = new URL(pageUrl.split(/[?#]/)[0]);
  if (href.startsWith('?')) return page.href + href;
  const base = href.startsWith('/')
    ? page.origin
    : page.href.slice(0, page.href.lastIndexOf('/') + 1);
  return new URL(href, base).href;
};

export const AnimeHostName = {
  gogoanimes: 'https://ww12.gogoanimes.fi/',
  s3taku: 'https://s3taku.com/',
};
export const MangaHostName = {
  mangakatana: 'https://mangakatana.com/',
};
export const NovelHostName = {
  novelfire: 'https://novelfire.net',
  // wtrlab: 'https://wtr-lab.com',
};
