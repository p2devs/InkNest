import { useEffect, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';

let settingsStore;
const store = () =>
  (settingsStore ??= createMMKV({ id: 'novel-narration-settings' }));

// useState that survives restarts (narrator, speed, scene and ambience
// choices). Unreadable values fall back to `initial`.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = store().getString(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      store().set(key, JSON.stringify(value));
    } catch {
      // Settings are a convenience; failing to save them must not break playback.
    }
  }, [key, value]);
  return [value, setValue];
}
