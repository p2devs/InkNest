import React, {useLayoutEffect, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {AppNavigation} from './AppNavigation';
import {navigationRef} from './NavigationService';
import {Platform, StatusBar} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DownTime from '../Components/UIComp/DownTime';
import {ClearError} from '../Redux/Reducers';
import analytics from '@react-native-firebase/analytics';
import {useNetInfo} from '@react-native-community/netinfo';
import Network from '../Components/UIComp/Network';

export function RootNavigation() {
  const downTime = useSelector(state => state.data.downTime);
  const dispatch = useDispatch();
  const {type, isConnected} = useNetInfo();

  const routeNameRef = useRef();

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
