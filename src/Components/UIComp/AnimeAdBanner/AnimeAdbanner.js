import React from 'react';
import {View, Text, StyleSheet, Linking, TouchableOpacity} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import {useBannerContext} from './BannerContext';
import Image from '../Image';

const AnimeAdbanner = () => {
  const {bannerStates, updateBannerVisibility} = useBannerContext();

  const handleStreamNow = () => {
    crashlytics().log('Anime Banner Open button clicked');
    analytics().logEvent('anime_banner_open');
    Linking.openURL('https://p2devs.github.io/Anizuno/');
    updateBannerVisibility('animeBanner', false);
  };

  return (
    <TouchableOpacity
      onPress={() => {
        crashlytics().log('Anime Banner clicked');
        analytics().logEvent('anime_banner_clicked');
        handleStreamNow();
      }}
      style={{
        backgroundColor: '#1F1F1F',
        paddingHorizontal: 20,
        display: bannerStates.animeBanner ? 'flex' : 'none',
        paddingVertical: 10,
        marginVertical: 10,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Image
          source={{
            uri: 'https://github.com/p2devs/Anizuno/blob/main/.github/readme-images/icon.png?raw=true',
          }}
          style={{
            width: 20,
            height: 20,
          }}
        />
        <Text style={styles.text}>
          ✨ Watch Anime Anytime, Anywhere with Anizuno! ✨
        </Text>
      </View>
      <Text
        style={{
          fontSize: 12,
          color: '#FFFFFF',
          textDecorationLine: 'underline',
          marginLeft: 10,
          textAlign: 'right',
        }}>
        Stream Now
      </Text>
    </TouchableOpacity>
  );
};

export default AnimeAdbanner;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  text: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
