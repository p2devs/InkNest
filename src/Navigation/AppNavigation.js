import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {NAVIGATION} from '../Constants';
import {AboutUs} from '../Screens';
import {BottomNavigation} from './BottomNavigation/BottomNavigation';
import UpdateScreen from '../Screens/Update';
import AnimeVideo from '../Screens/Anime/Video';
import {useSelector} from 'react-redux';
import {Details} from '../Screens/Anime';
import {ComicBook, ComicDetails, Home} from '../Screens/Comic';

const Stack = createNativeStackNavigator();

export function AppNavigation() {
  const animeActive = useSelector(state => state?.data?.Anime);
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
      <Stack.Screen name={NAVIGATION.animeDetails} component={Details} />
      {animeActive ? (
        <Stack.Screen name={NAVIGATION.moreDetails} component={Home} />
      ) : null}
    </Stack.Navigator>
  );
}
