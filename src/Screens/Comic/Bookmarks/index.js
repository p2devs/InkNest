import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {Bookmarks} from './Bookmarks';

export function ComicBookmarks({navigation}) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
    backgroundColor: '#14142A',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#14142A',
    borderBottomWidth: 0.5,
    borderBottomColor: '#c8c7cc',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#007aff',
  },
});
