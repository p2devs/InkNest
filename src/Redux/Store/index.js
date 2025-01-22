import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { storage } from '../Storage/Storage';
import Reducers from '../Reducers';

const persistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['error', 'status', 'loading', 'downTime', 'isServerUp'],
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

export { store, persistor };
