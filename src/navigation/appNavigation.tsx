import { createStackNavigator } from '@react-navigation/stack';

import { NAVIGATION } from '../constants';
import type { RootParamList } from '../constants';
import { ComicHome, MangaHome } from '../screens';
import { useContentNavigation } from '../zustand';

const Stack = createStackNavigator<RootParamList>();

export function AppNavigation() {
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
