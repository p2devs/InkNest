// Only used to recognize records saved before these catalogs were removed.
const domains = {
  readcomicsonline: 'readcomicsonline.ru',
  readallcomics: 'readallcomics.com',
};

export const MISSING_RETIRED_COMIC_MESSAGE =
  'Some downloaded files are missing. This source is no longer available to restore them.';

export const isRetiredComicSource = key =>
  Object.prototype.hasOwnProperty.call(domains, key);

export const isRetiredComicUrl = url => {
  const host = /^https?:\/\/([^/:?#]+)/i.exec(url)?.[1].toLowerCase();
  return Object.values(domains).some(domain => host === domain || host?.endsWith(`.${domain}`));
};
