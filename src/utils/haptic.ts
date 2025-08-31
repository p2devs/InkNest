import HapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

export type HapticType = 
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const macOSHapticOptions = {
  enableVibrateFallback: false, // No vibration fallback on macOS
  ignoreAndroidSystemSettings: false,
};

/**
 * Check if the current platform supports haptic feedback
 */
export const isHapticSupported = (): boolean => {
  return Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'macos';
};

/**
 * Get platform-specific haptic options
 */
const getHapticOptions = () => {
  return Platform.OS === 'macos' ? macOSHapticOptions : hapticOptions;
};

export const triggerHaptic = (type: HapticType = 'impactLight') => {
  if (isHapticSupported()) {
    try {
      HapticFeedback.trigger(type, getHapticOptions());
    } catch (error) {
      // Fallback for devices without haptic support
      const platform = Platform.OS;
      console.log(`Haptic feedback not available on this ${platform} device:`, error);
    }
  }
};

// Convenience functions for common haptic feedback
export const hapticFeedback = {
  light: () => triggerHaptic('impactLight'),
  medium: () => triggerHaptic('impactMedium'),
  heavy: () => triggerHaptic('impactHeavy'),
  selection: () => triggerHaptic('selection'),
  success: () => triggerHaptic('notificationSuccess'),
  warning: () => triggerHaptic('notificationWarning'),
  error: () => triggerHaptic('notificationError'),
};

/**
 * Platform-specific haptic feedback information
 */
export const hapticInfo = {
  supported: isHapticSupported(),
  platform: Platform.OS,
  capabilities: {
    ios: ['impactLight', 'impactMedium', 'impactHeavy', 'selection', 'notificationSuccess', 'notificationWarning', 'notificationError'],
    android: ['impactLight', 'impactMedium', 'impactHeavy', 'selection'],
    macos: ['impactLight', 'impactMedium', 'selection'], // Limited support
    default: [],
  },
  getCurrentCapabilities: () => {
    const platform = Platform.OS as keyof typeof hapticInfo.capabilities;
    return hapticInfo.capabilities[platform] || hapticInfo.capabilities.default;
  },
};
