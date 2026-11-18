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

const catalogPaths = {
  comicbookplus: page => `?cbplus=latestuploads_l_s_${page - 1}`,
  xoxocomic: page => `new-comic?page=${page}`,
  ocecomic: page => `comic/all/latest/page/${page}`,
};

export const getComics = async (source, page = 1, dispatch) => {
  try {
    const url = ComicHostName[source] + catalogPaths[source](page);
    const response = await APICaller.get(url);
    const $ = load(response.data);
    const config =
      source === 'comicbookplus'
        ? HomePageCardClasses.comicbookplus['latest-uploads']
        : HomePageCardClasses[source];
    const comicsData = parseHomePageCards($, config, url);
    if (!comicsData.length)
      throw new Error('Could not load the comic catalog.');

    let lastPage = null;
    if (source === 'ocecomic') {
      lastPage =
        Number($('main select[name="page"] option').last().val()) || page;
    } else if (
      source === 'xoxocomic' &&
      !$('.pagination a[rel="next"]').length
    ) {
      lastPage = page;
    } else if (source === 'comicbookplus') {
      lastPage =
        Number(
          $('title')
            .text()
            .match(/\bof (\d+)$/)?.[1],
        ) || null;
    }
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

export const searchableComicSources = ['xoxocomic', 'ocecomic'];

export const searchComics = async (source, query) => {
  const host = ComicHostName[source];
  const keyword = encodeURIComponent(query.trim());
  try {
    // OceComic's form redirects to the site's own normalized search slug.
    const response =
      source === 'ocecomic'
        ? await APICaller.post(host, `q=${keyword}`, {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          })
        : await APICaller.get(`${host}search-comic?keyword=${keyword}`);
    const $ = load(response.data);
    const resultsPage =
      source === 'ocecomic' ? 'main#Search' : '#ctl00_divCenter h1';
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
