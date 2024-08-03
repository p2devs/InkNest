import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Feather from 'react-native-vector-icons/Feather';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Search, Settings } from '../Screens';
import { NAVIGATION } from '../Constants';
import { useSelector } from 'react-redux';
import { AnimeBookmarks, AnimeHome } from '../Screens/Anime';
import { ComicBookmarks, Home, LocalComic } from '../Screens/Comic';
import { View, StyleSheet } from 'react-native';
import DownTime from '../Components/UIComp/DownTime';

const BottomTab = createBottomTabNavigator();

const TabBarIcon = props => {
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
  } else if (props.name === 'reader') {
    return (
      <Ionicons
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
  const downTime = useSelector(state => state.data.downTime);

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
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
        component={downTime ? DownTime : animeActive ? AnimeHome : Home}
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
      {animeActive ? null :
        <BottomTab.Screen
          name={NAVIGATION.localComic}
          component={LocalComic}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon focused={focused} tintColor={color} name="reader" />
            ),
          }}
        />}

      <BottomTab.Screen
        name={NAVIGATION.bookmarks}
        component={animeActive ? AnimeBookmarks : ComicBookmarks}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              tintColor={color}
              name="book-bookmark"
            />
          ),
        }}
      />


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
