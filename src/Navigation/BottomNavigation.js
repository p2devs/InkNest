import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getVersion } from 'react-native-device-info';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { Settings } from '../Screens';
import { NAVIGATION } from '../Constants';
import { Home, OfflineComic, Library } from '../Screens/Comic';
import { View, StyleSheet } from 'react-native';
import { useFeatureFlag } from 'configcat-react';
import LinkListScreen from '../InkNest-Externals/Screens/Webview/LinkListScreen';
import FloatingDonationButton from '../InkNest-Externals/Donation/FloatingDonationButton';
import CommunityBoardScreen from '../InkNest-Externals/Community/Screens/CommunityBoardScreen';

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
      <Feather
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'library') {
    return (
      <Ionicons
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'download-for-offline') {
    return (
      <MaterialIcons
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'settings') {
    return (
      <Feather
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'community') {
    return (
      <Ionicons
        name="chatbubbles-outline"
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'source') {
    return (
      <MaterialIcons
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
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
  const { value: forIosValue } = useFeatureFlag('forIos', 'Default');

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
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} tintColor={color} name="home" />
            ),
          }}
        />

        <BottomTab.Screen
          name={NAVIGATION.Library}
          component={Library}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} tintColor={color} name="library" />
            ),
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.sources}
            component={LinkListScreen}
            options={{
              tabBarIcon: ({ focused, color }) => (
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
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                focused={focused}
                tintColor={color}
                name="download-for-offline"
              />
            ),
          }}
        />

        <BottomTab.Screen
          name={NAVIGATION.communityBoard}
          component={CommunityBoardScreen}
          options={{
            tabBarLabel: 'Community',
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                focused={focused}
                tintColor={color}
                name="community"
              />
            ),
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.settings}
            component={Settings}
            options={{
              tabBarIcon: ({ focused, color }) => (
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
      {getVersion() !== forIosValue && <FloatingDonationButton />}
    </>
  );
}
