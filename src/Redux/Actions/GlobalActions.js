// import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
  clearData,
  StopLoading,
  ClearError,
  pushHistory,
  DownTime,
  updateData,
  AnimeWatched,
} from '../Reducers';
import {Alert} from 'react-native';
import {goBack} from '../../Navigation/NavigationService';
import APICaller from '../Controller/Interceptor';
import {ComicHostName} from '../../Utils/APIs';
import {
  ComicBookPageClasses,
  ComicDetailPageClasses,
} from '../../Screens/Comic/APIs/constance';
import { isMacOS } from '../../Utils/PlatformUtils';

// Conditional imports for Firebase Crashlytics
let crashlytics = {
  recordError: () => {},
  log: () => {},
  setAttribute: () => {},
  setUserId: () => {},
  crash: () => {},
};

if (!isMacOS) {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
  } catch (error) {
    console.log('Firebase Crashlytics not available on this platform');
  }
}

/**
 * Action creator for handling watched data.
 *
 * @param {Object} data - The data to be processed and dispatched.
 * @returns {Function} A thunk function that dispatches the pushHistory action with the provided data.
 */
export const WatchedData = data => async (dispatch, getState) => {
  dispatch(pushHistory(data));
};

/**
 * Checks for downtime based on the error response and dispatches appropriate actions.
 *
 * @param {Object} error - The error object received from the API call.
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {Function} - A function that dispatches actions based on the error status.
 */
export const checkDownTime = error => async dispatch => {
  //if error is 500+ then set down time
  dispatch(StopLoading());
  if (!error) return dispatch(DownTime(false));
  if (error?.response?.status >= 500) {
    dispatch(DownTime(true));
    dispatch(
      fetchDataFailure(
        'Oops!! Looks like the server is down right now,\nPlease try again later...',
      ),
    );
    return;
  }
  if (error?.response?.status === 404) {
    if (error.response.AnimeVideo) {
      dispatch(
        fetchDataFailure(
          'Oops!! Looks like the anime episode is not available right now,\nPlease try again later...',
        ),
      );
      return;
    }
    dispatch(
      fetchDataFailure(
        'Oops!! Looks like the comic is not available right now,\nPlease try again later...',
      ),
    );
    return;
  }
  if (error.response?.status === 403) {
    dispatch(
      fetchDataFailure('Oops!! something went wrong, please try again...'),
    );
    return;
  }
  //network error
  if (error.message === 'Network Error') {
    dispatch(
      fetchDataFailure(
        'Oops!! Looks like the network is down right now,\nPlease try again later...',
      ),
    );
    return;
  }
};

/**
 * Fetches comic details from a given link and dispatches appropriate actions.
 *
 * @param {string} link - The URL of the comic to fetch details for.
 * @param {boolean} [refresh=false] - Whether to refresh the data even if it exists in the state.
 * @returns {Function} A thunk function that performs the async operation.
 */
