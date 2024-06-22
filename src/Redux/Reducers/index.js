import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  dataByUrl: {},
  loading: false,
  error: null,
  history: {},
  Search: [],
  downTime: false,
  baseUrl: 'azcomic',
};

const Reducers = createSlice({
  name: 'data',
  initialState,
  reducers: {
    fetchDataStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess: (state, action) => {
      const {url, data} = action.payload;
      state.dataByUrl[url] = data;
      state.loading = false;
      state.downTime = false;
    },
    fetchDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateData: (state, action) => {
      const {url, data} = action.payload;
      //keep the old data and update the new data
      state.dataByUrl[url] = {...state.dataByUrl[url], ...data};
      // state.dataByUrl[url] = data;
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
} = Reducers.actions;
export default Reducers.reducer;
