import React, { useRef } from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationServices';
import { AppNavigation } from './appNavigation';

export function RootNavigation() {
  const routeNameRef = useRef<string | undefined>(undefined);

  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName) {
          console.log('Screen Name: ', currentRouteName);
        }
        routeNameRef.current = currentRouteName;
      }}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppNavigation />
    </NavigationContainer>
  );
}
