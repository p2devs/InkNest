import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HapticType } from '../../utils/haptic';
import { settingsStorage, createMMKVAdapter } from '../../utils/storage';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface SettingsState {
  hapticEnabled: boolean;
  hapticIntensity: HapticIntensity;
  hapticPreferences: {
    cardPress: HapticType;
    buttonPress: HapticType;
    toggleSwitch: HapticType;
    success: HapticType;
    error: HapticType;
  };
  setHapticEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
  setHapticIntensity: (intensity: HapticIntensity) => void;
  setHapticPreference: (action: keyof SettingsState['hapticPreferences'], type: HapticType) => void;
  resetHapticPreferences: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hapticEnabled: true, // Default to enabled
      hapticIntensity: 'light', // Default to light intensity
      hapticPreferences: {
        cardPress: 'impactLight',
        buttonPress: 'impactMedium',
        toggleSwitch: 'impactLight', // Soft haptic effect for toggle switches
        success: 'notificationSuccess',
        error: 'notificationError',
      },
      
      setHapticEnabled: (enabled: boolean) => {
        set({ hapticEnabled: enabled });
      },
      
      toggleHaptic: () => {
        const current = get().hapticEnabled;
        set({ hapticEnabled: !current });
      },

      setHapticIntensity: (intensity: HapticIntensity) => {
        set({ hapticIntensity: intensity });
        
        // Auto-update preferences based on intensity
        const preferences = get().hapticPreferences;
        const intensityMap = {
          light: { cardPress: 'impactLight', buttonPress: 'impactLight' },
          medium: { cardPress: 'impactMedium', buttonPress: 'impactMedium' },
          heavy: { cardPress: 'impactHeavy', buttonPress: 'impactHeavy' },
        } as const;
        
        set({
          hapticPreferences: {
            ...preferences,
            ...intensityMap[intensity],
          },
        });
      },

      setHapticPreference: (action, type) => {
        const current = get().hapticPreferences;
        set({
          hapticPreferences: {
            ...current,
            [action]: type,
          },
        });
      },

      resetHapticPreferences: () => {
        set({
          hapticIntensity: 'light',
          hapticPreferences: {
            cardPress: 'impactLight',
            buttonPress: 'impactMedium',
            toggleSwitch: 'impactLight', // Soft haptic effect for toggle switches
            success: 'notificationSuccess',
            error: 'notificationError',
          },
        });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => createMMKVAdapter(settingsStorage)),
    }
  )
);
