import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigation} from './AppNavigation';
import {navigationRef} from './NavigationService';
import {Platform, StatusBar} from 'react-native';
import {useDispatch} from 'react-redux';
import {ClearError} from '../Redux/Reducers';
import analytics from '@react-native-firebase/analytics';
import messaging from '@react-native-firebase/messaging';
import {firebase} from '@react-native-firebase/perf';
import crashlytics from '@react-native-firebase/crashlytics';
import {firebase as fire} from '@react-native-firebase/analytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';

import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  requestNotifications,
  checkNotifications,
} from 'react-native-permissions';
import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

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

  // Request user permission for notifications on Android and iOS devices
  async function requestUserPermission() {
    crashlytics().log('Requesting the notification permission.');
    checkNotifications();
    requestNotifications(['alert', 'sound']);
    FCMPushNotification();
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

  // Request user consent for personalized ads from Google Mobile Ads SDK
  useEffect(() => {
    // Request consent information and load/present a consent form if necessary
    AdsConsent.gatherConsent()
      .then(() => startGoogleMobileAdsSDK())
      .catch(error => {
        console.error('Consent gathering failed:', error);
        // Still initialize ads even if consent gathering failed
        startGoogleMobileAdsSDK();
      });
  }, []);

  // Start Google Mobile Ads SDK with user consent
  async function startGoogleMobileAdsSDK() {
    const consentInfo = await AdsConsent.getConsentInfo();
    let useNonPersonalizedAds = !consentInfo.canRequestAds;

    // Handle iOS App Tracking Transparency
    if (Platform.OS === 'ios' && (await AdsConsent.getGdprApplies())) {
      const status = await AdsConsent.requestTrackingAuthorization();
      if (status !== AdsConsentStatus.AUTHORIZED) {
        useNonPersonalizedAds = true; // Use non-personalized if ATT denied
      }
    }

    // Initialize ads based on consent status
    if (useNonPersonalizedAds) {
      console.log(
        'Using non-personalized ads due to consent or ATT restrictions',
      );
      await mobileAds().initialize();
      await mobileAds().setRequestConfiguration({
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: 'G',
        testDeviceIdentifiers: [],
      });
    } else {
      // Initialize with personalized ads
      await mobileAds().initialize();
    }
  }

  useEffect(() => {
    allowToReceiveInAppMessages();
    requestUserPermission();
    if (!__DEV__) {
      PerformanceMonitoring();
      toggleCrashlytics();
      AnalyticsEnabled();
    }
  }, []);

  useLayoutEffect(() => {
    if (Platform.OS === 'android') StatusBar.setBackgroundColor('#222');
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
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
      }}>
      <AppNavigation />
    </NavigationContainer>
  );
}
