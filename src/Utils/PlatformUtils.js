import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMacOS = Platform.OS === 'macos';
export const isWeb = Platform.OS === 'web';

export const platformSelect = (platforms) => {
  return Platform.select(platforms);
};

export const macOSStyles = (styles) => {
  return isMacOS ? styles : {};
};

export const notMacOSStyles = (styles) => {
  return !isMacOS ? styles : {};
};

// Platform-specific values
export const platformValues = {
  spacing: platformSelect({
    ios: 16,
    android: 16,
    macos: 20,
    default: 16,
  }),
  
  borderRadius: platformSelect({
    ios: 8,
    android: 4,
    macos: 6,
    default: 8,
  }),
  
  statusBarHeight: platformSelect({
    ios: 44,
    android: 0,
    macos: 0,
    default: 0,
  }),
};

export default Platform;