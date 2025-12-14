import {createSlice} from '@reduxjs/toolkit';

const SUBSCRIPTION_CACHE_TTL_MS = 1000;

const resolveCacheTtlMs = (incomingTtl, previousTtl = SUBSCRIPTION_CACHE_TTL_MS) => {
  if (
    typeof incomingTtl === 'number' &&
    Number.isFinite(incomingTtl) &&
    incomingTtl > 0
  ) {
    return incomingTtl;
  }

  if (
    typeof previousTtl === 'number' &&
    Number.isFinite(previousTtl) &&
    previousTtl > 0
  ) {
    return previousTtl;
  }

  return SUBSCRIPTION_CACHE_TTL_MS;
};
const initialState = {
  dataByUrl: {},
  loading: false,
  error: null,
  history: {},
  Search: [],
  downTime: false,
  baseUrl: 'azcomic',
  Anime: false,
  AnimeWatched: {},
  AnimeBookMarks: {},
  DownloadComic: {},
  scrollPreference: 'horizontal', // Default scroll mode is horizontal
  hasRewardAdsShown: false,
  // Community & Auth state
  user: null, // {uid, displayName, photoURL, email, subscriptionTier}
  communityPosts: {}, // {comicLink: {posts: [], lastFetch: timestamp}}
  communityPostIndex: {}, // {postId: { ...post, comicLink }} for cross-screen hydration
  communityComics: {}, // {comicLink: {title, coverImage, detailsPath, lastActivityAt}}
  userActivity: {}, // {postsToday: 0, repliesToday: 0, lastReset: date}
  notifications: [], // [{id,title,body,data,receivedAt,read}]
  notificationSubscriptions: {}, // { [uid]: { lastFetched, allowed, subscribedList: [] } }
};

/**
 * Redux slice for managing application state, including data fetching, updating, search history,
 * loading states, and other application-specific flags.
 *
 * @constant {Slice} Reducers
 * @property {string} name - The name of the slice.
 * @property {Object} initialState - The initial state of the slice.
 *
 * @typedef {Object} InitialState
 * @property {boolean} loading - Loading state indicator
 * @property {Object|null} error - Error state
 * @property {Object} dataByUrl - Data stored by URL
 * @property {Object} history - Navigation history
 * @property {Array} Search - Search history
 * @property {boolean} downTime - Server downtime indicator
 * @property {string} baseUrl - Base URL for API calls
 * @property {boolean} Anime - Anime mode toggle
 * @property {Object} AnimeWatched - Watched anime tracking
 * @property {Object} AnimeBookMarks - Anime bookmarks storage
 * @property {string} scrollPreference - User's preferred comic reading scroll mode
 *
 * @property {Object} reducers - An object containing the reducer functions.
 * @property {function} reducers.fetchDataStart - Initiates data fetching by setting loading to true and clearing errors.
 * @property {function} reducers.fetchDataSuccess - Handles successful data fetch, updates state with new data.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action.
 *     @property {string} action.payload.url - The URL associated with the fetched data.
 *     @property {any} action.payload.data - The data fetched from the URL.
 * @property {function} reducers.fetchDataFailure - Handles failed data fetching by setting loading to false and recording the error.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the error.
 * @property {function} reducers.updateData - Updates existing data in the state with new data.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action.
 *     @property {string} action.payload.url - The URL of the data to update.
 *     @property {any} action.payload.data - The new data to merge with existing data.
 * @property {function} reducers.pushHistory - Adds a new entry to the history.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the history item.
 * @property {function} reducers.UpdateSearch - Adds a new item to the search history.
 *   @param {Object} state - The current state.
 *   @param {any} action.payload - The search item to add.
 * @property {function} reducers.StopLoading - Stops the loading state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.ClearError - Clears any error messages in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.clearData - Resets the data in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.DownTime - Handles server downtime by updating the state.
 *   @param {Object} state - The current state.
 *   @param {Object} action - The dispatched action containing the downtime flag.
 * @property {function} reducers.SwtichBaseUrl - Switches the base URL used in the application.
 *   @param {Object} state - The current state.
 *   @param {string} action.payload - The new base URL.
 * @property {function} reducers.SwtichToAnime - Toggles the Anime flag in the state.
 *   @param {Object} state - The current state.
 * @property {function} reducers.AnimeWatched - Updates the list of watched anime.
 *   @param {Object} state - The current state.
 *   @param {Object} action.payload - The anime watched information.
 * @property {function} reducers.AddAnimeBookMark - Adds an anime to the bookmarks.
 *   @param {Object} state - The current state.
 *   @param {Object} action.payload - The anime bookmark information.
 * @property {function} reducers.RemoveAnimeBookMark - Removes an anime from the bookmarks.
 *   @param {Object} state - The current state.
 */

