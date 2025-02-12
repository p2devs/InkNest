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
  UpdateSearch,
  DownTime,
  updateData,
  AnimeWatched,
} from '../Reducers';
import {Alert} from 'react-native';
import {goBack} from '../../Navigation/NavigationService';
import APICaller from '../Controller/Interceptor';

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
      const $ = cheerio.load(html);

      // Details Section
      const detailsContainer = $('.list-container');
      const title = $('img.img-responsive').attr('alt')?.trim();
      let imgSrc = detailsContainer
        .find('.boxed img.img-responsive')
        .attr('src');
      if (imgSrc && imgSrc.startsWith('//')) {
        imgSrc = 'https:' + imgSrc;
      }

      // Build a details map from the <dl class="dl-horizontal">
      const details = {};
      detailsContainer.find('dl.dl-horizontal dt').each((i, el) => {
        const key = $(el).text().trim().replace(':', '');
        const dd = $(el).next('dd');
        if (key === 'Tags') {
          const tags = [];
          dd.find('a').each((j, a) => {
            tags.push($(a).text().trim());
          });
          details[key] = tags;
        } else if (key === 'Categories') {
          details[key] = dd.find('a').first().text().trim();
        } else if (key === 'Rating') {
          details[key] = dd.text().trim();
        } else {
          details[key] = dd.text().trim();
        }
      });

      // Summary Section
      const summary = $('div.manga.well p').text().trim();

      // Chapters Section
      const chapters = [];
      $('ul.chapters li').each((i, el) => {
        const chapterTitle = $(el).find('h5.chapter-title-rtl a').text().trim();
        const chapterLink = $(el).find('h5.chapter-title-rtl a').attr('href');
        const chapterDate = $(el)
          .find('div.date-chapter-title-rtl')
          .text()
          .trim();
        chapters.push({
          title: chapterTitle,
          link: chapterLink,
          date: chapterDate,
        });
      });

      // Create comic details object using the new API structure
      const comicDetails = {
        title,
        imgSrc,
        type: details['Type'] || null,
        status: details['Status'] || null,
        releaseDate: details['Date of release'] || null,
        categories: details['Categories'] || null,
        tags: details['Tags'] || [],
        views: details['Views'] || null,
        rating: details['Rating'] || null,
        summary,
        chapters,
        link,
      };

      console.log('comicDetails', comicDetails);

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
      console.error(
        'Error fetching comic details:',
        error.response?.status || error,
      );
      checkDownTime(error);
      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(fetchDataFailure('Not Found'));
      goBack();
      Alert.alert('Error', 'Comic not found');
    }
  };

/**
 * Fetches comic book data from a given URL and dispatches appropriate actions based on the result.
 *
 * @param {string} comicBook - The URL of the comic book to fetch.
 * @param {function} [setPageLink=null] - Optional callback function to set the page link.
 * @returns {function} A thunk function that performs the async fetch operation.
 */
export const fetchComicBook =
  (comicBook, setPageLink = null, isDownloadComic) =>
  async (dispatch, getState) => {
    if (!isDownloadComic) dispatch(fetchDataStart());
    try {
      const Data = getState().data.dataByUrl[comicBook];
      if (Data) {
        if (setPageLink) {
          setPageLink(Data.ComicDetailslink);
        }
        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        return;
      }
      const response = await APICaller.get(comicBook);
      const html = response.data;
      const $ = cheerio.load(html);

      // New API: Extract chapter images using data-src attribute
      const imageContainer = $('.imagecnt');
      const imgSources = [];
      imageContainer
        .find('img.img-responsive[data-src]')
        .each((index, element) => {
          const src = $(element).attr('data-src')?.trim();
          if (src) {
            imgSources.push(src);
          }
        });

      const data = {
        images: imgSources,
        // It is assumed the chapter title is embedded in the alt text of the first image.
        // Adjust the extraction as needed.
        title:
          imageContainer
            .find('img.img-responsive')
            .first()
            .attr('alt')
            ?.trim() || '',
        lastReadPage: 0,
        BookmarkPages: [],
        ComicDetailslink: '',
      };

      if (setPageLink) {
        setPageLink(data.ComicDetailslink);
      }
      dispatch(fetchDataSuccess({url: comicBook, data}));
      if (isDownloadComic) return {url: comicBook, data};
    } catch (error) {
      dispatch(fetchDataFailure(error.message));
      checkDownTime(error);
    }
  };

