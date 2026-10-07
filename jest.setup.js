/* eslint-env jest */
// Native modules have no JS implementation under Jest.
// ponytail: one catch-all stub; replace with explicit mocks when a test asserts on these calls.
const mockStub = () =>
  new Proxy(function () {}, {
    get: (target, key) =>
      key === 'then'
        ? resolve => Promise.resolve().then(resolve)
        : key === '__esModule'
        ? true
        : key === Symbol.toPrimitive
        ? () => ''
        : mockStub(),
    apply: () => mockStub(),
  });

require('react-native-gesture-handler/jestSetup');
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
[
  // Old-architecture modules that read NativeModules at import time.
  'react-native-orientation-locker',
  'react-native-sensors',
  '@dr.pogodin/react-native-fs',
].forEach(name => jest.mock(name, () => mockStub()));

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));
[
  'analytics',
  'app',
  'crashlytics',
  'firestore',
  'in-app-messaging',
  'messaging',
  'perf',
].forEach(name =>
  jest.mock(`@react-native-firebase/${name}`, () => mockStub()),
);
jest.mock('react-native-device-info', () => {
  const info = { getVersion: () => '0.0.0', getBuildNumber: () => '0' };
  return { __esModule: true, default: info, ...info };
});
// Signed out; a stubbed user would change identity on every render.
jest.mock('@react-native-firebase/auth', () => {
  const auth = () => ({
    currentUser: null,
    onAuthStateChanged: () => () => {},
  });
  return { __esModule: true, default: auth };
});

// Third-party TurboModules resolve to the stub instead of throwing at import.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const registry = jest.requireActual(
    'react-native/Libraries/TurboModule/TurboModuleRegistry',
  );
  return {
    ...registry,
    getEnforcing: name => registry.get(name) ?? mockStub(),
  };
});

// Feature flags resolve to their defaults; tests never reach ConfigCat.
jest.mock('configcat-react', () => ({
  ConfigCatProvider: ({ children }) => children,
  useFeatureFlag: (key, defaultValue) => ({
    value: defaultValue,
    loading: false,
  }),
}));
