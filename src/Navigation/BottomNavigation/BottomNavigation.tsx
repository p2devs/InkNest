import React from 'react';
import {
  AnimatedTabBarNavigator,
  DotSize,
  TabElementDisplayOptions,
} from './Components/index';

import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { Bookmarks, Search, Settings } from '../../Screens';
import { NAVIGATION } from '../../Constants';
import { useSelector } from 'react-redux';
import { AnimeHome } from '../../Screens/Anime';
import { Home } from '../../Screens/Comic';

const BottomTab = AnimatedTabBarNavigator();

const TabBarIcon = (props: any) => {
  if (props.name === 'home') {
    return (
      <Feather
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  } else if (props.name === 'search') {
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
  } else if (props.name === 'settings') {
    return (
      <Feather
        name={props.name}
        size={props.size ? props.size : 24}
        color={props.tintColor}
      />
    );
  }
};

export function BottomNavigation() {
  const animeActive = useSelector(state => state?.data?.Anime);
  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      tabBarOptions={{
        activeTintColor: '#000',
        inactiveTintColor: '#FFF',
        activeBackgroundColor: '#80ffdb',
        tabStyle: {
          backgroundColor: '#03045e',
        },
      }}
      appearance={{
        shadow: true,
        floating: true,
        whenActiveShow: TabElementDisplayOptions.ICON_ONLY,
        dotSize: DotSize.SMALL,
      }}>
      <BottomTab.Screen
        name={NAVIGATION.home}
        component={animeActive ? AnimeHome : Home}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} tintColor={color} name="home" />
          ),
        }}
      />

      <BottomTab.Screen
        name={NAVIGATION.search}
        component={Search}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} tintColor={color} name="search" />
          ),
        }}
      />

      {animeActive ? null : <BottomTab.Screen
        name={NAVIGATION.bookmarks}
        component={Bookmarks}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              tintColor={color}
              name="book-bookmark"
            />
          ),
        }}
      />}

      <BottomTab.Screen
        name={NAVIGATION.settings}
        component={Settings}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon focused={focused} tintColor={color} name="settings" />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}
