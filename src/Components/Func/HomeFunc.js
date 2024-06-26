import axios from 'axios';
import cheerio from 'cheerio';
import { checkDownTime } from '../../Redux/Actions/GlobalActions';
import { fetchDataStart } from '../../Redux/Reducers';
import { HostName } from '../../Utils/APIs';

export const fetchComicsData = async (link, dispatch, baseUrl) => {
  console.log(baseUrl, 'baseUrl');
  if (!link) return;
  dispatch(fetchDataStart());
  try {
    // Fetch the HTML content from the website
    let url = `${HostName[baseUrl]}`;
    const response = await axios.get(`${url}${link}`);
    const html = response.data;
    // console.log(html, "html");

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Array to hold the extracted data
    const comicsData = [];
    let lastPage = null;
    // Extract data from the website
    if (baseUrl === 'azcomic') {
      $('.ig-grid .ig-box').each((index, element) => {
        const title = $(element).find('.igb-name').text().trim();
        const imageUrl = $(element).find('.igb-image img').attr('src');
        const link = $(element).find('.igb-image').attr('href');
        const genres = [];

        // Extract genres
        $(element)
          .find('.igb-genres a')
          .each((i, el) => {
            genres.push($(el).text().trim());
          });

        // Push the comic data to the array
        comicsData.push({
          title,
          imageUrl,
          link,
          genres,
          date: null,
        });
      });
    } else {
      // Select and iterate over each comic post
      $('#post-area .post').each((index, element) => {
        // Extract the title
        const title = $(element).find('h2 a').text();

        // Extract the date
        const date = $(element).find('span').first().text();

        // Extract the image URL
        const imageUrl = $(element).find('img').attr('src');

        //link to comic
        const link = $(element).find('h2 a').attr('href');

        // Push the extracted data into the array
        comicsData.push({ title, date, imageUrl, link });
      });
      let page = link.split('/');
      page = page[page.length - 2];
      if (page == 1) {
        lastPage = $('.pagenavi span.page-numbers.dots')
          .next()
          .text()
          .trim()
          .replaceAll(',', '');
      }
    }
    dispatch(checkDownTime(response));
    return { data: comicsData, lastPage };
  } catch (error) {
    // console.log(link, 'link');
    console.log('Error fetching or parsing data Home:', error);
    if (dispatch) dispatch(checkDownTime(error));
    return [];
  }
};


export const FetchAnimeData = async (link, dispatch, baseUrl) => {
  // console.log(baseUrl, 'baseUrl');
  if (!link) return;
  dispatch(fetchDataStart());
  try {
    let url = "https://ajax.gogocdn.net/ajax/page-recent-release.html?"
    // Fetch the HTML content from the website
    const response = await axios.get(`${url}${link}`);
    const html = response.data;
    // console.log(html, "html");

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Array to hold the extracted data
    const AnimaData = [];
    let lastPage = null;
    // Extract data from the website
    $('.last_episodes .items li').each((index, element) => {
      const title = $(element).find('.name a').attr('title');
      const link = $(element).find('.name a').attr('href');
      const imageUrl = $(element).find('.img a img').attr('src');
      const episode = $(element).find('.episode').text();
      AnimaData.push({
        title,
        link: `${HostName["gogoanimes"]}${link.replace("/", "")}`,
        imageUrl,
        episode
      });
    });

    dispatch(checkDownTime(response));
    return AnimaData;
  } catch (error) {
    console.log('Error fetching or parsing data Home:', error);
    if (dispatch) dispatch(checkDownTime(error));
    return [];
  }
}