export const fetchComicDetails =
  (link, refresh = false) =>
  async (dispatch, getState) => {
    dispatch(fetchDataStart());
    try {
      const stateData = getState().data.dataByUrl[link];
      let watchedData = {
        title: stateData?.title,
        link,
        image: stateData?.imgSrc,
        lastOpenAt: new Date().getTime(),
      };

      if (!refresh && stateData) {
        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        dispatch(WatchedData(watchedData));
        return;
      }

      const response = await APICaller.get(link);
      const html = response.data;
      let $ = cheerio.load(html);

      const hostkey = Object.keys(ComicDetailPageClasses).find(key =>
        link.includes(key),
      );
      const config = ComicDetailPageClasses[hostkey];
      if (!config) throw new Error(`No config found for source: ${hostkey}`);

      let comicDetails;
      if (config.customParser) {
        comicDetails = config.customParser($, config, link);
      } else {
        const detailsContainer = $(config.detailsContainer);
        const title = $(config.title).text().trim();
        let imgSrc = detailsContainer
          .find(config.imgSrc)
          .attr(config.getImageAttr);
        if (imgSrc && imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;

        const details = {};
        if (config.detailsDL) {
          detailsContainer.find(config.detailsDL).each((i, el) => {
            const key = $(el).text().trim().replace(':', '');
            const dd = $(el).next('dd');
            if (
              key.toLowerCase() === 'tags' ||
              key.toLowerCase() === 'genres'
            ) {
              const list = [];
              dd.find('a').each((_, a) => list.push($(a).text().trim()));
              details[key] = list;
            } else {
              details[key] = dd.text().trim();
            }
          });
        }

        const summary = $(config.summary).text().trim();
        const chapters = await fetchChaptersWithPagination($, config, link);
        const pagination = getChapterPagination($, config);

        comicDetails = {
          title,
          imgSrc,
          type: details['Type'] || null,
          status: details['Status'] || null,
          releaseDate:
            details['Release'] ||
            details['Released'] ||
            details['Date of release'] ||
            null,
          categories: details['Category'] || details['Categories'] || null,
          tags: details['Tags'] || [],
          genres: details['Genres'] || [],
          author: details['Author'] || null,
          alternativeName:
            details['Alternative'] || details['Alternative name'] || null,
          views: details['Views'] || null,
          rating: details['Rating'] || null,
          summary,
          chapters,
          pagination,
          link,
        };
      }

      watchedData = {
        title: comicDetails.title,
        link,
        image: comicDetails.imgSrc,
        lastOpenAt: new Date().getTime(),
      };

      if (refresh) {
        dispatch(updateData({url: link, data: comicDetails}));
        dispatch(StopLoading());
        return;
      }

      dispatch(WatchedData(watchedData));
      dispatch(fetchDataSuccess({url: link, data: comicDetails}));
    } catch (error) {
      crashlytics().recordError(error);
      console.log('Error comic details:', error);
      checkDownTime(error);
      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(fetchDataFailure('Not Found'));
      goBack();
      Alert.alert('Error', 'Comic not found');
    }
  };

const fetchChaptersWithPagination = async ($, config, link) => {
  const chapters = [];
  const visitedPages = new Set();
  let currentLink = link;

  while (!visitedPages.has(currentLink)) {
    visitedPages.add(currentLink);

    $(config.chaptersList).each((i, el) => {
      const chapterTitle = $(el).find(config.chapterTitle).text().trim();
      const chapterLink = $(el).find(config.chapterLink).attr('href');
      const chapterDate = $(el).find(config.chapterDate).text().trim();

      if (chapterTitle && chapterLink) {
        chapters.push({
          title: chapterTitle,
          link: chapterLink,
          date: chapterDate,
        });
      }
    });

    const nextPageLink = $(config.pagination)
      .filter((i, el) => $(el).text().trim().toLowerCase() === 'next')
      .attr('href');

    if (!nextPageLink) break;

    const response = await APICaller.get(nextPageLink);
    currentLink = nextPageLink;
    $ = cheerio.load(response.data);
  }

  return chapters;
};

const getChapterPagination = ($, config) => {
  const pages = [];
  $(config.pagination).each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      pages.push({text, link: href});
    }
  });
  return pages;
};

/**
 * Fetches comic book data from a given URL and dispatches appropriate actions based on the result.
 *
 * @param {string} comicBook - The URL of the comic book to fetch.
 * @param {function} [setPageLink=null] - Optional callback function to set the page link.
 * @returns {function} A thunk function that performs the async fetch operation.
 */
