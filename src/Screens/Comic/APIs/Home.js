import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import {ComicHostName} from '../../../Utils/APIs';
import {HomePageCardClasses} from './constance';
import {
  buildComicsRequestParams,
  extractLastPage,
  parseHomePageCards,
} from './homeParser';
import {checkDownTime} from '../../../Redux/Actions/GlobalActions';
import {
  recordSourceError,
  recordSourceSuccess,
  getStatusFromCode,
  SOURCE_STATUS,
  getSourceLabel,
} from '../../../Utils/sourceStatus';

export const getComics = async (hostName, page, type = null, dispatch = null) => {
  try {
    const hostKey = Object.keys(ComicHostName).find(
      key => ComicHostName[key] === hostName,
    );

    const params = buildComicsRequestParams(hostName, page, type);
    const requestUrl = `${hostName}${params}`;

    const response = await APICaller.get(requestUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    let comicsData = [];
    let lastPage = null;

    const tagConfig = HomePageCardClasses[hostKey]?.[type ?? 'all-comic'];

    if (tagConfig) {
      comicsData = parseHomePageCards($, tagConfig, {hostName, type});

      if ((tagConfig.lastPageClass || tagConfig.paginationLinkClass) && page === 1) {
        lastPage = extractLastPage($, tagConfig);
      }
    }

    // Record successful request
    if (hostKey) {
      recordSourceSuccess(hostKey);
    }

    return {comicsData, lastPage};
  } catch (error) {
    console.error('Error fetching comics data:', error);
    console.log('Request URL:', hostName, page, type);

    // Track source-specific errors
    const hostKey = Object.keys(ComicHostName).find(
      key => ComicHostName[key] === hostName,
    );
    const statusCode = error?.response?.status;

    if (hostKey && statusCode) {
      recordSourceError(hostKey, statusCode);

      // Dispatch notification for 403 or 500+ errors
      const sourceStatus = getStatusFromCode(statusCode);
      if ((sourceStatus === SOURCE_STATUS.CLOUDFLARE_PROTECTED || 
           sourceStatus === SOURCE_STATUS.SERVER_DOWN) && dispatch) {
        const {setSourceStatusNotification} = require('../../../Redux/Reducers');
        dispatch(setSourceStatusNotification({
          sourceKey: hostKey,
          status: sourceStatus,
          statusCode,
          sourceName: getSourceLabel(hostKey),
        }));
      }
    }

    // Also dispatch checkDownTime for general error handling
    if (dispatch) {
      dispatch(checkDownTime(error, hostKey));
    }

    return null;
  }
};

const getHomeRequests = (type, dispatch) => ({
  readcomicsonline: {
    hot_comic_updates: getComics(
      ComicHostName.readcomicsonline,
      1,
      'hot-comic-updates',
      dispatch,
    ),
    latest_release: getComics(
      ComicHostName.readcomicsonline,
      1,
      'latest-release',
      dispatch,
    ),
    most_viewed: getComics(ComicHostName.readcomicsonline, 1, 'most-viewed', dispatch),
  },
  comichubfree: {
    hot_comic_updates: getComics(ComicHostName.comichubfree, 1, 'hot-comic', dispatch),
    latest_release: getComics(ComicHostName.comichubfree, 1, 'new-comic', dispatch),
    most_viewed: getComics(ComicHostName.comichubfree, 1, 'popular-comic', dispatch),
    all_comic: getComics(ComicHostName.comichubfree, 1, null, dispatch),
  },
  readallcomics: {
    all_comic: getComics(ComicHostName.readallcomics, 1, null, dispatch),
  },
  comicbookplus: {
    latest_release: getComics(
      ComicHostName.comicbookplus,
      0,
      'latest-uploads',
      dispatch,
    ),
  },
});

export const getComicsHome = async (
  type = 'comichubfree',
  setComics,
  setLoading,
  dispatch = null,
) => {
  setLoading(true);
  try {
    const requests = getHomeRequests(type, dispatch)[type] || {};
    const entries = await Promise.all(
      Object.entries(requests).map(async ([key, promise]) => [key, await promise]),
    );
    const {
      hot_comic_updates,
      latest_release,
      most_viewed,
      all_comic,
    } = Object.fromEntries(entries);

    const ComicHomeList = {};

    if (all_comic) {
      ComicHomeList['all-comic'] = {
        title: 'Latest Comic',
        data: all_comic?.comicsData,
        hostName: ComicHostName[type],
        lastPage: all_comic?.lastPage,
      };
    }

    if (latest_release) {
      ComicHomeList['latest-release'] = {
        title: type === 'comichubfree' ? 'New Comic' : 'Latest Release',
        data: latest_release?.comicsData,
        hostName: ComicHostName[type],
        lastPage: latest_release?.lastPage,
      };
    }

    if (hot_comic_updates) {
      ComicHomeList['hot-comic-updates'] = {
        title: 'Hot Comic',
        data: hot_comic_updates?.comicsData,
        hostName: ComicHostName[type],
        lastPage: hot_comic_updates?.lastPage,
      };
    }

    if (most_viewed) {
      ComicHomeList['most-viewed'] = {
        title: 'Most Viewed',
        data: most_viewed?.comicsData,
        hostName: ComicHostName[type],
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
