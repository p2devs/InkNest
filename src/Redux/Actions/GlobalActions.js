import axios from 'axios';
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
} from '../Reducers';
import { Alert } from 'react-native';
import { goBack } from '../../Navigation/NavigationService';

//History Watched Comic
export const WatchedData = data => async (dispatch, getState) => {
  dispatch(pushHistory(data));
};

//down time check and update
export const checkDownTime = (error) => async dispatch => {
  //if error is 500+ then set down time
  dispatch(StopLoading());
  if (!error) return dispatch(DownTime(false));
  if (error?.response?.status >= 500) {
    dispatch(DownTime(true));
    dispatch(fetchDataFailure("Oops!! Looks like the server is down right now,\nPlease try again later..."));
    return;
  }
  if (error?.response?.status === 404) {
    if (error.response.AnimeVideo) {
      dispatch(fetchDataFailure("Oops!! Looks like the anime episode is not available right now,\nPlease try again later..."));
      return;
    }
    dispatch(fetchDataFailure("Oops!! Looks like the comic is not available right now,\nPlease try again later..."));
    return;
  }
  if (error.response?.status === 403) {
    dispatch(fetchDataFailure("Oops!! something went wrong, please try again..."));
    return;
  }
  //network error
  if (error.message === "Network Error") {
    dispatch(fetchDataFailure("Oops!! Looks like the network is down right now,\nPlease try again later..."));
    return;
  }
}

//Comic Details
export const fetchComicDetails = (link, refresh = false) => async (dispatch, getState) => {
  dispatch(fetchDataStart());
  try {
    let Data = getState().data.dataByUrl[link];
    //if link contant readallcomics.com then set baseUrl to readallcomics
    let checkUrl = link.includes('readallcomics.com') ? 'readallcomics' : 'azcomic';
    if (!refresh && Data) {
      dispatch(StopLoading());
      dispatch(ClearError());
      dispatch(checkDownTime());
      return;
    }
    // console.log(link, "link");
    const response = await axios.get(link);
    const html = response.data;
    // console.log(html, "html");
    const $ = cheerio.load(html);
    let comicDetails = {}
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
      const yearOfRelease = $('.anime-desc span:contains("Year of Release:")').closest('tr').find('td').eq(1).text().trim();
      const publisher = $('.anime-desc span:contains("Author:")').closest('tr').find('td').eq(1).text().trim() || '';

      const issues = [];
      $('.basic-list li').each((i, el) => {
        const title = $(el).find('a.ch-name').text().trim();
        const link = $(el).find('a.ch-name').attr('href');
        const date = $(el).find('span').text().trim();
        issues.push({
          title,
          link,
          date
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
      const publisher = descriptionArchive.find('p strong').eq(1).text().trim();

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
    let watchedData = {
      title: comicDetails.title,
      link,
      imageUrl: comicDetails.imgSrc,
      publisher: comicDetails.publisher,
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

//Comic Book
export const fetchComicBook =
  (comicBook, setPageLink = null) =>
    async (dispatch, getState) => {
      dispatch(fetchDataStart());
      try {

        // let baseUrl = getState().data.baseUrl;
        let Data = getState().data.dataByUrl[comicBook];

        //check if comicBook url contant readallcomics.com
        const checkUrl = comicBook.includes('readallcomics.com') ? 'readallcomics' : 'azcomic';

        Hiturl = checkUrl == "azcomic" ? `${comicBook}/full` : comicBook;
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
        const response = await axios.get(Hiturl);
        const html = response.data;
        const $ = cheerio.load(html);
        const targetDiv = $('div[style="margin:0px auto; max-width: 1000px; background:#fff; padding:20px 0px 10px 0px; border-radius: 15px;font-size: 22px; padding-top: 10px;"]')
        let title = ""
        const imgElements = targetDiv.find('img');
        const imgSources = [];
        const volumes = [];
        if (checkUrl == "azcomic") {
          title = title = $('.title h1').text().trim();
          $('.chapter-container img').each((index, element) => {
            const imageUrl = $(element).attr('src');
            // console.log(imageUrl, "imageUrl");
            imgSources.push(imageUrl);
          });
          $('select.full-select option').each((index, element) => {
            const title = $(element).text().trim();
            const link = $(element).attr('value').replace("/full", "");
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
            const link = $(element).attr('value')
            volumes.push({ title, link });
          });
        }


        // console.log({ imgSources, title, volumes }, "Data Comic Book");
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
        };
        // console.log(data, "final data");
        // console.log({ data }, "Data");
        if (setPageLink) {
          //get the title link
          const link = $('a[rel="category tag"]').attr('href');
          console.log(link, 'link');
          data.ComicDetailslink = link;
          setPageLink(link);
        }
        dispatch(fetchDataSuccess({ url: comicBook, data }));
      } catch (error) {
        dispatch(fetchDataFailure(error.message));
        checkDownTime(error);
      }
    };

//search comic
export const fetchSearchComic = search => async (dispatch, getState) => {
  dispatch(fetchDataStart());
  try {
    dispatch(UpdateSearch({ user: "user", query: search }));
    const response = await axios.get(
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
    dispatch(UpdateSearch({ user: 'error', error: 'Oops!! something went wrong, please try again...' }));
  }
}

//clear error and loading
export const clearError = () => async dispatch => {
  dispatch(fetchDataStart());
  dispatch(fetchDataFailure(null));
};

//Clear Data and stop loading and clear error
export const clearDataByUrl = url => async dispatch => {
  dispatch(fetchDataStart());
  dispatch(fetchDataFailure(null));
  dispatch(fetchDataSuccess({ url, data: null }));
};

//cleat all data
export const clearAllData = () => async dispatch => {
  dispatch(clearData());
};
