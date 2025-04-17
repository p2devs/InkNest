import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import {ComicHostName} from '../../../Utils/APIs';
import {HomePageCardClasses} from './constance';

export const getComics = async (hostName, page, type = null) => {
  try {
    const hostKey = Object.keys(ComicHostName).find(
      key => ComicHostName[key] === hostName,
    );

    // Construct the URL and parameters based on the host, type, and page
    let params = `${type}?page=${page}`;
    if (
      (page === 1 || page == null) &&
      hostName === ComicHostName.readcomicsonline
    )
      params = '';

    const requestUrl = `${hostName}${params}`;

    const response = await APICaller.get(requestUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    let comicsData = [];
    let lastPage = null;

    const tagConfig = HomePageCardClasses[hostKey]?.[type ?? 'all-comic'];

    if (tagConfig) {
      $(tagConfig.cardClass).each((index, element) => {
        const title =
          type === 'hot-comic-updates'
            ? $(tagConfig.cardTitleClass).eq(index).text().trim()
            : $(element).find(tagConfig.cardTitleClass).text().trim();
        let link = $(element).find(tagConfig.cardLinkClass).attr('href');
        if (link) {
          link = link.replace(/\/\d+$/, '');
        }
        let image = $(element)
          .find(tagConfig.imageClass)
          .attr(tagConfig.imageAttr ?? 'src');

        // For latest-release or most-viewed type, ensure the image URL has https: prefix.
        if (
          (type === 'latest-release' || type === 'most-viewed') &&
          image &&
          image.startsWith('//')
        ) {
          image = 'https:' + image;
        }

        const genres = [];
        if (tagConfig.genresClass) {
          $(element)
            .find(tagConfig.genresClass)
            .each((i, genreElem) => {
              genres.push($(genreElem).text().trim());
            });
        }

        const status = tagConfig.statusClass
          ? $(element).find(tagConfig.statusClass).text().trim()
          : null;

        // Updated publishDate extraction:
        let publishDate = null;
        if (tagConfig.dateClass) {
          let dateText = $(element).find(tagConfig.dateClass).text().trim();
          // For latest-release, split by newline and take the first part
          if (type === 'latest-release') {
            publishDate = dateText.split('\n')[0].trim();
          } else {
            publishDate = dateText;
          }
        }

        comicsData.push({
          title,
          link,
          image,
          genres: genres.length > 0 ? genres[0] : null,
          status,
          publishDate,
        });
      });

      if (tagConfig.lastPageClass && page === 1) {
        lastPage = $(tagConfig.lastPageClass)
          .next()
          .text()
          .trim()
          .replaceAll(',', '');
      }
    }

    return {comicsData, lastPage};
  } catch (error) {
    console.error('Error fetching comics data:', error);
    console.log('Request URL:', hostName, page, type);

    return null;
  }
};

const HomeType = {
  readcomicsonline: [
    getComics(ComicHostName.readcomicsonline, 1, 'hot-comic-updates'),
    getComics(ComicHostName.readcomicsonline, 1, 'latest-release'),
    getComics(ComicHostName.readcomicsonline, 1, 'most-viewed'),
  ],
  comichubfree: [
    getComics(ComicHostName.comichubfree, 1, 'hot-comic'),
    getComics(ComicHostName.comichubfree, 1, 'new-comic'),
    getComics(ComicHostName.comichubfree, 1, 'popular-comic'),
  ],
};

export const getComicsHome = async (
  type = 'readcomicsonline',
  setComics,
  setLoading,
) => {
  setLoading(true);
  try {
    const [hot_comic_updates, latest_release, most_viewed] = await Promise.all(
      HomeType[type],
    );

    const ComicHomeList = {};

    if (hot_comic_updates) {
      ComicHomeList['hot-comic-updates'] = {
        title: 'Hot Comic',
        data: hot_comic_updates?.comicsData,
        hostName: ComicHostName.readcomicsonline,
        lastPage: hot_comic_updates?.lastPage,
      };
    }

    if (latest_release) {
      ComicHomeList['latest-release'] = {
        title: 'Latest Release',
        data: latest_release?.comicsData,
        hostName: ComicHostName.readcomicsonline,
        lastPage: latest_release?.lastPage,
      };
    }

    if (most_viewed) {
      ComicHomeList['most-viewed'] = {
        title: 'Most Viewed',
        data: most_viewed?.comicsData,
        hostName: ComicHostName.readcomicsonline,
        lastPage: most_viewed?.lastPage,
      };
    }

    setComics(ComicHomeList);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching manga Home data:', error);
    setLoading(false);
  }
};
