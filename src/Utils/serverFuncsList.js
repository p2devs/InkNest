import {searchComic} from '../Redux/Actions/GlobalActions';
import {ComicHostName} from './APIs';
export const serverFuncsList = {
  RcoRu: {
    hostUrl: ComicHostName.RcoRu,
    HomePageCalls: ['hot-comic-updates', 'latest-release', 'most-viewed'],
    searchComic: (...arg) => searchComic(...arg),
  },
  RcoCom: {
    hostUrl: ComicHostName.RcoCom,
    HomePageCalls: ['hot-comic-updates', 'latest-release', 'most-viewed'],
  },
};
