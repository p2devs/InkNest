import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from './src/Redux/Store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigation } from './src/Navigation';
import Loading from './src/Components/UIComp/Loading';
import Toast from 'react-native-toast-message';
import { PaperProvider } from 'react-native-paper';
import ForceUpdate from './src/Components/ForceUpdate';
import { ConfigCatProvider } from 'configcat-react';
import { CONFIGCAT_SDK_KEY_TEST, CONFIGCAT_SDK_KEY_PROD } from '@env';
import { BannerProvider } from './src/Components/UIComp/AnimeAdBanner/BannerContext';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {
  configureGoogleSignIn,
  listenToAuthChanges,
} from './src/InkNest-Externals/Community/Logic/CommunityActions';
import NotificationSubscriptionBootstrapper from './src/InkNest-Externals/Notifications/components/NotificationSubscriptionBootstrapper';

/**
 * The main App component that sets up the root of the application.
 * It includes the GestureHandlerRootView for gesture handling,
 * the Redux Provider for state management, and the PersistGate
 * for persisting the Redux store.
 *
 * @returns {JSX.Element} The root component of the application.
 */
const App = () => {
  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();

    // Listen to auth state changes
    const unsubscribeAuth = store.dispatch(listenToAuthChanges());

    if (!__DEV__) {
      // Initialize Firebase Crashlytics
      crashlytics().log('App mounted.');

      // Enable analytics collection
      analytics().setAnalyticsCollectionEnabled(true);

      // Catch JS errors and report to Crashlytics
      const errorHandler = (error, isFatal) => {
        if (isFatal) {
          crashlytics().recordError(error);
        }
        return false;
      };

      // Set error handlers
      ErrorUtils.setGlobalHandler(errorHandler);

      return () => {
        // Clean up auth listener
        if (unsubscribeAuth) unsubscribeAuth();
      };
    }

    return () => {
      // Clean up auth listener
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConfigCatProvider
        sdkKey={__DEV__ ? CONFIGCAT_SDK_KEY_TEST : CONFIGCAT_SDK_KEY_PROD}>
        <Provider store={store}>
          <PersistGate loading={<Loading />} persistor={persistor}>
            <PaperProvider>
              <BannerProvider>
                <NotificationSubscriptionBootstrapper />
                <RootNavigation />
                <Toast />
                <ForceUpdate />
              </BannerProvider>
            </PaperProvider>
          </PersistGate>
        </Provider>
      </ConfigCatProvider>
    </GestureHandlerRootView>
  );
};

export default App;
