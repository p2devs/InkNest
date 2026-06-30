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

// Novel APIs
import {
  getNovelHome,
  getNovelDetails,
  getNovelChapter,
  getNovelHostKeyFromLink,
  NovelHomePageClasses,
  NovelDetailPageClasses,
  NovelChapterPageClasses,
} from '../../Screens/Novel/APIs';

// Utilities
import {checkDownTime, handleAPIError} from './utils/errorHandlers';
import {hasLoadedChapterData, buildWatchedData} from './utils/dataHelpers';

// Re-export checkDownTime for backward compatibility
export {checkDownTime};

// ============================================
// Action Type Constants
// ============================================

export const NOVEL_ACTION_TYPES = {
  SWITCH_NOVEL_SOURCE: 'SWITCH_NOVEL_SOURCE',
  FETCH_NOVEL_HOME_START: 'FETCH_NOVEL_HOME_START',
  FETCH_NOVEL_HOME_SUCCESS: 'FETCH_NOVEL_HOME_SUCCESS',
  FETCH_NOVEL_HOME_FAILURE: 'FETCH_NOVEL_HOME_FAILURE',
  FETCH_NOVEL_DETAILS_START: 'FETCH_NOVEL_DETAILS_START',
  FETCH_NOVEL_DETAILS_SUCCESS: 'FETCH_NOVEL_DETAILS_SUCCESS',
  FETCH_NOVEL_DETAILS_FAILURE: 'FETCH_NOVEL_DETAILS_FAILURE',
  FETCH_NOVEL_CHAPTER_START: 'FETCH_NOVEL_CHAPTER_START',
  FETCH_NOVEL_CHAPTER_SUCCESS: 'FETCH_NOVEL_CHAPTER_SUCCESS',
  FETCH_NOVEL_CHAPTER_FAILURE: 'FETCH_NOVEL_CHAPTER_FAILURE',
  CLEAR_NOVEL_DATA: 'CLEAR_NOVEL_DATA',
};

// ============================================
// Action Creators
// ============================================

/**
 * Action creator to switch the active novel source.
 *
 * @param {string} sourceKey - The key identifying the novel source (e.g., 'novelfire').
 * @returns {Object} The action object with type and payload.
 */
export const switchNovelSource = sourceKey => ({
  type: NOVEL_ACTION_TYPES.SWITCH_NOVEL_SOURCE,
  payload: sourceKey,
});

/**
 * Action creator for handling watched data.
 *
 * @param {Object} data - The data to be processed and dispatched.
 * @returns {Function} A thunk function that dispatches the pushHistory action.
 */
export const WatchedData = data => async (dispatch, getState) => {
  dispatch(pushHistory(data));
};

// ============================================
// Thunk Actions
// ============================================

/**
 * Fetches novel home data for a given source and dispatches appropriate actions.
 *
 * @param {string} [hostKey='novelfire'] - The host key identifying the novel source.
 * @returns {Function} A thunk function that performs the async operation.
 */
export const fetchNovelHome =
  (hostKey = 'novelfire') =>
  async (dispatch, getState) => {
    dispatch(fetchDataStart());
    dispatch({type: NOVEL_ACTION_TYPES.FETCH_NOVEL_HOME_START});

    try {
      const homeData = await getNovelHome(hostKey);

      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(checkDownTime());
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_HOME_SUCCESS,
        payload: {hostKey, data: homeData},
      });
    } catch (error) {
      handleAPIError(error, dispatch, crashlytics, 'fetchNovelHome', hostKey);
      dispatch(ClearError());
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_HOME_FAILURE,
        payload: error.message || 'Failed to fetch novel home',
      });
      Alert.alert('Error', 'Failed to load novel home page');
    }
  };

/**
 * Fetches novel details from a given link and dispatches appropriate actions.
 *
 * @param {string} link - The URL of the novel to fetch details for.
 * @param {string} [hostKey] - Optional host key. If not provided, will be extracted from link.
 * @param {boolean} [refresh=false] - Whether to refresh the data even if it exists in the state.
 * @returns {Function} A thunk function that performs the async operation.
 */
