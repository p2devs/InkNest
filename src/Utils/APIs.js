export const ComicHostName = {
  comicbookplus: 'https://comicbookplus.com/',
  xoxocomic: 'https://xoxocomic.com/',
  ocecomic: 'https://ocecomic.com/',
};
// Online comic entries can outlive their source in bookmarks and history.
export const getComicSourceKey = url => {
  if (typeof url !== 'string') return undefined;
  const host = /^https?:\/\/(?:www\.)?([a-z0-9.-]+)(?=[/?#]|$)/i.exec(url)?.[1];
  if (!host) return undefined;
  return Object.keys(ComicHostName).find(
    key => ComicHostName[key] === `https://${host.toLowerCase()}/`,
  );
};

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
