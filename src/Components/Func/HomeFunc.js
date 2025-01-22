// import axios from 'axios';
import cheerio from 'cheerio';
import { checkDownTime } from '../../Redux/Actions/GlobalActions';
import { fetchDataStart } from '../../Redux/Reducers';
import { AnimeHostName, ComicHostName as HostName } from '../../Utils/APIs';
import APICaller from '../../Redux/Controller/Interceptor';

export const fetchComicsData = async (link, dispatch, baseUrl) => {
  console.log(baseUrl, 'baseUrl');
  if (!link) return;

  dispatch(fetchDataStart());
  try {
    // Fetch the HTML content from the website
    let url = `${HostName[baseUrl]}`;

    const response = await APICaller.get(`${url}${link}`);

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
  // console.log(baseUrl, link, 'baseUrl');
  if (!link) return;
  dispatch(fetchDataStart());
  try {
    let url = 'https://ajax.gogocdn.net/ajax/page-recent-release.html';
    const baseUrlLink = AnimeHostName[baseUrl];
    //check if link have ?type= or not
    if (!link.includes('type=')) {
      url = AnimeHostName[baseUrl];
    }
    console.log(`${url}${link}`, 'url');
    url = baseUrl == 'gogoanimes' ? `${url}${link}` : `${baseUrlLink}${link}`;
    // Fetch the HTML content from the website
    // console.log(url, 'url');
    const response = await APICaller.get(url);
    const html = response.data;
    // console.log(response, "html");

    // Load the HTML into Cheerio
    const $ = cheerio.load(html);

    // Array to hold the extracted data
    const AnimaData = [];
    let lastPage = null;
    // Extract data from the website

    if (baseUrl == 'gogoanimes') {
      console.log('gogoanimes');
      $('.last_episodes .items li').each((index, element) => {
        let title = $(element).find('.name a').attr('title');
        let link = $(element).find('.name a').attr('href');
        let imageUrl = $(element).find('.img a img').attr('src');
        let episode = $(element).find('.episode').text();
        let date = $(element).find('.released').text().trim() || null;
        //if image missing hostName then add base url
        if (!imageUrl.includes('https://'))
          imageUrl = `${baseUrlLink}${imageUrl.replace('/', '')}`;
        AnimaData.push({
          title,
          link: `${baseUrlLink}${link.replace('/', '')}`,
          imageUrl,
          episode,
          date,
        });
      });

      // console.log(AnimaData, 'AnimaData');
    } else {
      // console.log($(".meta").text(), 'html');
      $('.listing li.video-block').each((i, elem) => {
        const title = $(elem).find('.name').text().trim();
        const link = $(elem).find('a').attr('href');
        const imageUrl = $(elem).find('.picture img').attr('src');
        //extract episode from title
        const episodeMatch = title.match(/Episode (\d+)/);
        let episode = episodeMatch ? parseInt(episodeMatch[1], 10) : null;

        AnimaData.push({
          title,
          link: `${baseUrlLink}${link}`,
          imageUrl,
          episode: 'Episode ' + episode,
        });
      });
      // console.log(AnimaData, 'videos');
    }

    dispatch(checkDownTime(response));
    return AnimaData;
  } catch (error) {
    console.log('Error fetching or parsing data Anime Home page: ', error);
    if (dispatch) dispatch(checkDownTime(error));
    return [];
  }
};

export const checkServerDown = async (url, dispatch) => {
  dispatch(fetchDataStart());
  try {
    const response = await APICaller.get(url);
    //set DownTime to false
    console.log(response.status, 'response');
    dispatch(checkDownTime(response));
    return false;
  } catch (error) {
    //set DownTime to true
    console.log('Error checking server down:', error.message);
    dispatch(checkDownTime(error));
    return true;
  }
};


export const serverStatusUp = (serverStatus) => !(serverStatus && serverStatus >= 500)