export const fetchNovelDetails =
  (link, hostKey, refresh = false) =>
  async (dispatch, getState) => {
    dispatch(fetchDataStart());
    dispatch({type: NOVEL_ACTION_TYPES.FETCH_NOVEL_DETAILS_START});

    try {
      // Determine host key from link if not provided
      const resolvedHostKey =
        hostKey || getNovelHostKeyFromLink(link, NovelDetailPageClasses);

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
      const novelDetails = await getNovelDetails(link, resolvedHostKey);
      watchedData = buildWatchedData(novelDetails, link);

      // Update or save data based on refresh flag
      if (refresh) {
        dispatch(updateData({url: link, data: novelDetails}));
        dispatch(StopLoading());
        dispatch(WatchedData(watchedData));
        return;
      }

      dispatch(WatchedData(watchedData));
      dispatch(fetchDataSuccess({url: link, data: novelDetails}));
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_DETAILS_SUCCESS,
        payload: {link, data: novelDetails, hostKey: resolvedHostKey},
      });
    } catch (error) {
      const resolvedHostKey =
        hostKey || getNovelHostKeyFromLink(link, NovelDetailPageClasses);
      handleAPIError(
        error,
        dispatch,
        crashlytics,
        'fetchNovelDetails',
        resolvedHostKey,
      );
      dispatch(ClearError());
      dispatch(fetchDataFailure('Not Found'));
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_DETAILS_FAILURE,
        payload: error.message || 'Failed to fetch novel details',
      });
      goBack();
      Alert.alert('Error', 'Novel not found');
    }
  };

/**
 * Fetches novel chapter content from a given link and dispatches appropriate actions.
 *
 * @param {string} link - The URL of the chapter to fetch.
 * @param {string} [hostKey] - Optional host key. If not provided, will be extracted from link.
 * @param {boolean} [refresh=false] - Whether to refresh the data even if it exists in the state.
 * @returns {Function} A thunk function that performs the async operation.
 */
export const fetchNovelChapter =
  (link, hostKey, refresh = false) =>
  async (dispatch, getState) => {
    dispatch(fetchDataStart());
    dispatch({type: NOVEL_ACTION_TYPES.FETCH_NOVEL_CHAPTER_START});

    try {
      // Determine host key from link if not provided
      const resolvedHostKey =
        hostKey || getNovelHostKeyFromLink(link, NovelChapterPageClasses);

      // Check if we can use cached data
      const state = getState();
      const stateData = state?.data?.dataByUrl?.[link];

      if (!refresh && stateData && stateData.content) {
        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(checkDownTime());
        return;
      }

      // Fetch fresh data
      const chapterData = await getNovelChapter(link, resolvedHostKey);

      // Update or save data based on refresh flag
      if (refresh) {
        dispatch(updateData({url: link, data: chapterData}));
        dispatch(StopLoading());
        return;
      }

      dispatch(fetchDataSuccess({url: link, data: chapterData}));
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_CHAPTER_SUCCESS,
        payload: {link, data: chapterData, hostKey: resolvedHostKey},
      });
    } catch (error) {
      const resolvedHostKey =
        hostKey || getNovelHostKeyFromLink(link, NovelChapterPageClasses);
      handleAPIError(
        error,
        dispatch,
        crashlytics,
        'fetchNovelChapter',
        resolvedHostKey,
      );
      dispatch(ClearError());
      dispatch(fetchDataFailure('Not Found'));
      dispatch({
        type: NOVEL_ACTION_TYPES.FETCH_NOVEL_CHAPTER_FAILURE,
        payload: error.message || 'Failed to fetch chapter',
      });
      goBack();
      Alert.alert('Error', 'Chapter not found');
    }
  };

/**
 * Clears all novel-related data from the store.
 *
 * @returns {Function} A thunk function that dispatches the clear action.
 */
export const clearNovelData = () => dispatch => {
  dispatch(clearData());
  dispatch({type: NOVEL_ACTION_TYPES.CLEAR_NOVEL_DATA});
};