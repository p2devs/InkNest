import React, {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigation} from './AppNavigation';
import {navigationRef} from './NavigationService';
import {Platform, StatusBar, AppState} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  ClearError,
  appendNotification,
  hydrateNotifications,
  markNotificationAsRead,
} from '../Redux/Reducers';
import analytics from '@react-native-firebase/analytics';
import messaging from '@react-native-firebase/messaging';
import {firebase} from '@react-native-firebase/perf';
import crashlytics from '@react-native-firebase/crashlytics';
import {firebase as fire} from '@react-native-firebase/analytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import {
  configureGoogleSignIn,
  listenToAuthChanges,
} from '../InkNest-Externals/Community/Logic/CommunityActions';

import {
  requestNotifications,
  checkNotifications,
} from 'react-native-permissions';
import {NAVIGATION} from '../Constants';
import {
  buildNotificationPayload,
  loadStoredNotifications,
  mergeNotificationLists,
  persistNotificationList,
  tryParseJSON,
} from '../Utils/notificationHelpers';

/**
 * RootNavigation component handles the main navigation logic for the application.
 * It sets up various configurations such as requesting user permissions, enabling analytics,
 * crashlytics, and performance monitoring. It also manages the navigation state and logs screen views.
 *
 * @function RootNavigation
 * @returns {JSX.Element} The navigation container with the app's navigation structure.
 *
 * @requires useDispatch from 'react-redux'
 * @requires useNetInfo from '@react-native-community/netinfo'
 * @requires useRef from 'react'
 * @requires useEffect from 'react'
 * @requires useLayoutEffect from 'react'
 * @requires crashlytics from '@react-native-firebase/crashlytics'
 * @requires messaging from '@react-native-firebase/messaging'
 * @requires fire from '@react-native-firebase/app'
 * @requires firebase from '@react-native-firebase/app'
 * @requires PermissionsAndroid from 'react-native'
 * @requires Platform from 'react-native'
 * @requires StatusBar from 'react-native'
 * @requires NavigationContainer from '@react-navigation/native'
 * @requires navigationRef from './path/to/navigationRef'
 * @requires AppNavigation from './path/to/AppNavigation'
 * @requires ClearError from './path/to/actions'
 */
