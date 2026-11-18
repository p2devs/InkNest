import * as cheerio from 'cheerio';
import {Alert} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';

// Redux actions
import {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
  clearData,
  StopLoading,
  ClearError,
  pushHistory,
  updateData,
} from '../Reducers';

// Navigation
import {goBack} from '../../Navigation/NavigationService';

// API
import APICaller from '../Controller/Interceptor';

// Configurations
import {ComicDetailPageClasses} from '../../Screens/Comic/APIs/constance';
import {getComicSourceKey} from '../../Utils/APIs';
import {recordSourceSuccess} from '../../Utils/sourceStatus';

// Utilities
import {checkDownTime, handleAPIError} from './utils/errorHandlers';
import {
  hasLoadedChapterData,
  buildWatchedData,
} from './utils/dataHelpers';

// Parsers
import {parseComicDetails} from './parsers/comicDetailParser';
import {
  fetchChaptersWithPagination,
  getChapterPagination,
} from './parsers/chapterParser';
import {
  parseComicBookPlusPage,
  parseComicIssue,
  getComicReaderUrl,
  createComicBookData,
} from './parsers/comicBookParser';
// Re-export checkDownTime for backward compatibility
export {checkDownTime};

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
 * Fetches comic details from a given link and dispatches appropriate actions.
 *
 * @param {string} link - The URL of the comic to fetch details for.
 * @param {boolean} [refresh=false] - Whether to refresh the data even if it exists in the state.
 * @returns {Function} A thunk function that performs the async operation.
 */
export const fetchComicDetails =
  (link, refresh = false) =>
  async (dispatch, getState) => {
    const source = getComicSourceKey(link);
    if (!source) {
      goBack();
      Alert.alert('Source unavailable', 'This comic source is no longer supported.');
      return;
    }
    dispatch(fetchDataStart());

    try {
      // Check if we can use cached data
      const state = getState();
      const stateData = state?.data?.dataByUrl?.[link];
      const hasUsableStateData = hasLoadedChapterData(stateData);
      let watchedData = buildWatchedData(stateData, link);

      if (!refresh && stateData && hasUsableStateData) {
        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        dispatch(WatchedData(watchedData));
        return;
      }

      // Fetch fresh data
      const response = await APICaller.get(link);
      const html = response.data;
      const $ = cheerio.load(html);

      const config = ComicDetailPageClasses[source];
      const comicDetails = await parseComicDetails($, config, link);
      comicDetails.chapters = await fetchChaptersWithPagination($, config, link);
      comicDetails.pagination = getChapterPagination($, config);
      if (source !== 'comicbookplus' && (!comicDetails.title || !comicDetails.chapters.length)) {
        throw new Error('Could not load the comic or its issues.');
      }
      recordSourceSuccess(source);

      watchedData = buildWatchedData(comicDetails, link);

      // Update or save data based on refresh flag
      if (refresh) {
        dispatch(updateData({url: link, data: comicDetails}));
        dispatch(StopLoading());
        dispatch(WatchedData(watchedData));
        return;
      }

      dispatch(WatchedData(watchedData));
      dispatch(fetchDataSuccess({url: link, data: comicDetails}));
    } catch (error) {
      handleAPIError(error, dispatch, crashlytics, 'fetchComicDetails', source);
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
 * @param {boolean} [isfetchComicDetails=false] - Whether to also fetch comic details page.
 * @param {boolean} [isDownloadComic=false] - Whether this is for downloading (skips some dispatches).
 * @returns {function} A thunk function that performs the async fetch operation.
 */
export const fetchComicBook =
  (comicBook, isfetchComicDetails = false, isDownloadComic = false) =>
  async (dispatch, getState) => {
    const source = getComicSourceKey(comicBook);
    if (!source) {
      if (!isDownloadComic) {
        goBack();
        Alert.alert('Source unavailable', 'This comic source is no longer supported.');
      }
      return;
    }

    if (!isDownloadComic) {
      dispatch(fetchDataStart());
    }

    try {
      // Check for existing data
      const existingData = getState().data.dataByUrl[comicBook];

      // Validate cached data has usable images (fixes stale cache from parser updates)
      const hasValidImages =
        existingData &&
        Array.isArray(existingData.images) &&
        existingData.images.length > 0;

      if (hasValidImages) {
        if (isfetchComicDetails && existingData.detailsLink) {
          dispatch(fetchComicDetails(existingData?.detailsLink));
        }

        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        if (isDownloadComic) return {url: comicBook, data: existingData};
        return;
      }

      // Fetch fresh data
      // Keep history and downloads keyed by the issue's original URL.
      const readerUrl = getComicReaderUrl(source, comicBook);
      const response = await APICaller.get(readerUrl);
      const html = response.data;
      const $ = cheerio.load(html);

      const parsedData = source === 'comicbookplus'
        ? parseComicBookPlusPage(html, $)
        : parseComicIssue($, source, readerUrl);
      const data = createComicBookData(parsedData);
      recordSourceSuccess(source);

      // Optionally fetch details page
      if (isfetchComicDetails && data.detailsLink) {
        dispatch(fetchComicDetails(data.detailsLink));
      }

      dispatch(fetchDataSuccess({url: comicBook, data}));

      if (isDownloadComic) {
        return {url: comicBook, data};
      }
    } catch (error) {
      handleAPIError(error, dispatch, crashlytics, 'fetchComicBook', source);
      dispatch(fetchDataFailure(error.message));
    }
  };

/**
 * Clears error state.
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
 * @param {string} url - The URL whose associated data needs to be cleared.
 * @returns {Function} A thunk function that dispatches the actions.
 */
export const clearDataByUrl = url => async dispatch => {
  dispatch(fetchDataStart());
  dispatch(fetchDataFailure(null));
  dispatch(fetchDataSuccess({url, data: null}));
};

/**
 * Clears all data from the store.
 *
 * @returns {Function} A thunk that dispatches the clearData action.
 */
export const clearAllData = () => async dispatch => {
  dispatch(clearData());
};
