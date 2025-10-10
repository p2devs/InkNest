import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {NAVIGATION} from '../Constants';
import {AboutUs, Search} from '../Screens';
import {BottomNavigation} from './BottomNavigation';
import UpdateScreen from '../Screens/Update';
import {
  ComicBook,
  ComicBookmarks,
  ComicDetails,
  DownloadComicBook,
  MockBooks,
  SeeAll,
} from '../Screens/Comic';
import {
  MangaBook,
  MangaDetails,
  MangaHome,
  MangaSearch,
  MangaViewAll,
} from '../InkNest-Externals/Screens/Manga';
import WebViewScreen from '../InkNest-Externals/Screens/Webview/WebViewScreen';
import WebSearchScreen from '../InkNest-Externals/Screens/Webview/WebSearchScreen';

const Stack = createNativeStackNavigator();

/**
 * AppNavigation component sets up the navigation stack for the application.
 * It uses a Stack Navigator to define the different screens and their respective components.
 *
 * @returns {JSX.Element} The Stack Navigator with defined screens and options.
 */
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
      <Stack.Screen name={NAVIGATION.mangaDetails} component={MangaDetails} />
      <Stack.Screen name={NAVIGATION.mangaBook} component={MangaBook} />
      <Stack.Screen name={NAVIGATION.homeManga} component={MangaHome} />
      <Stack.Screen name={NAVIGATION.mangaViewAll} component={MangaViewAll} />
      <Stack.Screen name={NAVIGATION.mangaSearch} component={MangaSearch} />
      <Stack.Screen name={NAVIGATION.search} component={Search} />
      <Stack.Screen name={NAVIGATION.seeAll} component={SeeAll} />
      <Stack.Screen name={NAVIGATION.WebSources} component={WebViewScreen} />
      <Stack.Screen name={NAVIGATION.WebSearch} component={WebSearchScreen} />
      <Stack.Screen name={NAVIGATION.mockBooks} component={MockBooks} />
      <Stack.Screen
        name={NAVIGATION.downloadComicBook}
        component={DownloadComicBook}
      />
      <Stack.Screen name={NAVIGATION.bookmarks} component={ComicBookmarks} />
    </Stack.Navigator>
  );
}
