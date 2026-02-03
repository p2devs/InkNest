import { MMKV } from 'react-native-mmkv';
import {
  migrateAsyncStorageToMMKV,
  createMMKVAdapter,
} from './migrateStorage';

// Create MMKV instance
const mmkvStorage = new MMKV({
  id: 'inknest-redux-storage',
  // Optional: encryption for sensitive data
  // encryptionKey: 'your-encryption-key',
});

// Export the adapter for redux-persist
export const storage = createMMKVAdapter(mmkvStorage);

// Export MMKV instance for direct access if needed
export { mmkvStorage };

// Export migration function to be called before store initialization
export { migrateAsyncStorageToMMKV };
