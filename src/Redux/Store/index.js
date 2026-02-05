import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import {storage, mmkvStorage} from '../Storage/Storage';
import {migrateAsyncStorageToMMKV} from '../Storage/migrateStorage';
import Reducers from '../Reducers';
import crashlytics from '@react-native-firebase/crashlytics';

// Store and persistor references
let store = null;
let persistor = null;
let isStoreInitialized = false;

const persistConfig = {
  key: 'root',
  version: 1,
  storage: storage,
  blacklist: ['error', 'status', 'loading', 'downTime', 'hasRewardAdsShown', 'Search'],
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
 * Initialize the store after migration
 * This should be called AFTER migration is complete
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
 * Perform storage migration from AsyncStorage to MMKV
 * Call this function BEFORE initializing the store
 * @returns {Promise<boolean>}
 */
export async function performStorageMigration() {
  try {
    // Run the migration
    const success = await migrateAsyncStorageToMMKV(mmkvStorage);
    return success;
  } catch (error) {
    console.error('Migration error:', error);
    crashlytics().recordError(error);
    return false;
  }
}

/**
 * Get storage size info for debugging/monitoring
 */
export function getStorageInfo() {
  if (!mmkvStorage) {
    return { size: 0, isHealthy: false };
  }
  const size = mmkvStorage.getSize();
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
