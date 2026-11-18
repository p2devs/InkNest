module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    'module:react-native-dotenv',
    'react-native-paper/babel',
    'react-native-worklets/plugin',
  ],
};
