import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export function LocalComic() {
  return (
    <View style={styles.container}>
      <Text>LocalComic</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
