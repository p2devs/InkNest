import {load} from 'cheerio';
import APICaller from '../../../Redux/Controller/Interceptor';
import {checkDownTime} from '../../../Redux/Actions/utils/errorHandlers';
import {ComicHostName} from '../../../Utils/APIs';
import {
  recordSourceError,
  recordSourceSuccess,
} from '../../../Utils/sourceStatus';
import {HomePageCardClasses} from './constance';
import {parseHomePageCards} from './homeParser';
import {loadMoreLatestComics} from './latestComics';

const catalogPaths = {
  xoxocomic: page => `new-comic?page=${page}`,
  ocecomic: page => `comic/all/latest/page/${page}`,
  comichubfree: page => `new-comic?page=${page}`,
  latestcomics: () => '',
};

const getLastCatalogPage = ($, source, page) => {
  switch (source) {
    case 'ocecomic':
      return Number($('main select[name="page"] option').last().val()) || page;
    case 'latestcomics':
      return $('#load-more-series-grid').length ? null : page;
    default:
      return $('.pagination a[rel="next"]').length ? null : page;
  }
};

export const getComics = async (source, page = 1, dispatch) => {
  if (!Object.prototype.hasOwnProperty.call(catalogPaths, source)) return null;
  try {
    const url = ComicHostName[source] + catalogPaths[source](page);
    const response = await APICaller.get(url);
    let $ = load(response.data);
    let lastPage = getLastCatalogPage($, source, page);
    if (source === 'latestcomics' && page > 1) {
      const more = await loadMoreLatestComics($, page, 'series_grid');
      $ = load(more.html);
      lastPage = more.hasMore ? null : page;
    }
    const comicsData = parseHomePageCards($, HomePageCardClasses[source], url);
    if (!comicsData.length)
      throw new Error('Could not load the comic catalog.');

    recordSourceSuccess(source);
    return {comicsData, lastPage};
  } catch (error) {
    if (dispatch) {
      dispatch(checkDownTime(error, source));
    } else if (error?.response?.status) {
      recordSourceError(source, error.response.status);
    }
    return null;
  }
};

const comicSearch = {
  xoxocomic: {
    request: (host, keyword) =>
      APICaller.get(`${host}search-comic?keyword=${keyword}`),
    resultsPage: '#ctl00_divCenter h1',
  },
  ocecomic: {
    // The form redirects to the site's own normalized search slug.
    request: (host, keyword) =>
      APICaller.post(host, `q=${keyword}`, {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }),
    resultsPage: 'main#Search',
  },
  comichubfree: {
    request: (host, keyword) =>
      APICaller.get(`${host}search-comic?key=${keyword}`),
    resultsPage: 'main h1.header-list-index',
  },
  latestcomics: {
    request: (host, keyword) => APICaller.get(`${host}?s=${keyword}&lang=en`),
    resultsPage: 'body.search main .page-title',
  },
};

export const searchableComicSources = Object.keys(comicSearch);

export const searchComics = async (source, query) => {
  const host = ComicHostName[source];
  const keyword = encodeURIComponent(query.trim());
  try {
    const {request, resultsPage} = comicSearch[source];
    const response = await request(host, keyword);
    const $ = load(response.data);
    if (!$(resultsPage).length)
      throw new Error('Could not load comic search results.');
    const cards = parseHomePageCards($, HomePageCardClasses[source], host);
    recordSourceSuccess(source);
    return cards;
  } catch (error) {
    if (error.response?.status)
      recordSourceError(source, error.response.status);
    throw error;
  }
};
