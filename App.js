import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { 
  initializeStore, 
  store, 
  persistor,
  isStoreReady 
} from './src/Redux/Store';
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
 * AppContent component - rendered after store is initialized
 */
function AppContent() {
  useEffect(() => {
    configureGoogleSignIn();
    const unsubscribeAuth = store.dispatch(listenToAuthChanges());

    if (!__DEV__) {
      crashlytics().log('App mounted.');
      analytics().setAnalyticsCollectionEnabled(true);

      const errorHandler = (error, isFatal) => {
        if (isFatal) {
          crashlytics().recordError(error);
        }
        return false;
      };
      ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  return (
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
  );
}

/**
 * Main App component
 */
const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function setupApp() {
      try {
        console.log('[App] Starting app setup...');
        
        // Initialize store
        console.log('[App] Initializing store...');
        initializeStore();
        
        if (!isStoreReady()) {
          throw new Error('Store initialization failed');
        }

        console.log('[App] Setup complete');
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        console.error('[App] Setup failed:', error);
        crashlytics().recordError(error);
      }
    }

    setupApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Loading />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConfigCatProvider
        sdkKey={__DEV__ ? CONFIGCAT_SDK_KEY_TEST : CONFIGCAT_SDK_KEY_PROD}>
        <AppContent />
      </ConfigCatProvider>
    </GestureHandlerRootView>
  );
};

export default App;
