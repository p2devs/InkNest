import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useContentNavigation } from '../../../zustand';

export function Home({}) {
  const { selectManga, currentLabel } = useContentNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{currentLabel} Home Screen</Text>
      <Button title="Go to Manga" onPress={selectManga} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
