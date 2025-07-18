import React from 'react';
import {View, Text, StyleSheet, Linking, TouchableOpacity} from 'react-native';
import {isMacOS} from '../../../Utils/PlatformUtils';

let crashlytics, analytics;
try {
  if (!isMacOS) {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    analytics = require('@react-native-firebase/analytics').default;
  }
} catch (error) {
  console.log('Firebase modules not available on this platform');
}

import {useBannerContext} from './BannerContext';
import Image from '../Image';

const AnimeAdbanner = () => {
  const {bannerStates, updateBannerVisibility} = useBannerContext();

  const handleStreamNow = () => {
    if (!isMacOS && crashlytics) {
      crashlytics().log('Anime Banner Open button clicked');
    }
    if (!isMacOS && analytics) {
      analytics.logEvent('anime_banner_open');
    }
    Linking.openURL('https://p2devs.github.io/Anizuno/');
    updateBannerVisibility('animeBanner', false);
  };

  return (
    <TouchableOpacity
      onPress={() => {
        if (!isMacOS && crashlytics) {
          crashlytics().log('Anime Banner clicked');
        }
        if (!isMacOS && analytics) {
          analytics.logEvent('anime_banner_clicked');
        }
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
