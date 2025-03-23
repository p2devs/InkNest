import React from 'react';
import {View, Text, StyleSheet, Linking} from 'react-native';
import {Banner} from 'react-native-paper';
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
    <Banner
      visible={bannerStates.animeBanner}
      actions={[
        {
          label: 'Stream Now',
          onPress: handleStreamNow,
        },
      ]}
      icon={({size}) => (
        <Image
          source={{
            uri: 'https://github.com/p2devs/Anizuno/blob/main/.github/readme-images/icon.png?raw=true',
          }}
          style={{
            width: size,
            height: size,
          }}
        />
      )}>
      <View style={styles.container}>
        <Text style={styles.text}>
          ✨ Watch Anime Anytime, Anywhere with Anizuno! ✨
        </Text>
        <Text style={styles.text}>
          🚀 Our brand-new app is now live! Dive into a world of your favorite
          anime series and
        </Text>
        <Text style={styles.text}>
          movies with Anizuno– your ultimate streaming destination.
        </Text>
      </View>
    </Banner>
  );
};

export default AnimeAdbanner;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 2,
  },
  text: {
    fontSize: 12,
  },
});
