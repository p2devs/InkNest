import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const DownTime = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Server is down for maintenance</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
});

export default DownTime;
