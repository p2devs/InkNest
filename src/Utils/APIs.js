export const ComicHostName = {
  comicbookplus: 'https://comicbookplus.com/',
};
// Online comic entries can outlive their source in bookmarks and history.
export const isSupportedComicUrl = url =>
  typeof url === 'string' && /^https?:\/\/(?:www\.)?comicbookplus\.com(?:[/?#]|$)/i.test(url);

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
