import { MMKV } from 'react-native-mmkv';

/**
 * MMKV Storage Utilities
 * 
 * Provides high-performance, encrypted storage instances for different app data types.
 * MMKV offers fast, synchronous storage with built-in encryption support.
 */

// Main settings storage instance
export const settingsStorage = new MMKV({
  id: 'settings-storage',
  encryptionKey: 'ink-nest-settings',
});

// User preferences storage instance
export const userPreferencesStorage = new MMKV({
  id: 'user-preferences',
  encryptionKey: 'ink-nest-user-prefs',
});

// Cache storage instance (for temporary data)
export const cacheStorage = new MMKV({
  id: 'cache-storage',
  // No encryption for cache data to improve performance
});

/**
 * Creates a Zustand-compatible storage adapter for MMKV
 * @param storage - MMKV instance to wrap
 * @returns Storage adapter compatible with Zustand persist middleware
 */
export const createMMKVAdapter = (storage: MMKV) => ({
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storage.delete(name);
  },
});

/**
 * Utility functions for common storage operations
 */
export const storageUtils = {
  /**
   * Clear all data from a specific storage instance
   */
  clearStorage: (storage: MMKV) => {
    storage.clearAll();
  },

  /**
   * Get all keys from a specific storage instance
   */
  getAllKeys: (storage: MMKV) => {
    return storage.getAllKeys();
  },

  /**
   * Check if a key exists in storage
   */
  hasKey: (storage: MMKV, key: string) => {
    return storage.contains(key);
  },

  /**
   * Get storage size information
   */
  getStorageInfo: (storage: MMKV) => {
    const keys = storage.getAllKeys();
    return {
      keyCount: keys.length,
      keys: keys,
      // Note: MMKV doesn't provide direct size info, but we can estimate
    };
  },
};

/**
 * Storage instances for easy import
 */
export const storage = {
  settings: settingsStorage,
  userPreferences: userPreferencesStorage,
  cache: cacheStorage,
  utils: storageUtils,
};

export default storage;
