import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigation} from './AppNavigation';
import {navigationRef} from './NavigationService';
import {PermissionsAndroid, Platform, StatusBar} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DownTime from '../Components/UIComp/DownTime';
import {ClearError} from '../Redux/Reducers';
import analytics from '@react-native-firebase/analytics';
import {useNetInfo} from '@react-native-community/netinfo';
import Network from '../Components/UIComp/Network';
import messaging from '@react-native-firebase/messaging';
import {firebase} from '@react-native-firebase/perf';
import crashlytics from '@react-native-firebase/crashlytics';
import {firebase as fire} from '@react-native-firebase/analytics';

export function RootNavigation() {
  const downTime = useSelector(state => state.data.downTime);
  const dispatch = useDispatch();
  const {type, isConnected} = useNetInfo();

  const routeNameRef = useRef();

  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (Platform.OS === 'android') {
      const PermissionAndroid = PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (PermissionAndroid === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Permission Granted');
      } else {
        console.log('Permission Denied');
      }
    }

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  async function AnalyticsEnabled() {
    await fire.analytics().setAnalyticsCollectionEnabled(true);
  }

  async function toggleCrashlytics() {
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  async function PerformanceMonitoring() {
    await firebase.perf().setPerformanceCollectionEnabled(true);
  }

  useEffect(() => {
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

  if (!isConnected) {
    return <Network />;
  }

  if (downTime) {
    return <DownTime />;
  }

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
