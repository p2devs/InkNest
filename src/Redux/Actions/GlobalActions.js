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
import {
  ComicBookPageClasses,
  ComicDetailPageClasses,
} from '../../Screens/Comic/APIs/constance';

// Utilities
import {checkDownTime, handleAPIError} from './utils/errorHandlers';
import {
  hasLoadedChapterData,
  buildWatchedData,
  getHostKeyFromUrl,
} from './utils/dataHelpers';

// Parsers
import {parseComicDetails} from './parsers/comicDetailParser';
import {
  fetchChaptersWithPagination,
  getChapterPagination,
} from './parsers/chapterParser';
import {
  transformComicBookUrl,
  parseStandardComicBook,
  parseComicBookPlusPage,
  createComicBookData,
} from './parsers/comicBookParser';
import {
  buildSearchUrl,
  parseSearchResults,
} from './parsers/searchParser';
import {
  getAdvancedSearchConfig,
  parseAdvancedSearchFilters,
} from './parsers/advancedSearchParser';

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
      let $ = cheerio.load(html);

      // Get configuration for this host
      const hostkey = getHostKeyFromUrl(link, ComicDetailPageClasses);
      const config = ComicDetailPageClasses[hostkey];
      
      if (!config) {
        throw new Error(`No config found for source: ${hostkey}`);
      }

      // Parse comic details
      let comicDetails;
      if (config.customParser) {
        comicDetails = config.customParser($, config, link);
      } else {
        comicDetails = await parseComicDetails($, config, link);
        const chapters = await fetchChaptersWithPagination($, config, link);
        const pagination = getChapterPagination($, config);
        comicDetails.chapters = chapters;
        comicDetails.pagination = pagination;
      }

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
      handleAPIError(error, dispatch, crashlytics, 'fetchComicDetails');
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
    const originalComicBook = comicBook;

    // Get host configuration
    const hostkey = getHostKeyFromUrl(comicBook, ComicBookPageClasses);

    if (!hostkey) {
      console.warn('Unknown comic host:', comicBook);
      return;
    }

    // Apply host-specific URL transformations
    const modifiedComicBook = transformComicBookUrl(comicBook, hostkey);

    if (!isDownloadComic) {
      dispatch(fetchDataStart());
    }

    try {
      // Check for existing data
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

      // Fetch fresh data
      const response = await APICaller.get(modifiedComicBook);
      const html = response.data;
      const $ = cheerio.load(html);

      const config = ComicBookPageClasses[hostkey];
      
      // Parse comic book based on configuration
      let parsedData;
      if (config.useJsVars) {
        parsedData = parseComicBookPlusPage(html, $);
      } else {
        parsedData = parseStandardComicBook($, config);
      }

      const data = createComicBookData(parsedData);
      console.log('Fetched data:', data);

      // Optionally fetch details page
      if (isfetchComicDetails && data.detailsLink) {
        dispatch(fetchComicDetails(data.detailsLink));
      }

      dispatch(fetchDataSuccess({url: originalComicBook, data}));

      if (isDownloadComic) {
        return {url: originalComicBook, data};
      }
    } catch (error) {
      handleAPIError(error, dispatch, crashlytics, 'fetchComicBook');
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

/**
 * Fetches available advanced search filter options.
 *
 * @param {string} [source='readcomicsonline'] - The source to fetch filters for.
 * @returns {Promise<Object|null>} An object with filter options, or null on error.
 */
export const getAdvancedSearchFilters = (source = 'readcomicsonline') => async dispatch => {
  dispatch(fetchDataStart());
  
  const config = getAdvancedSearchConfig(source);
  
  if (!config) {
    console.error(`No advanced search config found for source: ${source}`);
    dispatch(fetchDataFailure(`Unsupported source: ${source}`));
    return null;
  }

  try {
    const response = await APICaller.get(config.url);
    const $ = cheerio.load(response.data);

    const filters = parseAdvancedSearchFilters($, config);

    dispatch(checkDownTime({filters}));

    return filters;
  } catch (error) {
    handleAPIError(error, dispatch, crashlytics, 'getAdvancedSearchFilters');
    dispatch(fetchDataFailure(error.message));
    return null;
  }
};

/**
 * Searches for comics on a given source.
 *
 * @param {string} queryValue - The search query.
 * @param {string} [source='readcomicsonline'] - The source to search on.
 * @returns {Promise<Array|null>} Array of search results, or null on error.
 */
export const searchComic =
  (queryValue, source = 'readcomicsonline') =>
  async dispatch => {
    dispatch(fetchDataStart());

    try {
      const url = buildSearchUrl(source, queryValue);
      const response = await APICaller.get(url);
      
      // Parse results based on source type
      let formatted;
      if (source === 'readallcomics') {
        const $ = cheerio.load(response.data);
        formatted = parseSearchResults(source, $);
      } else {
        formatted = parseSearchResults(source, response.data);
      }

      dispatch(fetchDataSuccess({url, data: formatted}));
      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(checkDownTime());
      return formatted;
    } catch (error) {
      handleAPIError(error, dispatch, crashlytics, 'searchComic');
      dispatch(fetchDataFailure(error.message));
      return null;
    }
  };