/**
 * Fetches search results for a comic based on the provided search query.
 * Dispatches actions to update the search state and handle loading states.
 *
 * @param {string} search - The search query for the comic.
 * @returns {Function} A thunk function that performs the search and dispatches actions.
 */
export const SearchComicByReadAllComics = search => async dispatch => {
  dispatch(fetchDataStart());
  try {
    dispatch(UpdateSearch({user: 'user', query: search}));
    const response = await APICaller.get(
      `https://readallcomics.com/?story=${search.replaceAll(
        ' ',
        '+',
      )}&s=&type=comic`,
    );
    const html = response.data;
    const $ = cheerio.load(html);
    const results = [];

    // Find all <a> elements with class "list-story categories"
    $('ul.list-story.categories li a').each((index, element) => {
      // console.log('element', element);
      const title = $(element).text().trim();
      const href = $(element).attr('href');
      results.push({title, href});
    });
    dispatch(StopLoading());
    if (results.length === 0) {
      dispatch(UpdateSearch({user: 'error', error: 'No results found'}));
      return;
    }
    dispatch(UpdateSearch({user: 'system', results}));
  } catch (error) {
    console.error('Error fetching data:', error);
    checkDownTime(error);
    dispatch(StopLoading());
    dispatch(
      UpdateSearch({
        user: 'error',
        error: 'Oops!! something went wrong, please try again...',
      }),
    );
  }
};
/**
 * Fetches search results for a comic from azcomix.me based on the provided search query.
 *
 * @param {string} searchKey - The search query for the comic.
 * @returns {Promise<Array>} A promise that resolves to an array of comic details.
 */
export const SearchComicByAzComic = async (searchKey, dispatch) => {
  dispatch(fetchDataStart());
  try {
    const formattedKey = searchKey.replaceAll(/\s+/g, '+');
    const url = `https://azcomix.me/advanced-search?key=${formattedKey}`;

    const response = await APICaller.get(url);
    const $ = cheerio.load(response.data);

    const comics = [];
    $('.detailed-list .dl-box').each((index, element) => {
      const title = $(element).find('.dlb-title').text().trim();
      const image = $(element).find('.dlb-image img').attr('src');
      const link = $(element).find('.dlb-title').attr('href');
      const genres = $(element)
        .find('.dlb-details strong:contains("Genre :")')
        .next()
        .text()
        .trim();

      comics.push({
        title,
        image,
        link,
        genres,
      });
    });

    dispatch(checkDownTime(response));
    return comics;
  } catch (error) {
    console.error('Error fetching data for search Comic AZ:', error);
    if (dispatch) {
      dispatch(checkDownTime(error));
    }
    return null;
  }
};

/**
 * Redux action to update the anime history in the state.
 *
 * @param {Object} params - The parameters object.
 * @param {Object} params.data - The data object containing anime information.
 * @param {string} params.data.AnimeName - The name of the anime.
 * @param {string} params.data.ActiveEpisdeLink - The link to the active episode.
 * @param {number} params.data.ActiveEpisdoe - The active episode number.
 * @param {number} params.data.ActiveEpisdoeProgress - The progress of the active episode.
 * @param {number} params.data.ActiveEpisdoeDuration - The duration of the active episode.
 * @param {boolean} params.data.ActiveEpisdoePlayable - Whether the active episode is playable.
 * @returns {Function} A thunk function that dispatches the AnimeWatched action.
 */
export const AnimeHistroy =
  ({data}) =>
  async (dispatch, getState) => {
    //get data from state
    let History = getState().data.AnimeWatched;
    let WatchedEpisodes = History[data.AnimeName]?.Episodes;
    let AnimeData = {
      ...data,
      Episodes: {
        ...WatchedEpisodes,
        [data.ActiveEpisdeLink]: {
          Link: data.ActiveEpisdeLink,
          Episode: data?.ActiveEpisdoe,
          EpisdoeProgress: data?.ActiveEpisdoeProgress,
          EpisdoeDuration: data?.ActiveEpisdoeDuration,
          EpisdoePlayable: data?.ActiveEpisdoePlayable,
        },
      },
    };
    dispatch(AnimeWatched(AnimeData));
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