export function RootNavigation() {
  const dispatch = useDispatch();
  const routeNameRef = useRef();
  const [appState, setAppState] = useState(AppState.currentState);
  const notificationsState = useSelector(
    state => state?.data?.notifications || [],
  );
  const notificationCacheRef = useRef([]);
  const pendingNotificationNavRef = useRef(null);

  // Add this useEffect to track app state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      crashlytics().setAttribute('app_state', nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const persistNotifications = useCallback(async nextList => {
    notificationCacheRef.current = nextList;
    try {
      await persistNotificationList(nextList);
    } catch (error) {
      crashlytics().recordError(error);
    }
  }, []);

  const refreshNotificationsFromStorage = useCallback(async () => {
    try {
      const stored = await loadStoredNotifications();
      const cachedSignature = JSON.stringify(notificationCacheRef.current);
      const storedSignature = JSON.stringify(stored);
      if (cachedSignature !== storedSignature) {
        notificationCacheRef.current = stored;
        dispatch(hydrateNotifications(stored));
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to hydrate notifications', error);
      }
      crashlytics().recordError(error);
      notificationCacheRef.current = [];
      dispatch(hydrateNotifications([]));
      try {
        await persistNotificationList([]);
      } catch (_) {}
    }
  }, [dispatch]);

  useEffect(() => {
    refreshNotificationsFromStorage();
  }, [refreshNotificationsFromStorage]);

  useEffect(() => {
    if (appState === 'active') {
      refreshNotificationsFromStorage();
    }
  }, [appState, refreshNotificationsFromStorage]);

  useEffect(() => {
    if (!Array.isArray(notificationsState)) {
      return;
    }
    const cachedSignature = JSON.stringify(notificationCacheRef.current);
    const stateSignature = JSON.stringify(notificationsState);
    if (cachedSignature === stateSignature) {
      return;
    }
    persistNotifications(notificationsState);
  }, [notificationsState, persistNotifications]);

  const resolveNotificationTarget = useCallback(
    payload => {
      const data = payload?.data;
      if (!data) {
        return null;
      }

      if (data.postId && data.comicLink) {
        const initialPost =
          typeof data.initialPost === 'string'
            ? tryParseJSON(data.initialPost)
            : data.initialPost || null;
        return {
          name: NAVIGATION.PostDetail,
          params: {
            comicLink: data.comicLink,
            postId: data.postId,
            initialPost,
          },
        };
      }

      if ((data.link || data.comicLink) && (data.title || data.comicTitle)) {
        return {
          name: NAVIGATION.comicDetails,
          params: {
            link: data.link || data.comicLink,
            title: data.title || data.comicTitle,
            image: data.image || data.coverImage || null,
          },
        };
      }

      if (data.screen) {
        const parsedParams =
          typeof data.params === 'string'
            ? tryParseJSON(data.params)
            : data.params || {};
        return {
          name: data.screen,
          params: parsedParams,
        };
      }

      return null;
    },
    [tryParseJSON],
  );

  const flushPendingNavigation = useCallback(() => {
    if (!pendingNotificationNavRef.current || !navigationRef.current) {
      return;
    }

    const {target, notificationId} = pendingNotificationNavRef.current;
    navigationRef.current.navigate(target.name, target.params);
    if (notificationId) {
      dispatch(markNotificationAsRead(notificationId));
    }
    pendingNotificationNavRef.current = null;
  }, [dispatch]);

  const navigateToNotificationTarget = useCallback(
    payload => {
      const target = resolveNotificationTarget(payload);
      if (!target) {
        return;
      }

      if (navigationRef.current) {
        navigationRef.current.navigate(target.name, target.params);
        if (payload?.id) {
          dispatch(markNotificationAsRead(payload.id));
        }
        return;
      }

      pendingNotificationNavRef.current = {
        target,
        notificationId: payload?.id,
      };
    },
    [dispatch, resolveNotificationTarget],
  );

  const handleIncomingNotification = useCallback(
    (remoteMessage, shouldNavigate = false) => {
      const parsedPayload = buildNotificationPayload(
        remoteMessage,
        shouldNavigate,
      );
      if (!parsedPayload?.id) {
        return;
      }

      const deduped = mergeNotificationLists(
        parsedPayload,
        notificationCacheRef.current,
      );
      persistNotifications(deduped);
      dispatch(appendNotification(parsedPayload));

      if (shouldNavigate) {
        navigateToNotificationTarget(parsedPayload);
      }
    },
    [buildNotificationPayload, dispatch, navigateToNotificationTarget, persistNotifications],
  );

  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(remoteMessage => {
      handleIncomingNotification(remoteMessage, false);
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        handleIncomingNotification(remoteMessage, true);
      },
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleIncomingNotification(remoteMessage, true);
        }
      })
      .catch(error => {
        crashlytics().recordError(error);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [handleIncomingNotification]);

  // Request user permission for notifications on Android and iOS devices
  async function requestUserPermission() {
    crashlytics().log('Requesting the notification permission.');
    checkNotifications();
    requestNotifications(['alert', 'sound']);
    await FCMPushNotification();
  }

  // FCM Push Notification for Android and iOS devices using Firebase Cloud Messaging
  async function FCMPushNotification() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  /**
   * Enables the reception of in-app messages by disabling message display suppression.
   *
   * @async
   * @function allowToReceiveInAppMessages
   * @returns {Promise<void>} Resolves when in-app messages can be received.
   */
  async function allowToReceiveInAppMessages() {
    await inAppMessaging().setMessagesDisplaySuppressed(false);
  }

  /**
   * Enables analytics collection for the application.
   *
   * This function asynchronously sets the analytics collection to be enabled
   * using the Firebase analytics service.
   *
   * @returns {Promise<void>} A promise that resolves when the analytics collection is enabled.
   */
  async function AnalyticsEnabled() {
    await fire.analytics().setAnalyticsCollectionEnabled(true);
  }

  /**
   * Enables Crashlytics collection.
   *
   * This function asynchronously enables the Crashlytics collection by setting
   * the Crashlytics collection enabled flag to true.
   *
   * @returns {Promise<void>} A promise that resolves when the Crashlytics collection is enabled.
   */
  async function toggleCrashlytics() {
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  /**
   * Enables performance monitoring collection in the Firebase application.
   *
   * This function asynchronously enables the collection of performance data
   * using Firebase Performance Monitoring. It sets the performance collection
   * to be enabled, allowing the app to gather and report performance metrics.
   *
   * @async
   * @function PerformanceMonitoring
   * @returns {Promise<void>} A promise that resolves when the performance collection is enabled.
   */
  async function PerformanceMonitoring() {
    await firebase.perf().setPerformanceCollectionEnabled(true);
  }

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();

    // Listen to auth state changes
    const unsubscribe = dispatch(listenToAuthChanges());

    allowToReceiveInAppMessages();
    requestUserPermission();
    if (!__DEV__) {
      PerformanceMonitoring();
      toggleCrashlytics();
      AnalyticsEnabled();
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (Platform.OS === 'android') StatusBar.setBackgroundColor('#222');
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        flushPendingNavigation();
      }}
      onStateChange={async () => {
        //if screen change then clear error and stop loading
        dispatch(ClearError());

        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;

        if (previousRouteName !== currentRouteName) {
          await analytics().logScreenView({
            screen_name: currentRouteName,
            screen_class: currentRouteName,
          });
          console.log('Screen Name: ', currentRouteName);
        }
        routeNameRef.current = currentRouteName;

        // Add more context to crashes
        crashlytics().setAttribute('current_screen', currentRouteName);
        crashlytics().setAttribute('app_state', JSON.stringify(appState));
      }}>
      <AppNavigation />
    </NavigationContainer>
  );
}
