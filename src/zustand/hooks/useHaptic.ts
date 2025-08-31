import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { hapticFeedback, HapticType, triggerHaptic, isHapticSupported, hapticInfo } from '../../utils/haptic';

/**
 * Custom hook for haptic feedback that respects global settings and user preferences
 * @returns Object with haptic trigger functions and platform info
 */
export const useHaptic = () => {
  const { hapticEnabled, hapticPreferences, hapticIntensity } = useSettingsStore();

  const trigger = useCallback((type: HapticType = 'impactLight') => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(type);
    }
  }, [hapticEnabled]);

  const light = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.light();
    }
  }, [hapticEnabled]);

  const medium = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.medium();
    }
  }, [hapticEnabled]);

  const heavy = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.heavy();
    }
  }, [hapticEnabled]);

  const selection = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.selection();
    }
  }, [hapticEnabled]);

  const success = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.success();
    }
  }, [hapticEnabled]);

  const warning = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.warning();
    }
  }, [hapticEnabled]);

  const error = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      hapticFeedback.error();
    }
  }, [hapticEnabled]);

  // Contextual haptic methods based on user preferences
  const cardPress = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(hapticPreferences.cardPress);
    }
  }, [hapticEnabled, hapticPreferences.cardPress]);

  const buttonPress = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(hapticPreferences.buttonPress);
    }
  }, [hapticEnabled, hapticPreferences.buttonPress]);

  const toggleSwitch = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(hapticPreferences.toggleSwitch);
    }
  }, [hapticEnabled, hapticPreferences.toggleSwitch]);

  const successFeedback = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(hapticPreferences.success);
    }
  }, [hapticEnabled, hapticPreferences.success]);

  const errorFeedback = useCallback(() => {
    if (hapticEnabled && isHapticSupported()) {
      triggerHaptic(hapticPreferences.error);
    }
  }, [hapticEnabled, hapticPreferences.error]);

  return {
    trigger,
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
    // Contextual methods based on user preferences
    cardPress,
    buttonPress,
    toggleSwitch,
    successFeedback,
    errorFeedback,
    // State and info
    isEnabled: hapticEnabled,
    isSupported: isHapticSupported(),
    platformInfo: hapticInfo,
    currentIntensity: hapticIntensity,
    preferences: hapticPreferences,
  };
};
