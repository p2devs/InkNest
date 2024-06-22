import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import {storage} from '../Storage/Storage';
import Reducers from '../Reducers';

const persistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['error', 'status', 'loading', 'downTime'],
};

const persistedReducer = persistReducer(persistConfig, Reducers);
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

export {store, persistor};
