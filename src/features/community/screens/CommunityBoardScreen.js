import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import CommunityTab from './CommunityTab';

const CommunityBoardScreen = ({navigation}) => {
  const heroHeader = (
    <View style={styles.heroWrapper}>
      <Text style={styles.heroEyebrow}>Global Community</Text>
      <Text style={styles.heroTitle}>See what everyone is discussing</Text>
      <Text style={styles.heroSubtitle}>
        Browse every post across InkNest, or filter down by series and tags.
      </Text>
    </View>
  );

  return (
    <CommunityTab
      navigation={navigation}
      comicLink={null}
      headerComponent={heroHeader}
    />
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default CommunityBoardScreen;
