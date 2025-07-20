import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {isMacOS} from '../Utils/PlatformUtils';

import {
  House,
  BookMarked,
  Settings as SettingsIcon,
  FolderDown,
  FolderGit2,
} from 'lucide-react-native';

import {Settings} from '../Screens';
import {NAVIGATION} from '../Constants';
import {useSelector} from 'react-redux';
import {ComicBookmarks, Home, OfflineComic} from '../Screens/Comic';
import {View, StyleSheet} from 'react-native';
import {useFeatureFlag} from 'configcat-react';
import LinkListScreen from '../InkNest-Externals/Screens/Webview/LinkListScreen';
import FloatingDonationButton from '../InkNest-Externals/Donation/FloatingDonationButton';

// Conditional import for device info
let getVersion;
if (!isMacOS) {
  try {
    getVersion = require('react-native-device-info').getVersion;
  } catch (error) {
    console.log(
      'react-native-device-info not available on this platform:',
      error.message,
    );
    // Fallback function for macOS
    getVersion = () => '1.0.0';
  }
} else {
  // Fallback function for macOS
  getVersion = () => '1.0.0';
}

const BottomTab = createBottomTabNavigator();

/**
 * TabBarIcon component renders an icon based on the provided name prop.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.name - The name of the icon to render.
 * @param {number} [props.size=24] - The size of the icon.
 * @param {string} props.tintColor - The color of the icon.
 * @returns {JSX.Element} The icon component.
 */
const TabBarIcon = props => {
  if (props.name === 'home') {
    return (
      <House size={props.size ? props.size : 24} color={props.tintColor} />
    );
  } else if (props.name === 'book-bookmark') {
    return (
      <BookMarked size={props.size ? props.size : 24} color={props.tintColor} />
    );
  } else if (props.name === 'download-for-offline') {
    return (
      <FolderDown size={props.size ? props.size : 24} color={props.tintColor} />
    );
  } else if (props.name === 'settings') {
    return (
      <SettingsIcon
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'source') {
    return (
      <FolderGit2 size={props.size ? props.size : 24} color={props.tintColor} />
    );
  }
};

/**
 * BottomNavigation component renders the bottom tab navigator with different screens.
 * It uses Redux state to conditionally render components based on the state values.
 *
 * @returns {JSX.Element} The BottomTab.Navigator component with configured screens.
 */
export function BottomNavigation() {
  const downTime = useSelector(state => state.data.downTime);
  const {value: forIosValue} = useFeatureFlag('forIos', 'Default');

  return (
    <>
      <BottomTab.Navigator
        screenOptions={{
          tabBarBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#110918',
                },
              ]}
            />
          ),
          headerShown: false,
          tabBarActiveTintColor: '#D2D2D6',
          tabBarInactiveTintColor: '#6B666D',
          tabBarStyle: {
            paddingVertical: 4,
          },
        }}
        appearance={{
          shadow: true,
          floating: true,
        }}>
        <BottomTab.Screen
          name={NAVIGATION.home}
          component={Home}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon focused={focused} tintColor={color} name="home" />
            ),
          }}
        />

        <BottomTab.Screen
          name={NAVIGATION.bookmarks}
          component={ComicBookmarks}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon
                focused={focused}
                tintColor={color}
                name="book-bookmark"
              />
            ),
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.sources}
            component={LinkListScreen}
            options={{
              tabBarIcon: ({focused, color}) => (
                <TabBarIcon focused={focused} tintColor={color} name="source" />
              ),
              // tabBarBadge: 1,
              // tabBarBadgeStyle: {
              //   maxWidth: 10,
              //   maxHeight: 10,
              //   fontSize: 5,
              //   lineHeight: 9,
              //   alignSelf: undefined,
              // },
            }}
          />
        )}

        <BottomTab.Screen
          name={NAVIGATION.offlineComic}
          component={OfflineComic}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon
                focused={focused}
                tintColor={color}
                name="download-for-offline"
              />
            ),
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.settings}
            component={Settings}
            options={{
              tabBarIcon: ({focused, color}) => (
                <TabBarIcon
                  focused={focused}
                  tintColor={color}
                  name="settings"
                />
              ),
            }}
          />
        )}
      </BottomTab.Navigator>
      <FloatingDonationButton />
    </>
  );
}
