import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Bookmarks } from './Bookmarks';
import { ComicHistory } from './History';

const { width } = Dimensions.get('window');


export function ComicBookmarks({ navigation }) {

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.tabBarContainer}>
          <Text style={styles.tabText}>Bookmarks</Text>
        </View>
        <Bookmarks navigation={navigation} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#222',
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#007aff',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width / 2,
    height: 3,
    backgroundColor: '#007aff',
  },
});
