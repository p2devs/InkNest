/**
 * Migration Helper - Diagnostic and recovery utilities
 * for iOS/Android storage migration issues
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvStorage } from '../Redux/Storage/Storage';

const REDUX_PERSIST_KEY = 'persist:root';
const MIGRATION_KEY = '@inknest_storage_migrated_v1';

/**
 * Check if AsyncStorage still has the original data
 */
export async function checkAsyncStorageData() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const persistData = await AsyncStorage.getItem(REDUX_PERSIST_KEY);
    
    return {
      hasKeys: keys.length > 0,
      keys: keys,
      hasPersistData: !!persistData,
      persistDataSize: persistData ? persistData.length : 0,
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Check MMKV storage status
 */
export function checkMMKVData() {
  try {
    const keys = mmkvStorage.getAllKeys();
    const persistData = mmkvStorage.getString(REDUX_PERSIST_KEY);
    
    return {
      hasKeys: keys.length > 0,
      keys: keys,
      hasPersistData: !!persistData,
      persistDataSize: persistData ? persistData.length : 0,
    };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Full diagnostic report
 */
export async function getMigrationDiagnostic() {
  const asyncStatus = await checkAsyncStorageData();
  const mmkvStatus = checkMMKVData();
  const migrationCompleted = await AsyncStorage.getItem(MIGRATION_KEY);
  
  return {
    asyncStorage: asyncStatus,
    mmkv: mmkvStatus,
    migrationFlag: migrationCompleted,
    summary: {
      canRecover: asyncStatus.hasPersistData && !mmkvStatus.hasPersistData,
      dataInAsyncStorage: asyncStatus.hasPersistData,
      dataInMMKV: mmkvStatus.hasPersistData,
      migrationMarkedComplete: migrationCompleted === 'true',
    }
  };
}

/**
 * Manual recovery - attempt to recover data from AsyncStorage to MMKV
 */
export async function manualRecoverData() {
  try {
    // 1. Get data from AsyncStorage
    const persistData = await AsyncStorage.getItem(REDUX_PERSIST_KEY);
    
    if (!persistData) {
      return {
        success: false,
        error: 'No data found in AsyncStorage to recover',
      };
    }
    
    // 2. Validate it's JSON
    try {
      JSON.parse(persistData);
    } catch (e) {
      return {
        success: false,
        error: 'Data in AsyncStorage is corrupted (invalid JSON)',
      };
    }
    
    // 3. Write to MMKV
    mmkvStorage.set(REDUX_PERSIST_KEY, persistData);
    
    // 4. Verify
    const verifyData = mmkvStorage.getString(REDUX_PERSIST_KEY);
    if (verifyData !== persistData) {
      return {
        success: false,
        error: 'Verification failed - data mismatch',
      };
    }
    
    // 5. Clear migration flag so it doesn't overwrite
    await AsyncStorage.removeItem(MIGRATION_KEY);
    
    return {
      success: true,
      message: `Successfully recovered ${persistData.length} bytes of data`,
      needsRestart: true,
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
    };
  }
}

/**
 * Copy data from AsyncStorage to MMKV without clearing migration flag
 * (Useful for testing)
 */
export async function copyToMMKV() {
  const persistData = await AsyncStorage.getItem(REDUX_PERSIST_KEY);
  if (persistData) {
    mmkvStorage.set(REDUX_PERSIST_KEY, persistData);
    return { success: true, size: persistData.length };
  }
  return { success: false, error: 'No data to copy' };
}
