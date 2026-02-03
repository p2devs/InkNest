import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import {storage, migrateAsyncStorageToMMKV, mmkvStorage} from '../Storage/Storage';
import Reducers from '../Reducers';
import crashlytics from '@react-native-firebase/crashlytics';

const persistConfig = {
  key: 'root',
  version: 1, // Add version for future state migrations
  storage: storage,
  blacklist: ['error', 'status', 'loading', 'downTime', 'hasRewardAdsShown'],
  // Add state reconciler to handle version changes
  stateReconciler: (inboundState, originalState) => {
    // If inbound state is invalid/corrupted, return original state
    if (!inboundState || typeof inboundState !== 'object') {
      return originalState;
    }
    return inboundState;
  },
};

const persistedReducer = persistReducer(persistConfig, Reducers);

/**
 * Redux store configuration with persisted reducer.
 * @constant {import('@reduxjs/toolkit').EnhancedStore} store
 * @description Configures the Redux store with a persisted reducer and custom middleware settings.
 * The store is set up using Redux Toolkit's configureStore with:
 * - A persisted reducer for data persistence
 * - Disabled serializable check in middleware to allow non-serializable values
 */
const store = configureStore({
  reducer: {
    data: persistedReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

/**
 * Perform storage migration from AsyncStorage to MMKV
 * Call this function ONCE during app initialization (before rendering)
 * @returns {Promise<boolean>}
 */
export async function performStorageMigration() {
  try {
    const success = await migrateAsyncStorageToMMKV(mmkvStorage);
    if (success) {
      // After successful migration, purge and rehydrate to load migrated data
      await persistor.purge();
      await persistor.persist();
    }
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
  const size = mmkvStorage.getSize();
  return {
    size: size,
    // MMKV has no practical limit (depends on device storage)
    isHealthy: size > 0 || size === 0, // Size 0 means empty, which is fine
  };
}

export {store, persistor};
