import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import {ComicHostName} from '../../../Utils/APIs';
import {HomePageCardClasses} from './constance';
import {serverFuncsList} from '../../../Utils/serverFuncsList';

export const getComics = async (
  hostName,
  page,
  type = null,
  hostKey = 'RcoRu',
) => {
  try {
    // Construct the URL and parameters based on the host, type, and page
    const params = page === 1 || page == null ? '' : `${type}?page=${page}`;
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
        let image = $(element).find(tagConfig.imageClass).attr('src');

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
    return null;
  }
};

export const getComicsHome = async (
  selectComicServer,
  setComics,
  setLoading,
) => {
  const DataFetchFromServer = serverFuncsList[selectComicServer];
  console.log(DataFetchFromServer.hostUrl);

  setLoading(true);
  try {
    const [Fist, Second, Third] = await Promise.all(
      DataFetchFromServer.HomePageCalls.map(type =>
        getComics(DataFetchFromServer.hostUrl, 1, type, selectComicServer),
      ),
    );

    console.log(Fist, Second, Third);
    const ComicHomeList = {};

    if (Fist) {
      ComicHomeList['hot-comic-updates'] = {
        title: 'Hot Comic',
        data: Fist?.comicsData,
        hostName: ComicHostName.RcoRu,
        lastPage: Fist?.lastPage,
      };
    }

    if (Second) {
      ComicHomeList['latest-release'] = {
        title: 'Latest Release',
        data: Second?.comicsData,
        hostName: ComicHostName.RcoRu,
        lastPage: Second?.lastPage,
      };
    }

    if (Third) {
      ComicHomeList['most-viewed'] = {
        title: 'Most Viewed',
        data: Third?.comicsData,
        hostName: ComicHostName.RcoRu,
        lastPage: Third?.lastPage,
      };
    }

    setComics(ComicHomeList);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching manga Home data:', error);
    setLoading(false);
  }
};
