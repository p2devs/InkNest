import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigation} from './AppNavigation';
import {navigationRef} from './NavigationService';
import {Platform, StatusBar, AppState} from 'react-native';
import {useDispatch} from 'react-redux';
import {ClearError} from '../Redux/Reducers';
import {isMacOS} from '../Utils/PlatformUtils';

// Conditional imports for non-macOS platforms
let analytics, messaging, firebase, crashlytics, fire, inAppMessaging;
let check, request, PERMISSIONS, RESULTS, requestNotifications, checkNotifications;
let mobileAds, AdsConsent, AdsConsentStatus;

if (!isMacOS) {
  try {
    analytics = require('@react-native-firebase/analytics').default;
    messaging = require('@react-native-firebase/messaging').default;
    firebase = require('@react-native-firebase/perf').firebase;
    crashlytics = require('@react-native-firebase/crashlytics').default;
    fire = require('@react-native-firebase/analytics').firebase;
    inAppMessaging = require('@react-native-firebase/in-app-messaging').default;
    
    const permissions = require('react-native-permissions');
    check = permissions.check;
    request = permissions.request;
    PERMISSIONS = permissions.PERMISSIONS;
    RESULTS = permissions.RESULTS;
    requestNotifications = permissions.requestNotifications;
    checkNotifications = permissions.checkNotifications;
    
    const mobileAdsPackage = require('react-native-google-mobile-ads');
    mobileAds = mobileAdsPackage.default;
    AdsConsent = mobileAdsPackage.AdsConsent;
    AdsConsentStatus = mobileAdsPackage.AdsConsentStatus;
  } catch (error) {
    console.log('Some modules not available on this platform:', error.message);
  }
}

/**
 * RootNavigation component handles the main navigation logic for the application.
 * It sets up various configurations such as requesting user permissions, enabling analytics,
 * crashlytics, and performance monitoring. It also manages the navigation state and logs screen views.
 *
 * @function RootNavigation
 * @returns {JSX.Element} The navigation container with the app's navigation structure.
 */
export function RootNavigation() {
  const dispatch = useDispatch();
  const routeNameRef = useRef();
  const [appState, setAppState] = useState(AppState.currentState);

  // Add this useEffect to track app state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
      if (!isMacOS && crashlytics) {
        crashlytics().setAttribute('app_state', nextAppState);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Request user permission for notifications on Android and iOS devices
  async function requestUserPermission() {
    if (isMacOS) return; // Skip on macOS
    
    if (crashlytics) crashlytics().log('Requesting the notification permission.');
    if (checkNotifications) checkNotifications();
    if (requestNotifications) requestNotifications(['alert', 'sound']);
    FCMPushNotification();
  }

  // FCM Push Notification for Android and iOS devices using Firebase Cloud Messaging
  async function FCMPushNotification() {
    if (isMacOS || !messaging) return; // Skip on macOS
    
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
   */
  async function allowToReceiveInAppMessages() {
    if (isMacOS || !inAppMessaging) return; // Skip on macOS
    await inAppMessaging().setMessagesDisplaySuppressed(false);
  }

  /**
   * Enables analytics collection for the application.
   */
  async function AnalyticsEnabled() {
    if (isMacOS || !fire) return; // Skip on macOS
    await fire.analytics().setAnalyticsCollectionEnabled(true);
  }

  /**
   * Enables Crashlytics collection.
   */
  async function toggleCrashlytics() {
    if (isMacOS || !crashlytics) return; // Skip on macOS
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  /**
   * Enables performance monitoring collection in the Firebase application.
   */
  async function PerformanceMonitoring() {
    if (isMacOS || !firebase) return; // Skip on macOS
    await firebase.perf().setPerformanceCollectionEnabled(true);
  }

  // Request user consent for personalized ads from Google Mobile Ads SDK
  useEffect(() => {
    if (isMacOS || !AdsConsent) return; // Skip on macOS
    
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
    if (isMacOS || !AdsConsent || !mobileAds) return; // Skip on macOS
    
    const consentInfo = await AdsConsent.getConsentInfo();
    let useNonPersonalizedAds = !consentInfo.canRequestAds;

    // If ATT is denied, use non-personalized ads
    const gdprApplies = await AdsConsent.getGdprApplies();
    if (gdprApplies) {
      if (Platform.OS === 'ios') {
        await AdsConsent.requestTrackingAuthorization();
      }
      const status = await AdsConsent.getStatus();
      if (status === AdsConsentStatus.UNKNOWN) {
        useNonPersonalizedAds = true; // Use non-personalized if consent is unknown
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
    if (!isMacOS) {
      allowToReceiveInAppMessages();
      requestUserPermission();
      if (!__DEV__) {
        PerformanceMonitoring();
        toggleCrashlytics();
        AnalyticsEnabled();
      }
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
          if (!isMacOS && analytics) {
            await analytics.logScreenView({
              screen_name: currentRouteName,
              screen_class: currentRouteName,
            });
          }
          console.log('Screen Name: ', currentRouteName);
        }
        routeNameRef.current = currentRouteName;

        // Add more context to crashes
        if (!isMacOS && crashlytics) {
          crashlytics().setAttribute('current_screen', currentRouteName);
          crashlytics().setAttribute('app_state', JSON.stringify(appState));
        }
      }}>
      <AppNavigation />
    </NavigationContainer>
  );
}