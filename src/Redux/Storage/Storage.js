import {createMMKV} from 'react-native-mmkv';

// Create MMKV instance
const mmkvStorage = createMMKV({
  id: 'inknest-redux-storage',
});

/**
 * Adapter to make MMKV work with redux-persist
 * redux-persist expects setItem/getItem/removeItem that return Promises
 */
const storage = {
  setItem: (key, value) => {
    try {
      mmkvStorage.set(key, value);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
  getItem: (key) => {
    try {
      const value = mmkvStorage.getString(key);
      return Promise.resolve(value ?? null);
    } catch (e) {
      return Promise.reject(e);
    }
  },
  removeItem: (key) => {
    try {
      mmkvStorage.remove(key);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  },
};

// Export the adapter for redux-persist
export { storage, mmkvStorage };
