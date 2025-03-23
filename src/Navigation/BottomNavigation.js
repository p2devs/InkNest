import React, {useEffect, useState} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getVersion, getBuildNumber} from 'react-native-device-info';

import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {Settings, Sources} from '../Screens';
import {NAVIGATION} from '../Constants';
import {useSelector} from 'react-redux';
import {ComicBookmarks, Home, OfflineComic} from '../Screens/Comic';
import {View, StyleSheet} from 'react-native';
import DownTime from '../Components/UIComp/DownTime';
import {useFeatureFlag} from 'configcat-react';
import LinkListScreen from '../InkNest-Externals/Screens/Webview/LinkListScreen';

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
  } else if (props.name === 'book-bookmark') {
    return (
      <FontAwesome6
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
  const downTime = useSelector(state => state.data.downTime);
  const {value: forIosValue} = useFeatureFlag('forIos', 'Default');

  return (
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
      {getVersion() !== forIosValue && (
        <BottomTab.Screen
          name={NAVIGATION.sources}
          component={LinkListScreen}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon focused={focused} tintColor={color} name="source" />
            ),
            tabBarBadge: 1,
            tabBarBadgeStyle: {
              maxWidth: 10,
              maxHeight: 10,
              fontSize: 5,
              lineHeight: 9,
              alignSelf: undefined,
            },
          }}
        />
      )}

      <BottomTab.Screen
        name={NAVIGATION.home}
        component={downTime ? DownTime : Home}
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
              <TabBarIcon focused={focused} tintColor={color} name="settings" />
            ),
          }}
        />
      )}
    </BottomTab.Navigator>
  );
}
