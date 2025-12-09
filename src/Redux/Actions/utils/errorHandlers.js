/**
 * Error handling utilities for Redux actions
 */

import {StopLoading, DownTime, fetchDataFailure} from '../../Reducers';

// Error message templates
export const ERROR_MESSAGES = {
  SERVER_DOWN: 'Oops!! Looks like the server is down right now,\nPlease try again later...',
  NETWORK_ERROR: 'Oops!! Looks like the network is down right now,\nPlease try again later...',
  NOT_FOUND: 'Oops!! Looks like the comic is not available right now,\nPlease try again later...',
  ANIME_NOT_FOUND: 'Oops!! Looks like the anime episode is not available right now,\nPlease try again later...',
  GENERAL_ERROR: 'Oops!! something went wrong, please try again...',
};

// HTTP status code ranges
export const HTTP_STATUS = {
  SERVER_ERROR: 500,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
};

/**
 * Checks for downtime based on the error response and dispatches appropriate actions.
 *
 * @param {Object} error - The error object received from the API call.
 * @returns {Function} - A function that dispatches actions based on the error status.
 */
export const checkDownTime = error => async dispatch => {
  dispatch(StopLoading());

  if (!error) {
    dispatch(DownTime(false));
    return;
  }

  const statusCode = error?.response?.status;

  // Server error (500+)
  if (statusCode >= HTTP_STATUS.SERVER_ERROR) {
    dispatch(DownTime(true));
    dispatch(fetchDataFailure(ERROR_MESSAGES.SERVER_DOWN));
    return;
  }

  // Not found error (404)
  if (statusCode === HTTP_STATUS.NOT_FOUND) {
    const errorMessage = error.response.AnimeVideo
      ? ERROR_MESSAGES.ANIME_NOT_FOUND
      : ERROR_MESSAGES.NOT_FOUND;
    dispatch(fetchDataFailure(errorMessage));
    return;
  }

  // Forbidden error (403)
  if (statusCode === HTTP_STATUS.FORBIDDEN) {
    dispatch(fetchDataFailure(ERROR_MESSAGES.GENERAL_ERROR));
    return;
  }

  // Network error
  if (error.message === 'Network Error') {
    dispatch(fetchDataFailure(ERROR_MESSAGES.NETWORK_ERROR));
    return;
  }
};

/**
 * Generic error handler for API calls
 *
 * @param {Error} error - The error object
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} crashlytics - Firebase crashlytics instance
 * @param {string} context - Context of where error occurred
 */
export const handleAPIError = (error, dispatch, crashlytics, context = 'API call') => {
  crashlytics().recordError(error);
  console.log(`Error in ${context}:`, error);
  dispatch(checkDownTime(error));
};
