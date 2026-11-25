import {DEFAULT_COMIC_SOURCE} from './APIs';

// Only used to recognize records saved before these catalogs were removed.
const domains = {
  comicbookplus: 'comicbookplus.com',
  readcomicsonline: 'readcomicsonline.ru',
  readallcomics: 'readallcomics.com',
};

export const MISSING_RETIRED_COMIC_MESSAGE =
  'Some downloaded files are missing. This source is no longer available to restore them.';

export const isRetiredComicSource = key =>
  Object.prototype.hasOwnProperty.call(domains, key);

export const migrateRetiredComicSources = state => ({
  ...state,
  baseUrl:
    !state.baseUrl ||
    state.baseUrl === 'azcomic' ||
    isRetiredComicSource(state.baseUrl)
      ? DEFAULT_COMIC_SOURCE
      : state.baseUrl,
  sourceStatusNotifications: (state.sourceStatusNotifications || []).filter(
    item => !isRetiredComicSource(item.sourceKey),
  ),
});

export const isRetiredComicUrl = url => {
  const host = /^https?:\/\/([^/:?#]+)/i.exec(url)?.[1].toLowerCase();
  return Object.values(domains).some(
    domain => host === domain || host?.endsWith(`.${domain}`),
  );
};
