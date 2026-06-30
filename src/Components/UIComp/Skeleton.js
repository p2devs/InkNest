import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ContentLoader, { Rect } from 'react-content-loader/native';

const SkeletonLoader = () => {
  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={180}
        height={180}
        backgroundColor="#333"
        foregroundColor="#222"
      >
        <Rect x="0" y="0" rx="10" ry="10" width="180" height="180" />
      </ContentLoader>
      <View style={styles.textContainer}>
        <ContentLoader
          speed={1}
          width={180}
          height={40}
          backgroundColor="#333"
          foregroundColor="#222"
        >
          <Rect x="0" y="0" rx="4" ry="4" width="150" height="17" />
          <Rect x="0" y="25" rx="4" ry="4" width="90" height="15" />
        </ContentLoader>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    marginHorizontal: 5,
    width: 180,
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  textContainer: {
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});

export default SkeletonLoader;
