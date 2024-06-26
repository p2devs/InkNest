import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NAVIGATION } from '../Constants';
import { AboutUs, ComicBook, ComicDetails } from '../Screens';
import { BottomNavigation } from './BottomNavigation/BottomNavigation';
import UpdateScreen from '../Screens/Update';
import AnimeVideo from '../Screens/AnimeVideo';

const Stack = createNativeStackNavigator();

export function AppNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name={NAVIGATION.bottomNavigation}
        component={BottomNavigation}
      />
      <Stack.Screen name={NAVIGATION.comicDetails} component={ComicDetails} />
      <Stack.Screen name={NAVIGATION.comicBook} component={ComicBook} />
      <Stack.Screen name={NAVIGATION.aboutUs} component={AboutUs} />
      <Stack.Screen name={NAVIGATION.update} component={UpdateScreen} />
      <Stack.Screen name={NAVIGATION.animeVideo} component={AnimeVideo} />
    </Stack.Navigator>
  );
}
