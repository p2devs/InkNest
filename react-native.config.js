module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
        macos: null, // disable macOS platform, enable iOS platform and disable macOS platform
      },
    },
    '@react-native-firebase/app': {
      platforms: {
        macos: null, // disable macOS platform - this is the core Firebase module causing initialization
      },
    },
    '@react-native-firebase/perf': {
      platforms: {
        macos: null, // disable macOS platform since Firebase Performance doesn't support macOS
      },
    },
    '@react-native-firebase/analytics': {
      platforms: {
        macos: null, // disable macOS platform since Firebase Analytics may not be fully supported on macOS
      },
    },
    '@react-native-firebase/crashlytics': {
      platforms: {
        macos: null, // disable macOS platform since Firebase Crashlytics may not be fully supported on macOS
      },
    },
    '@react-native-firebase/messaging': {
      platforms: {
        macos: null, // disable macOS platform since Firebase Messaging may not be fully supported on macOS
      },
    },
    '@react-native-firebase/in-app-messaging': {
      platforms: {
        macos: null, // disable macOS platform since Firebase In-App Messaging may not be fully supported on macOS
      },
    },
    'react-native-google-mobile-ads': {
      platforms: {
        macos: null, // disable macOS platform since Google Mobile Ads may not be fully supported on macOS
      },
    },
    'react-native-permissions': {
      platforms: {
        macos: null, // disable macOS platform since permissions might need different handling on macOS
      },
    },
    'react-native-device-info': {
      platforms: {
        macos: null, // disable macOS platform since device info might need different handling on macOS
      },
    },
    '@candlefinance/faster-image': {
      platforms: {
        macos: null, // disable macOS platform since faster-image doesn't support macOS
      },
    },
    'react-native-screens': {
      platforms: {
        macos: null, // disable macOS platform since screens has compatibility issues
      },
    },
  },
};
