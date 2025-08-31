import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useContentNavigation } from '../index';
import { NAVIGATION } from '../../constants';
import type { RootParamList } from '../../constants';
import { ComicHome, MangaHome } from '../../screens';

const Stack = createStackNavigator<RootParamList>();

/**
 * Example of how to integrate the navigation store with React Navigation
 * This component will render different home screens based on the selected content type
 */
export function ContentAwareNavigation() {
  const { isComicSelected } = useContentNavigation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name={NAVIGATION.home} 
        component={isComicSelected ? ComicHome : MangaHome} 
      />
    </Stack.Navigator>
  );
}

/**
 * Alternative approach: Separate navigators for each content type
 */
export function SeparateContentNavigators() {
  const { isComicSelected } = useContentNavigation();

  if (isComicSelected) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={NAVIGATION.home} component={ComicHome} />
        {/* Add more comic-specific screens here */}
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={NAVIGATION.home} component={MangaHome} />
      {/* Add more manga-specific screens here */}
    </Stack.Navigator>
  );
}
