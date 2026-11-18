import {createSelector} from '@reduxjs/toolkit';
import {isRetiredComicUrl} from '../../Utils/retiredComicSources';

export const selectComicHistory = createSelector(
  state => state.data.history,
  history => Object.values(history).filter(item => item?.link && !isRetiredComicUrl(item.link)),
);

export const selectComicBookmarks = createSelector(
  state => state.data.dataByUrl,
  dataByUrl => Object.entries(dataByUrl)
    .filter(([link, item]) => item?.Bookmark && !isRetiredComicUrl(link))
    .map(([link, item]) => ({...item, link})),
);
