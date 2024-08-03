import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Bookmarks } from './Bookmarks';
import { ComicHistory } from './History';

const { width } = Dimensions.get('window');

const TabBar = ({ setIndex }) => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          setIndex(0);
          translateX.value = withTiming(0, { duration: 200 });
        }}
      >
        <Text style={styles.tabText}>Bookmarks</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => {
          setIndex(1);
          translateX.value = withTiming(width / 2, { duration: 200 });
        }}
      >
        <Text style={styles.tabText}>History</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.indicator, animatedStyle]} />
    </View>
  );
};

export function ComicBookmarks({ navigation }) {
  const [index, setIndex] = useState(0);

  const renderScreen = () => {
    switch (index) {
      case 0:
        return <Bookmarks navigation={navigation} />;
      case 1:
        return <ComicHistory navigation={navigation} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
      <View style={styles.container}>
        <TabBar setIndex={setIndex} />
        {renderScreen()}
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
