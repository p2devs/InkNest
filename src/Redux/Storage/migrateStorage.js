/**
 * Storage Migration Utility
 * Migrates data from AsyncStorage to MMKV without data loss
 * 
 * iOS Note: On iOS, AsyncStorage uses RocksDB/FMDB which stores data in
 * the app's Documents directory. This should persist across updates.
 * However, if the app is uninstalled and reinstalled, data is lost.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MIGRATION_KEY = '@inknest_storage_migrated_v1';
const REDUX_PERSIST_KEY = 'persist:root';

/**
 * Check if migration has already been completed
 */
export async function isMigrationComplete() {
  try {
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    return migrated === 'true';
  } catch (e) {
    console.log('[Migration] Error checking status:', e);
    return false;
  }
}

/**
 * Mark migration as complete
 */
export async function markMigrationComplete() {
  try {
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[Migration] Marked as complete');
  } catch (e) {
    console.error('[Migration] Failed to mark complete:', e);
  }
}

/**
 * Reset migration flag (for testing or force re-migration)
 */
export async function resetMigrationFlag() {
  try {
    await AsyncStorage.removeItem(MIGRATION_KEY);
    console.log('[Migration] Flag reset');
  } catch (e) {
    console.error('[Migration] Failed to reset flag:', e);
  }
}

/**
 * Get all data from AsyncStorage for inspection
 */
async function getAllAsyncStorageData() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const result = {};
    
    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      result[key] = {
        value: value,
        size: value ? value.length : 0
      };
    }
    
    return result;
  } catch (e) {
    console.error('[Migration] Failed to get all data:', e);
    return {};
  }
}

/**
 * Main migration function - MUST be called before Redux store is created
 * @param {Object} mmkv - MMKV instance
 * @returns {Promise<boolean>} - true if migration was successful or already done
 */
export async function migrateAsyncStorageToMMKV(mmkv) {
  console.log('[Migration] ========================================');
  console.log('[Migration] Platform:', Platform.OS);
  console.log('[Migration] Starting migration check...');
  
  try {
    // Step 1: Check if already migrated
    const alreadyMigrated = await isMigrationComplete();
    console.log('[Migration] Already migrated:', alreadyMigrated);
    
    if (alreadyMigrated) {
      console.log('[Migration] Skipping - already done');
      return true;
    }

    // Step 2: Get all AsyncStorage data
    console.log('[Migration] Reading AsyncStorage...');
    const allData = await getAllAsyncStorageData();
    const allKeys = Object.keys(allData);
    
    console.log('[Migration] Found keys:', allKeys);
    console.log('[Migration] Total keys:', allKeys.length);

    // Step 3: Check for redux-persist data
    const persistData = allData[REDUX_PERSIST_KEY]?.value;
    
    if (!persistData) {
      console.log('[Migration] ⚠️  No redux-persist data found!');
      console.log('[Migration] Available keys:', allKeys);
      
      // Still mark as complete so we don't keep trying
      await markMigrationComplete();
      return true;
    }

    console.log('[Migration] ✓ Found redux-persist data');
    console.log('[Migration] Data size:', persistData.length, 'bytes');

    // Step 4: Validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(persistData);
      const dataKeys = Object.keys(parsedData);
      console.log('[Migration] Data keys:', dataKeys);
      
      // Check for important user data
      const hasHistory = dataKeys.includes('history') && Object.keys(parsedData.history || {}).length > 0;
      const hasBookmarks = dataKeys.includes('DownloadComic') && Object.keys(parsedData.DownloadComic || {}).length > 0;
      const hasAnimeBookmarks = dataKeys.includes('AnimeBookMarks') && Object.keys(parsedData.AnimeBookMarks || {}).length > 0;
      
      console.log('[Migration] Has history:', hasHistory);
      console.log('[Migration] Has bookmarks:', hasBookmarks);
      console.log('[Migration] Has anime bookmarks:', hasAnimeBookmarks);
      
    } catch (e) {
      console.error('[Migration] ✗ Invalid JSON:', e);
      await markMigrationComplete();
      return false;
    }

    // Step 5: Check if MMKV already has data (don't overwrite)
    const existingMMKVData = mmkv.getString(REDUX_PERSIST_KEY);
    if (existingMMKVData) {
      console.log('[Migration] ⚠️  MMKV already has data!');
      console.log('[Migration] MMKV data size:', existingMMKVData.length);
      
      // Compare sizes
      if (existingMMKVData.length >= persistData.length) {
        console.log('[Migration] MMKV data is same size or larger, skipping migration');
        await markMigrationComplete();
        return true;
      }
      console.log('[Migration] AsyncStorage has more data, will migrate');
    }

    // Step 6: Migrate to MMKV
    console.log('[Migration] Writing to MMKV...');
    mmkv.set(REDUX_PERSIST_KEY, persistData);
    
    // Step 7: Verify
    const migratedData = mmkv.getString(REDUX_PERSIST_KEY);
    if (migratedData === persistData) {
      console.log('[Migration] ✓ Migration verified');
      console.log('[Migration] ✓ Migrated', persistData.length, 'bytes');
    } else {
      console.error('[Migration] ✗ Verification failed');
      console.error('[Migration] Expected:', persistData.length);
      console.error('[Migration] Got:', migratedData?.length);
      return false;
    }

    // Step 8: Mark complete
    await markMigrationComplete();
    console.log('[Migration] ✓ Migration complete');
    console.log('[Migration] ========================================');

    return true;
  } catch (error) {
    console.error('[Migration] ✗ Fatal error:', error);
    return false;
  }
}

/**
 * Debug helper to check both storages
 */
export async function debugStorages(mmkv) {
  console.log('=== Storage Debug ===');
  
  // Check AsyncStorage
  const allData = await getAllAsyncStorageData();
  console.log('AsyncStorage keys:', Object.keys(allData));
  
  if (allData[REDUX_PERSIST_KEY]) {
    console.log('AsyncStorage persist size:', allData[REDUX_PERSIST_KEY].size);
  }
  
  // Check MMKV
  const mmkvKeys = mmkv.getAllKeys();
  console.log('MMKV keys:', mmkvKeys);
  
  const mmkvData = mmkv.getString(REDUX_PERSIST_KEY);
  console.log('MMKV persist exists:', !!mmkvData);
  if (mmkvData) {
    console.log('MMKV persist size:', mmkvData.length);
  }
  
  // Check migration status
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  console.log('Migration completed:', migrated);
  
  console.log('=== End Debug ===');
}

/**
 * Force migration (for recovery scenarios)
 */
export async function forceMigration(mmkv) {
  console.log('[Migration] Force migration requested');
  await resetMigrationFlag();
  return migrateAsyncStorageToMMKV(mmkv);
}
