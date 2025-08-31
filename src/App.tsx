import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConfigCatProvider } from 'configcat-react';
import { CONFIGCAT_SDK_KEY_TEST, CONFIGCAT_SDK_KEY_PROD } from '@env';
import { RootNavigation } from './navigation';

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ConfigCatProvider
        sdkKey={__DEV__ ? CONFIGCAT_SDK_KEY_TEST : CONFIGCAT_SDK_KEY_PROD}
      >
        <RootNavigation />
      </ConfigCatProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