export const fetchComicBook =
  (comicBook, isfetchComicDetails = false, isDownloadComic = false) =>
  async (dispatch, getState) => {
    const originalComicBook = comicBook;
    let modifiedComicBook = comicBook;

    const hostkey = Object.keys(ComicBookPageClasses).find(key =>
      comicBook.includes(key),
    );

    if (!hostkey) {
      console.warn('Unknown comic host:', comicBook);
      return;
    }

    // Apply host-specific transformations
    if (hostkey === 'comichubfree') {
      modifiedComicBook = `${comicBook}/all`;
    }

    if (!isDownloadComic) dispatch(fetchDataStart());

    try {
      const existingData = getState().data.dataByUrl[originalComicBook];

      if (existingData) {
        if (isfetchComicDetails && existingData.detailsLink) {
          dispatch(fetchComicDetails(existingData?.detailsLink));
        }

        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        return;
      }

      const response = await APICaller.get(modifiedComicBook);
      const html = response.data;
      const $ = cheerio.load(html);

      const {
        imageContainer,
        imageSelector,
        imageAttr,
        titleSelector,
        titleAttr,
        detailsLinkSelector,
        detailsLinkAttr = 'href',
      } = ComicBookPageClasses[hostkey];

      const container = $(imageContainer);
      const imgSources = [];

      container.find(imageSelector).each((_, el) => {
        const src = $(el).attr(imageAttr)?.trim();
        if (src) imgSources.push(src);
      });

      const title =
        container.find(titleSelector).first().attr(titleAttr)?.trim() || '';

      // Get details page link if available
      let detailsLink = '';
      let detailPageTitle = '';
      if (detailsLinkSelector) {
        const detailAnchor = $(detailsLinkSelector).first();
        detailsLink = detailAnchor.attr(detailsLinkAttr)?.trim() || '';
        detailPageTitle = detailAnchor.text().trim() || '';
      }

      const data = {
        images: imgSources,
        title,
        lastReadPage: 0,
        BookmarkPages: [],
        detailsLink,
        detailPageTitle,
      };
      console.log('Fetched data:', data);

      if (isfetchComicDetails && detailsLink) {
        dispatch(fetchComicDetails(detailsLink));
      }

      dispatch(fetchDataSuccess({url: originalComicBook, data}));

      if (isDownloadComic) return {url: originalComicBook, data};
    } catch (error) {
      crashlytics().recordError(error);
      console.log('Error comic book:', error);
      dispatch(fetchDataFailure(error.message));
      checkDownTime(error);
    }
  };

/**
 * Asynchronous action to clear error state.
 * Dispatches actions to indicate the start of data fetching and to reset any existing error.
 *
 * @returns {Function} A thunk that dispatches actions to clear error state.
 */
export const clearError = () => async dispatch => {
  dispatch(fetchDataStart());
  dispatch(fetchDataFailure(null));
};

/**
 * Clears the data associated with a given URL.
 *
 * This function dispatches three actions in sequence:
 * 1. `fetchDataStart` to indicate the start of a data fetch operation.
 * 2. `fetchDataFailure` with `null` to reset any previous error state.
 * 3. `fetchDataSuccess` with the provided URL and `null` data to clear the data.
 *
 * @param {string} url - The URL whose associated data needs to be cleared.
 * @returns {Function} A thunk function that dispatches the actions.
 */
export const clearDataByUrl = url => async dispatch => {
  dispatch(fetchDataStart());
  dispatch(fetchDataFailure(null));
  dispatch(fetchDataSuccess({url, data: null}));
};

/**
 * Asynchronous action to clear all data.
 * Dispatches the clearData action.
 *
 * @returns {Function} A function that takes dispatch as an argument and dispatches the clearData action.
 */
export const clearAllData = () => async dispatch => {
  dispatch(clearData());
};

/**
 * Fetches available advanced search filter options from readcomicsonline.
 * This function performs a GET request to the advanced search page,
 * dispatches fetch start and error actions, and parses the options.
 *
 * @param {Function} dispatch - Redux dispatch function.
 * @returns {Promise<Object|null>} An object with filter options, or null on error.
 */
