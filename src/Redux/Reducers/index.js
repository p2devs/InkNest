import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dataByUrl: {},
  loading: false,
  error: null,
  history: {},
  Search: [],
  downTime: false,
  baseUrl: 'azcomic',
  Anime: false,
  AnimeWatched: {},
  AnimeBookMarks: {},
  DownloadComic: {},
};

/**
 * Redux slice for managing application state, including data fetching, updating, search history,
 * loading states, and other application-specific flags.
 *
 * @constant {Slice} Reducers
 * @property {string} name - The name of the slice.
 * @property {Object} initialState - The initial state of the slice.
 *
 * @typedef {Object} InitialState
 * @property {boolean} loading - Loading state indicator
 * @property {Object|null} error - Error state
 * @property {Object} dataByUrl - Data stored by URL
 * @property {Object} history - Navigation history
 * @property {Array} Search - Search history
 * @property {boolean} downTime - Server downtime indicator
 * @property {string} baseUrl - Base URL for API calls
 * @property {boolean} Anime - Anime mode toggle
 * @property {Object} AnimeWatched - Watched anime tracking
 * @property {Object} AnimeBookMarks - Anime bookmarks storage
 *
 * @property {Object} reducers - An object containing the reducer functions.
 * @property {function} reducers.fetchDataStart - Initiates data fetching by setting loading to true and clearing errors.
 * @property {function} reducers.fetchDataSuccess - Handles successful data fetch, updates state with new data.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action.
 *     @property {string} action.payload.url - The URL associated with the fetched data.
 *     @property {any} action.payload.data - The data fetched from the URL.
 * @property {function} reducers.fetchDataFailure - Handles failed data fetching by setting loading to false and recording the error.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the error.
 * @property {function} reducers.updateData - Updates existing data in the state with new data.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action.
 *     @property {string} action.payload.url - The URL of the data to update.
 *     @property {any} action.payload.data - The new data to merge with existing data.
 * @property {function} reducers.pushHistory - Adds a new entry to the history.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the history item.
 * @property {function} reducers.UpdateSearch - Adds a new item to the search history.
 *   @param {Object} state - The current state.
 *   @param {any} action.payload - The search item to add.
 * @property {function} reducers.StopLoading - Stops the loading state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.ClearError - Clears any error messages in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.clearData - Resets the data in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.DownTime - Handles server downtime by updating the state.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the downtime flag.
 * @property {function} reducers.SwtichBaseUrl - Switches the base URL used in the application.
 *   @param {Object} state - The current state.
 *   @param {string} action.payload - The new base URL.
 * @property {function} reducers.SwtichToAnime - Toggles the Anime flag in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.AnimeWatched - Updates the list of watched anime.
 *   @param {Object} state - The current state.
 *   @param {Object} action.payload - The anime watched information.
 * @property {function} reducers.AddAnimeBookMark - Adds an anime to the bookmarks.
 *   @param {Object} state - The current state.
 *   @param {Object} action.payload - The anime bookmark information.
 * @property {function} reducers.RemoveAnimeBookMark - Removes an anime from the bookmarks.
 *   @param {Object} state - The current state.
 *   @param {Object} action.payload - The anime bookmark information to remove.
 */

const Reducers = createSlice({
  name: 'data',
  initialState,
  reducers: {
    fetchDataStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess: (state, action) => {
      const { url, data } = action.payload;
      state.dataByUrl[url] = data;
      state.loading = false;
      state.downTime = false;
    },
    fetchDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateData: (state, action) => {
      const { url, data } = action.payload;
      //keep the old data and update the new data
      state.dataByUrl[url] = { ...state.dataByUrl[url], ...data };
      // state.dataByUrl[url] = data;
    },
    DownloadComicBook: (state, action) => {
      const { link, data, title, } = action.payload;
      
      state.DownloadComic[link] = { title, link, comicBooks: { ...state.DownloadComic[link]?.comicBooks, [data.link]: data } };
    },
    pushHistory: (state, action) => {
      // state.history.push(action.payload);
      state.history[action.payload.link] = action.payload;
    },
    UpdateSearch: (state, action) => {
      //push data to search array on top
      state.Search = [action.payload, ...state.Search];
      // state.Search.push(action.payload);
    },
    StopLoading: state => {
      state.loading = false;
    },
    ClearError: state => {
      state.error = null;
    },
    clearData: state => {
      state.loading = false;
      state.error = null;
      dataByUrl = {};
    },
    DownTime: (state, action) => {
      state.loading = false;
      state.error = action.payload
        ? 'Oops!! Looks like the server is down right now,\nPlease try again later...'
        : null;
      state.downTime = action.payload;
    },
    SwtichBaseUrl: (state, action) => {
      state.baseUrl = action.payload;
      state.downTime = false;
    },
    SwtichToAnime: state => {
      state.Anime = !state.Anime;
      state.downTime = false;
    },
    AnimeWatched: (state, action) => {
      state.AnimeWatched[action?.payload?.AnimeName] = action?.payload;
    },
    AddAnimeBookMark: (state, action) => {
      state.AnimeBookMarks[action?.payload?.url] = action?.payload;
    },
    RemoveAnimeBookMark: (state, action) => {
      delete state.AnimeBookMarks[action?.payload?.url];
    },
  },
});

export const {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
  clearData,
  ClearError,
  StopLoading,
  pushHistory,
  updateData,
  UpdateSearch,
  DownTime,
  SwtichBaseUrl,
  SwtichToAnime,
  AnimeWatched,
  AddAnimeBookMark,
  RemoveAnimeBookMark,
  DownloadComicBook,
} = Reducers.actions;
export default Reducers.reducer;
