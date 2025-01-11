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
import { Alert } from 'react-native';
import { goBack } from '../../Navigation/NavigationService';
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
        let Data = getState().data.dataByUrl[link];

        let watchedData = {
          title: Data?.title,
          link,
          image: Data?.imgSrc,
          publisher: Data?.publisher,
          genres: Data?.genres,
          lastOpenAt: new Date().getTime(),
        };
        //if link contant readallcomics.com then set baseUrl to readallcomics
        let checkUrl = link.includes('readallcomics.com')
          ? 'readallcomics'
          : 'azcomic';
        if (!refresh && Data) {
          dispatch(StopLoading());
          dispatch(ClearError());
          dispatch(checkDownTime());
          dispatch(WatchedData(watchedData));
          return;
        }
        // console.log(link, "link");
        const response = await APICaller.get(link);
        const html = response.data;
        // console.log(html, "html");
        const $ = cheerio.load(html);
        let comicDetails = {};
        if (checkUrl == 'azcomic') {
          // Extract comic details
          const title = $('.anime-details .title').text().trim();
          const imgSrc = $('.anime-details .anime-image img').attr('src');
          const status = $('.anime-genres .status a').text().trim();
          const genres = [];
          $('.anime-genres li a').each((i, el) => {
            const genre = $(el).text().trim();
            if (genre !== 'Ongoing') {
              genres.push(genre);
            }
          });
          const yearOfRelease = $('.anime-desc span:contains("Year of Release:")')
            .closest('tr')
            .find('td')
            .eq(1)
            .text()
            .trim();
          const publisher =
            $('.anime-desc span:contains("Author:")')
              .closest('tr')
              .find('td')
              .eq(1)
              .text()
              .trim() || '';

          const issues = [];
          $('.basic-list li').each((i, el) => {
            const title = $(el).find('a.ch-name').text().trim();
            const link = $(el).find('a.ch-name').attr('href');
            const date = $(el).find('span').text().trim();
            issues.push({
              title,
              link,
              date,
            });
          });
          // Create a comic detail object
          comicDetails = {
            title,
            imgSrc,
            status,
            genres,
            yearOfRelease,
            publisher,
            issues,
          };
        } else {
          const descriptionArchive = $('.description-archive');
          // console.log(descriptionArchive, "descriptionArchive");

          const title = descriptionArchive.find('h1').text().trim();
          const imgSrc = descriptionArchive.find('img').attr('src');
          const genres = descriptionArchive.find('p strong').eq(0).text().trim();
          const publisher = descriptionArchive
            .find('p strong')
            .eq(1)
            .text()
            .trim();

          const volumes = [];
          // console.log(descriptionArchive.find('hr.style-six'));
          descriptionArchive.find('hr.style-six').each((i, el) => {
            // console.log($(el).nextAll("strong").text(),i);
            const volume = $(el).next('span').text().trim();
            const description = $(el).nextAll('strong').text();
            volumes.push({ volume, description });
          });

          const chapters = [];
          $('.list-story li a').each((i, el) => {
            chapters.push({
              title: $(el).attr('title'),
              link: $(el).attr('href'),
            });
          });
          // console.log({ title, imgSrc, genres, publisher, volumes, chapters }, 'Data');

          comicDetails = {
            title,
            imgSrc,
            genres,
            publisher,
            volumes,
            chapters,
          };
        }

        // console.log({ data }, "Data");
        watchedData = {
          title: comicDetails.title,
          link,
          image: comicDetails.imgSrc,
          publisher: comicDetails.publisher,
          genres: comicDetails.genres,
          lastOpenAt: new Date().getTime(),
        };
        if (refresh) {
          dispatch(updateData({ url: link, data: comicDetails }));
          dispatch(StopLoading());
          return;
        }
        dispatch(WatchedData(watchedData));
        dispatch(fetchDataSuccess({ url: link, data: comicDetails }));
      } catch (error) {
        console.error('Error fetching comic details:', error.response.status);
        checkDownTime(error);
        dispatch(StopLoading());
        dispatch(ClearError());
        dispatch(fetchDataFailure('Not Found'));
        console.error('Error second fetching comic details:', error);
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
        // let baseUrl = getState().data.baseUrl;
        let Data = getState().data.dataByUrl[comicBook];

        //check if comicBook url contant readallcomics.com
        const checkUrl = comicBook.includes('readallcomics.com')
          ? 'readallcomics'
          : 'azcomic';

        Hiturl = checkUrl == 'azcomic' ? `${comicBook}/full` : comicBook;
        // console.log(comicBook, "Data Comic Book");
        if (Data) {
          if (setPageLink) {
            setPageLink(Data.ComicDetailslink);
          }
          dispatch(StopLoading());
          dispatch(ClearError());
          dispatch(checkDownTime());
          return;
        }
        const response = await APICaller.get(Hiturl);
        const html = response.data;
        const $ = cheerio.load(html);
        const targetDiv = $(
          'div[style="margin:0px auto; max-width: 1000px; background:#fff; padding:20px 0px 10px 0px; border-radius: 15px;font-size: 22px; padding-top: 10px;"]',
        );
        let title = '';
        const imgElements = targetDiv.find('img');
        const imgSources = [];
        const volumes = [];
        if (checkUrl == 'azcomic') {
          title = title = $('.title h1').text().trim();
          $('.chapter-container img').each((index, element) => {
            const imageUrl = $(element).attr('src');
            // console.log(imageUrl, "imageUrl");
            imgSources.push(imageUrl);
          });
          $('select.full-select option').each((index, element) => {
            const title = $(element).text().trim();
            const link = $(element).attr('value').replace('/full', '');
            // console.log('title', title, 'link', link);
            volumes.push({ title, link });
          });
        } else {
          title = targetDiv
            .find('h3[style="color: #0363df;font-size: 20px; padding-top:5px;"]')
            .text()
            .trim();
          imgElements.each((index, element) => {
            imgSources.push($(element).attr('src'));
          });
          $('select option').each((index, element) => {
            const title = $(element).text();
            const link = $(element).attr('value');
            volumes.push({ title, link });
          });
        }

        let link = $('a[rel="category tag"]').attr('href');
        if (!link) {
          link = $('.title a').attr('href');
        }

        //remove duplicates in volumes
        let unique = [
          ...new Map(volumes.map(item => [item['title'], item])).values(),
        ];
        const data = {
          images: imgSources,
          title,
          volumes: unique,
          lastReadPage: 0,
          BookmarkPages: [],
          ComicDetailslink: link,
        };
        // console.log(data, "final data");
        // console.log({ data }, "Data");
        if (setPageLink) {
          //get the title link
          console.log(link, 'link');
          data.ComicDetailslink = link;
          setPageLink(link);
        }
        dispatch(fetchDataSuccess({ url: comicBook, data }));
        if (isDownloadComic) return { url: comicBook, data };
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
export const fetchSearchComic = search => async (dispatch, getState) => {
  dispatch(fetchDataStart());
  try {
    dispatch(UpdateSearch({ user: 'user', query: search }));
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
      results.push({ title, href });
    });
    dispatch(StopLoading());
    if (results.length === 0) {
      dispatch(UpdateSearch({ user: 'error', error: 'No results found' }));
      return;
    }
    dispatch(UpdateSearch({ user: 'system', results }));
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
  ({ data }) =>
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
  dispatch(fetchDataSuccess({ url, data: null }));
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
