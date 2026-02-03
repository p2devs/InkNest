/**
 * Storage Migration Utility
 * Migrates data from AsyncStorage to MMKV without data loss
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

const MIGRATION_KEY = '@inknest_storage_migrated_v1';

/**
 * Check if migration has already been completed
 */
export async function isMigrationComplete() {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  return migrated === 'true';
}

/**
 * Mark migration as complete
 */
export async function markMigrationComplete() {
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Get all keys from AsyncStorage that match redux-persist pattern
 */
async function getReduxPersistKeys() {
  const allKeys = await AsyncStorage.getAllKeys();
  // Redux-persist stores data with 'persist:' prefix
  return allKeys.filter(key => key.startsWith('persist:'));
}

/**
 * Migrate a single key-value pair from AsyncStorage to MMKV
 */
async function migrateKeyToMMKV(key, mmkv) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      mmkv.set(key, value);
      return true;
    }
  } catch (error) {
    console.error(`Failed to migrate key ${key}:`, error);
  }
  return false;
}

/**
 * Main migration function
 * Call this BEFORE creating the MMKV storage instance for Redux
 * @returns {Promise<boolean>} - true if migration was successful or already done
 */
export async function migrateAsyncStorageToMMKV(mmkv) {
  try {
    // Check if already migrated
    const alreadyMigrated = await isMigrationComplete();
    if (alreadyMigrated) {
      return true;
    }

    console.log('Starting AsyncStorage to MMKV migration...');

    // Get all redux-persist keys
    const keysToMigrate = await getReduxPersistKeys();
    
    if (keysToMigrate.length === 0) {
      console.log('No redux-persist data found in AsyncStorage');
      await markMigrationComplete();
      return true;
    }

    console.log(`Found ${keysToMigrate.length} keys to migrate`);

    // Migrate each key
    let migratedCount = 0;
    for (const key of keysToMigrate) {
      const success = await migrateKeyToMMKV(key, mmkv);
      if (success) {
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount}/${keysToMigrate.length} keys`);

    // Mark migration as complete
    await markMigrationComplete();

    return true;
  } catch (error) {
    console.error('Storage migration failed:', error);
    // Don't mark as complete if migration failed
    // This allows retry on next app launch
    return false;
  }
}

/**
 * Fallback: If MMKV fails, use AsyncStorage adapter
 */
export function createMMKVAdapter(mmkv) {
  return {
    setItem: (key, value) => {
      mmkv.set(key, value);
      return Promise.resolve();
    },
    getItem: (key) => {
      const value = mmkv.getString(key);
      return Promise.resolve(value ?? null);
    },
    removeItem: (key) => {
      mmkv.delete(key);
      return Promise.resolve();
    },
  };
}
