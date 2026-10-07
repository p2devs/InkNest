module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Many dependencies ship untranspiled ESM; let Babel transform them.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native.*|(@[^/]+/)?react-native.*|@react-navigation|@reduxjs|@notifee|react-redux|redux-persist|immer|reselect|configcat-.*|moti)/)',
  ],
};