const Reducers = createSlice({
  name: 'data',
  initialState,
  reducers: {
    fetchDataStart: state => {
      state.loading = true;
      state.error = null;
    },
    fetchDataSuccess: (state, action) => {
      const {url, data} = action.payload;
      state.dataByUrl[url] = data;
      state.loading = false;
      state.downTime = false;
    },
    fetchDataFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateData: (state, action) => {
      const {url, data, ComicDetailslink, imageLength, readAt} =
        action.payload;
      //keep the old data and update the new data
      state.dataByUrl[url] = {...state.dataByUrl[url], ...data};

      const hasReadingProgress =
        ComicDetailslink && imageLength && data?.lastReadPage !== undefined;

      if (hasReadingProgress) {
        const detailLinkKey = ComicDetailslink.split('?')[0];
        const chapterLinkKey = url?.split('?')[0];
        if (!chapterLinkKey) return;

        const existingEntry =
          state?.history?.[detailLinkKey]?.readComics?.[chapterLinkKey];

        state.history[detailLinkKey] = {
          ...state?.history?.[detailLinkKey],
          readComics: {
            ...state?.history?.[detailLinkKey]?.readComics,
            [chapterLinkKey]: {
              totalPage: imageLength,
              lastReadPage: data.lastReadPage,
              readAt: readAt ?? existingEntry?.readAt ?? 0,
            },
          },
        };
      }

      // state.dataByUrl[url] = data;
    },
    DownloadComicBook: (state, action) => {
      const {link, data, title} = action.payload;

      state.DownloadComic[link] = {
        title,
        link,
        comicBooks: {
          ...state.DownloadComic[link]?.comicBooks,
          [data?.link]: {
            ...state.DownloadComic[link]?.comicBooks?.[data?.link],
            ...data,
            comicBook: state.DownloadComic[link]?.comicBooks?.[data?.link]?.comicBook
              ? {
                  ...state.DownloadComic[link]?.comicBooks?.[data?.link]?.comicBook,
                  ...data?.comicBook,
                  ...(data?.lastReadPage !== undefined
                    ? {lastReadPage: data.lastReadPage}
                    : {}),
                }
              : data?.comicBook,
          },
        },
      };
    },
    updateDownloadedComicBook: (state, action) => {
      const {comicDetailsLink, chapterLink, data} = action.payload;

      if (
        !comicDetailsLink ||
        !chapterLink ||
        !state.DownloadComic[comicDetailsLink]?.comicBooks?.[chapterLink]
      ) {
        return;
      }

      const existingEntry =
        state.DownloadComic[comicDetailsLink].comicBooks[chapterLink];

      state.DownloadComic[comicDetailsLink].comicBooks[chapterLink] = {
        ...existingEntry,
        ...data,
        comicBook: existingEntry?.comicBook
          ? {
              ...existingEntry.comicBook,
              ...(data?.comicBook ?? {}),
              ...(data?.lastReadPage !== undefined
                ? {lastReadPage: data.lastReadPage}
                : {}),
            }
          : existingEntry?.comicBook,
      };
    },
    DeleteDownloadedComicBook: (state, action) => {
      const {comicBooksLink, ChapterLink} = action.payload;
      delete state.DownloadComic[comicBooksLink]?.comicBooks[ChapterLink];
      if (
        Object.keys(state.DownloadComic[comicBooksLink]?.comicBooks).length ===
        0
      ) {
        delete state.DownloadComic[comicBooksLink];
      }
    },
    pushHistory: (state, action) => {
      // state.history.push(action.payload);
      //trim the query from the url
      const link = action.payload.link.split('?')[0];

      state.history[link] = {
        ...state.history[link],
        ...action.payload,
      };
    },
    UpdateSearch: (state, action) => {
      //push data to search array on top
      state.Search = [action.payload, ...state.Search];
      // state.Search.push(action.payload);
    },
    StopLoading: state => {
      state.loading = false;
    },
    ClearError: state => {
      state.error = null;
    },
    clearData: state => {
      state.loading = false;
      state.error = null;
      state.dataByUrl = {};
    },
    clearHistory: state => {
      state.history = {};
    },
    DownTime: (state, action) => {
      state.loading = false;
      state.error = action.payload
        ? 'Oops!! Looks like the server is down right now,\nPlease try again later...'
        : null;
      state.downTime = action.payload;
    },
    SwtichBaseUrl: (state, action) => {
      state.baseUrl = action.payload;
      state.downTime = false;
    },
    SwtichToAnime: state => {
      state.Anime = !state.Anime;
      state.downTime = false;
    },
    AnimeWatched: (state, action) => {
      state.AnimeWatched[action?.payload?.AnimeName] = action?.payload;
    },
    AddAnimeBookMark: (state, action) => {
      state.AnimeBookMarks[action?.payload?.url] = action?.payload;
    },
    RemoveAnimeBookMark: (state, action) => {
      delete state.AnimeBookMarks[action?.payload?.url];
    },
    setScrollPreference: (state, action) => {
      // Update user's preferred comic reading scroll mode
      state.scrollPreference = action.payload;
    },
    rewardAdsShown: (state, action) => {
      // Update the flag indicating whether reward ads have been shown
      state.hasRewardAdsShown = action.payload;
    },
    // Community & Auth reducers
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: state => {
      state.user = null;
      state.userActivity = {postsToday: 0, repliesToday: 0, lastReset: new Date().toDateString()};
    },
    setCommunityPosts: (state, action) => {
      const {comicLink, posts = [], append = false, comicMeta = null} = action.payload;
      const existing = state.communityPosts[comicLink]?.posts || [];

      let nextPosts;
      if (append) {
        const existingIds = new Set(existing.map(post => post.id));
        const dedupedNewPosts = posts.filter(post => !existingIds.has(post.id));
        nextPosts = [...existing, ...dedupedNewPosts];
      } else {
        nextPosts = posts;
      }

      state.communityPosts[comicLink] = {
        ...(state.communityPosts[comicLink] || {}),
        posts: nextPosts,
        lastFetch: Date.now(),
      };

      nextPosts.forEach(post => {
        if (!post?.id) {
          return;
        }
        const existingEntry = state.communityPostIndex[post.id] || {};
        state.communityPostIndex[post.id] = {
          ...existingEntry,
          ...post,
          id: post.id,
          comicLink,
        };
      });

      if (comicMeta?.comicLink) {
        const existingMeta = state.communityPosts[comicLink].comicMeta || {};
        state.communityPosts[comicLink].comicMeta = {
          ...existingMeta,
          ...comicMeta,
        };
        state.communityComics[comicMeta.comicLink] = {
          ...(state.communityComics[comicMeta.comicLink] || {}),
          ...comicMeta,
          lastSeenAt: Date.now(),
        };
      }
    },
    addCommunityPost: (state, action) => {
      const {comicLink, post, comicMeta} = action.payload;
      if (!state.communityPosts[comicLink]) {
        state.communityPosts[comicLink] = {posts: [], lastFetch: Date.now()};
      }
      state.communityPosts[comicLink].posts.unshift(post);

      if (post?.id) {
        const existingEntry = state.communityPostIndex[post.id] || {};
        state.communityPostIndex[post.id] = {
          ...existingEntry,
          ...post,
          id: post.id,
          comicLink,
        };
      }
      if (comicMeta?.comicLink) {
        state.communityComics[comicMeta.comicLink] = {
          ...(state.communityComics[comicMeta.comicLink] || {}),
          ...comicMeta,
          lastSeenAt: Date.now(),
        };
      }
    },
    updateCommunityPost: (state, action) => {
      const {comicLink, postId, updates} = action.payload;
      if (state.communityPosts[comicLink]) {
        const postIndex = state.communityPosts[comicLink].posts.findIndex(
          p => p.id === postId,
        );
        if (postIndex !== -1) {
          state.communityPosts[comicLink].posts[postIndex] = {
            ...state.communityPosts[comicLink].posts[postIndex],
            ...updates,
          };
        }
      }

      if (postId) {
        const existingEntry = state.communityPostIndex[postId] || {};
        state.communityPostIndex[postId] = {
          ...existingEntry,
          ...updates,
          id: postId,
          comicLink: existingEntry.comicLink || comicLink,
        };
      }
    },
    cacheCommunityPost: (state, action) => {
      const {postId, comicLink, post = {}} = action.payload || {};
      const id = postId || post?.id;
      if (!id) {
        return;
      }

      const resolvedComicLink = comicLink || post?.comicLink || state.communityPostIndex[id]?.comicLink;
      const existingEntry = state.communityPostIndex[id] || {};

      state.communityPostIndex[id] = {
        ...existingEntry,
        ...post,
        id,
        comicLink: resolvedComicLink,
      };
    },
    incrementUserActivity: (state, action) => {
      const {type} = action.payload; // 'post' or 'reply'
      const today = new Date().toDateString();
      
      if (state.userActivity.lastReset !== today) {
        state.userActivity = {postsToday: 0, repliesToday: 0, lastReset: today};
      }
      
      if (type === 'post') {
        state.userActivity.postsToday += 1;
      } else if (type === 'reply') {
        state.userActivity.repliesToday += 1;
      }
    },
    upsertCommunityComicMeta: (state, action) => {
      const {comicLink, meta = {}} = action.payload || {};
      if (!comicLink) {
        return;
      }
      state.communityComics[comicLink] = {
        ...(state.communityComics[comicLink] || {}),
        ...meta,
        comicLink,
        lastSeenAt: Date.now(),
      };
    },
    hydrateNotifications: (state, action) => {
      state.notifications = Array.isArray(action.payload)
        ? action.payload
        : [];
    },
    appendNotification: (state, action) => {
      const notification = action.payload;
      if (!notification?.id) {
        return;
      }
      const deduped = state.notifications.filter(
        existing => existing.id !== notification.id,
      );
      state.notifications = [notification, ...deduped].slice(0, 50);
    },
    markNotificationAsRead: (state, action) => {
      const targetId = action.payload;
      if (!targetId) {
        return;
      }
      state.notifications = state.notifications.map(item =>
        item.id === targetId ? {...item, read: true} : item,
      );
    },
    clearNotifications: state => {
      state.notifications = [];
    },
    setNotificationSubscriptionCache: (state, action) => {
      const {
        uid,
        allowed,
        subscribedList,
        fetchedAt = Date.now(),
        cacheTtlMs,
        cacheSource = 'success',
      } = action.payload || {};
      if (!uid) {
        return;
      }
      const previousEntry = state.notificationSubscriptions[uid];
      const previousList = Array.isArray(previousEntry?.subscribedList)
        ? [...previousEntry.subscribedList]
        : [];
      let nextList = previousList;

      if (Array.isArray(subscribedList) && previousList.length === 0) {
        nextList = Array.from(
          new Set(
            subscribedList.filter(item => typeof item === 'string' && item),
          ),
        );
      }

      const allowedProvided = typeof allowed === 'boolean';
      const nextAllowed = allowedProvided
        ? allowed
        : typeof previousEntry?.allowed === 'boolean'
        ? previousEntry.allowed
        : undefined;
      const resolvedCacheTtl = resolveCacheTtlMs(
        cacheTtlMs,
        previousEntry?.cacheTtlMs,
      );
      state.notificationSubscriptions[uid] = {
        lastFetched: fetchedAt,
        allowed: nextAllowed,
        subscribedList: nextList,
        cacheTtlMs: resolvedCacheTtl,
        cacheSource,
      };
    },
    updateNotificationSubscriptionList: (state, action) => {
      const {uid, detailLink, subscribed} = action.payload || {};
      if (!uid || !detailLink) {
        return;
      }
      if (!state.notificationSubscriptions[uid]) {
        state.notificationSubscriptions[uid] = {
          lastFetched: 0,
          allowed: true,
          subscribedList: [],
          cacheTtlMs: resolveCacheTtlMs(),
        };
      }
      const list = state.notificationSubscriptions[uid].subscribedList || [];
      if (subscribed) {
        if (!list.includes(detailLink)) {
          list.push(detailLink);
        }
      } else {
        state.notificationSubscriptions[uid].subscribedList = list.filter(
          item => item !== detailLink,
        );
      }
    },
  },
});

export const {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
  clearData,
  ClearError,
  StopLoading,
  pushHistory,
  updateData,
  UpdateSearch,
  DownTime,
  SwtichBaseUrl,
  SwtichToAnime,
  AnimeWatched,
  AddAnimeBookMark,
  RemoveAnimeBookMark,
  DownloadComicBook,
  DeleteDownloadedComicBook,
  updateDownloadedComicBook,
  clearHistory,
  setScrollPreference,
  rewardAdsShown,
  // Community & Auth actions
  setUser,
  clearUser,
  setCommunityPosts,
  addCommunityPost,
  updateCommunityPost,
  cacheCommunityPost,
  incrementUserActivity,
  upsertCommunityComicMeta,
  hydrateNotifications,
  appendNotification,
  markNotificationAsRead,
  clearNotifications,
  setNotificationSubscriptionCache,
  updateNotificationSubscriptionList,
} = Reducers.actions;
export default Reducers.reducer;
