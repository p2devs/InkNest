import {configureStore} from '@reduxjs/toolkit';
import {createMigrate, persistStore, persistReducer} from 'redux-persist';
import {storage, mmkvStorage} from '../Storage/Storage';
import Reducers from '../Reducers';
import {isRetiredComicSource} from '../../Utils/retiredComicSources';
import crashlytics from '@react-native-firebase/crashlytics';

// Store and persistor references
let store = null;
let persistor = null;
let isStoreInitialized = false;

const persistConfig = {
  key: 'root',
  version: 2,
  migrate: createMigrate({
    2: state => ({
      ...state,
      baseUrl: !state.baseUrl || state.baseUrl === 'azcomic' || isRetiredComicSource(state.baseUrl)
        ? 'comicbookplus'
        : state.baseUrl,
      sourceStatusNotifications: (state.sourceStatusNotifications || []).filter(
        item => !isRetiredComicSource(item.sourceKey),
      ),
    }),
  }),
  storage: storage,
  blacklist: [
    'error',
    'status',
    'loading',
    'downTime',
    'Search',
  ],
  // Important: Don't write until rehydration is complete
  writeDelayed: true,
};

/**
 * Create the Redux store
 */
function createStore() {
  const persistedReducer = persistReducer(persistConfig, Reducers);
  
  const newStore = configureStore({
    reducer: {
      data: persistedReducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });

  const newPersistor = persistStore(newStore);
  
  return { store: newStore, persistor: newPersistor };
}

/**
 * Initialize the Redux store
 */
export function initializeStore() {
  if (isStoreInitialized) {
    return { store, persistor };
  }

  const result = createStore();
  store = result.store;
  persistor = result.persistor;
  isStoreInitialized = true;
  
  return { store, persistor };
}

/**
 * Get storage size info for debugging/monitoring
 */
export function getStorageInfo() {
  if (!mmkvStorage) {
    return { size: 0, isHealthy: false };
  }
  const size = mmkvStorage.byteSize;
  return {
    size: size,
    isHealthy: size >= 0,
  };
}

/**
 * Check if store is initialized
 */
export function isStoreReady() {
  return isStoreInitialized && store !== null && persistor !== null;
}

// Export store and persistor (will be null until initializeStore is called)
export { store, persistor };