export const getAdvancedSearchFilters = () => async dispatch => {
  dispatch(fetchDataStart());
  const url = 'https://readcomicsonline.ru/advanced-search';
  try {
    const response = await APICaller.get(url);
    const $ = cheerio.load(response.data);

    // Extract categories filter options
    let categoryOptions = [];
    if (
      $('select[name="categories[]"]').next('.selectize-control').length > 0
    ) {
      categoryOptions = $('select[name="categories[]"]')
        .next('.selectize-control')
        .find('.option')
        .map((i, el) => {
          const value = $(el).attr('data-value');
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    } else {
      categoryOptions = $('select[name="categories[]"]')
        .find('option')
        .map((i, el) => {
          const value = $(el).attr('value')?.trim();
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    }

    // Extract status filter options
    let statusOptions = [];
    if ($('select[name="status[]"]').next('.selectize-control').length > 0) {
      statusOptions = $('select[name="status[]"]')
        .next('.selectize-control')
        .find('.option')
        .map((i, el) => {
          const value = $(el).attr('data-value');
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    } else {
      statusOptions = $('select[name="status[]"]')
        .find('option')
        .map((i, el) => {
          const value = $(el).attr('value')?.trim();
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    }

    // Extract types filter options
    let typesOptions = [];
    if ($('select[name="types[]"]').next('.selectize-control').length > 0) {
      typesOptions = $('select[name="types[]"]')
        .next('.selectize-control')
        .find('.option')
        .map((i, el) => {
          const value = $(el).attr('data-value');
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    } else {
      typesOptions = $('select[name="types[]"]')
        .find('option')
        .map((i, el) => {
          const value = $(el).attr('value')?.trim();
          const text = $(el).text().trim();
          return value && text ? {value, text} : null;
        })
        .get();
    }

    dispatch(
      checkDownTime({
        filters: {
          categories: categoryOptions,
          status: statusOptions,
          types: typesOptions,
        },
      }),
    );

    return {
      categories: categoryOptions,
      status: statusOptions,
      types: typesOptions,
    };
  } catch (error) {
    crashlytics().recordError(error);
    console.log('Error details:', error);
    console.error('Error fetching advanced search filters:', error);
    dispatch(checkDownTime(error));
    dispatch(fetchDataFailure(error.message));
    return null;
  }
};

export const searchComic =
  (queryValue, source = 'readcomicsonline') =>
  async dispatch => {
    dispatch(fetchDataStart());

    try {
      let url, formatted;

      if (source === 'readcomicsonline') {
        const host = 'https://readcomicsonline.ru';
        url = `${host}/search?query=${encodeURIComponent(queryValue)}`;
        const response = await APICaller.get(url);
        const suggestions = response?.data?.suggestions || [];

        formatted = suggestions.map(item => ({
          title: item.value,
          data: item.data,
          link: `${host}/comic/${item.data}`,
        }));
      } else if (source === 'comichubfree') {
        const host = 'https://comichubfree.com';
        url = `${host}/ajax/search?key=${encodeURIComponent(queryValue)}`;
        const response = await APICaller.get(url);
        const json = response?.data || [];

        formatted = json.map(item => ({
          title: item.title,
          data: item.slug,
          link: `${host}/comic/${item.slug}`,
        }));
      } else if (source === 'readallcomics') {
        const host = 'https://readallcomics.com';
        url = `${host}/?story=${queryValue.replace(/ /g, '+')}&s=&type=comic`;
        const response = await APICaller.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        formatted = [];
        $('ul.list-story.categories li a').each((_, element) => {
          const title = $(element).text().trim();
          const href = $(element).attr('href');
          formatted.push({
            title,
            data: href.split('/').filter(Boolean).pop(), // get last part of URL
            link: href.startsWith('http') ? href : `${host}${href}`,
          });
        });
      } else {
        throw new Error(`Unsupported source: ${source}`);
      }

      dispatch(fetchDataSuccess({url, data: formatted}));
      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(checkDownTime());
      return formatted;
    } catch (error) {
      crashlytics().recordError(error);
      console.log('Error details:', error);
      dispatch(fetchDataFailure(error.message));
      dispatch(checkDownTime(error));
      return null;
    }
  };
