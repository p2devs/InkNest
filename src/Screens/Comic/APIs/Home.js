import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import {ComicHostName} from '../../../Utils/APIs';
import {HomePageCardClasses} from './constance';
import {parseHomePageCards} from './homeParser';
import {checkDownTime} from '../../../Redux/Actions/GlobalActions';
import {recordSourceError, recordSourceSuccess} from '../../../Utils/sourceStatus';

export const getComics = async (page = 0, dispatch) => {
  const host = ComicHostName.comicbookplus;
  try {
    const response = await APICaller.get(`${host}?cbplus=latestuploads_l_s_${page}`);
    const comicsData = parseHomePageCards(
      cheerio.load(response.data),
      HomePageCardClasses.comicbookplus['latest-uploads'],
    );
    recordSourceSuccess('comicbookplus');
    return {comicsData, lastPage: null};
  } catch (error) {
    if (dispatch) {
      dispatch(checkDownTime(error, 'comicbookplus'));
    } else if (error?.response?.status) {
      recordSourceError('comicbookplus', error.response.status);
    }
    return null;
  }
};

export const getComicsHome = async (setComics, setLoading, dispatch) => {
  setLoading(true);
  try {
    const result = await getComics(0, dispatch);
    if (!result?.comicsData.length) {
      setComics({});
      return;
    }
    setComics({
      'latest-release': {
        title: 'Latest on Comic Book Plus',
        data: result.comicsData,
        hostName: ComicHostName.comicbookplus,
        lastPage: result.lastPage,
      },
    });
  } finally {
    setLoading(false);
  }
};
