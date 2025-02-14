import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/Redux/Store';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigation} from './src/Navigation';
import Loading from './src/Components/UIComp/Loading';
import Toast from 'react-native-toast-message';
import {PaperProvider} from 'react-native-paper';
import ForceUpdate from './src/Components/ForceUpdate';
import {
  ConfigCatProvider,
  createConsoleLogger,
  LogLevel,
} from 'configcat-react';
import {CONFIGCAT_SDK_KEY_TEST, CONFIGCAT_SDK_KEY_PROD} from '@env';

/**
 * The main App component that sets up the root of the application.
 * It includes the GestureHandlerRootView for gesture handling,
 * the Redux Provider for state management, and the PersistGate
 * for persisting the Redux store.
 *
 * @returns {JSX.Element} The root component of the application.
 */
const App = () => {
  const logger = createConsoleLogger(LogLevel.Info);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ConfigCatProvider
        sdkKey={__DEV__ ? CONFIGCAT_SDK_KEY_TEST : CONFIGCAT_SDK_KEY_PROD}
        options={{logger}}>
        <Provider store={store}>
          <PersistGate loading={<Loading />} persistor={persistor}>
            <PaperProvider>
              <RootNavigation />
              <Toast />
              <ForceUpdate />
            </PaperProvider>
          </PersistGate>
        </Provider>
      </ConfigCatProvider>
    </GestureHandlerRootView>
  );
};

export default App;
