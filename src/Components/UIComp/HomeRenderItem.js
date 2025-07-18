import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { navigate } from '../../Navigation/NavigationService';
import { NAVIGATION } from '../../Constants';
import Image from './Image';
import { useSelector } from 'react-redux';

import { isMacOS } from '../../Utils/PlatformUtils';

// Conditional imports for Firebase
let analytics = { logEvent: () => Promise.resolve() };
let crashlytics = { log: () => {}, recordError: () => {}, setAttribute: () => {}, setUserId: () => {} };
let messaging = { onMessage: () => {}, getToken: () => Promise.resolve('') };
let perf = { newTrace: () => ({ start: () => {}, stop: () => {} }) };
let inAppMessaging = { setAutomaticDataCollectionEnabled: () => {} };

if (!isMacOS) {
  try {
    analytics = require('@react-native-firebase/analytics').default;
    crashlytics = require('@react-native-firebase/crashlytics').default;
    messaging = require('@react-native-firebase/messaging').default;
    perf = require('@react-native-firebase/perf').default;
    inAppMessaging = require('@react-native-firebase/in-app-messaging').default;
  } catch (error) {
    console.log('Firebase modules not available on this platform');
  }
}

const HomeRenderItem = ({ item, index, Showhistory, search = false }) => {
  let Tag = View;
  const [showItem, setShowItem] = useState(true);
  const isAnime = useSelector(state => state?.data?.Anime);
  if (!showItem) return null;
  return (
    <View
      key={index}
      style={{
        flex: 1,
        alignItems: 'center',
      }}>
      <TouchableOpacity
        style={{
          marginVertical: 5,
          marginHorizontal: 5,
          width: 180,
          height: 180,
          borderRadius: 10,
          flexWrap: 'wrap',
        }}
        onPress={async () => {
          if (isAnime) {
            crashlytics().log('User click on the Anime.');

            const navigationTarget = search
              ? NAVIGATION.animeDetails
              : NAVIGATION.animeVideo;

            await crashlytics().setAttributes({
              link: item?.link?.toString(),
              title: item?.title?.toString(),
              imageUrl: item?.imageUrl?.toString(),
              navigationPage: navigationTarget?.toString(),
            });

            await analytics.logEvent('open_anime', {
              link: item.link?.toString(),
              title: item.title?.toString(),
              imageUrl: item.imageUrl?.toString(),
            });

            navigate(navigationTarget, {
              link: item.link,
              title: item.title,
              imageUrl: item.imageUrl,
            });

            return;
          }

          crashlytics().log('User click on the Comic.');

          await crashlytics().setAttributes({
            link: item?.link?.toString(),
            search: Showhistory?.toString(),
            PageUrl: item?.link?.toString(),
            navigationPage: NAVIGATION?.comicDetails?.toString(),
          });

          await analytics.logEvent('open_comic', {
            link: item.link?.toString(),
            home: !Showhistory?.toString(),
            search: Showhistory?.toString(),
            PageUrl: item.link?.toString(),
            title: item.title?.toString(),
          });
          navigate(NAVIGATION.comicDetails, { ...item });

          // navigate(NAVIGATION.comicDetails, {
          //   link: item.link,
          //   home: !Showhistory,
          //   search: Showhistory,
          //   PageUrl: item.link,
          // });
        }}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 180,
            height: 180,
          }}
          onFailer={() => {
            // console.log('Image Load Failed', item.imageUrl);
            setShowItem(false);
          }}
        />
        <Tag
          intensity={10}
          tint="light"
          style={[
            {
              padding: 10,
              justifyContent: 'space-between',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              minHeight: '20%',
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
          ]}>
          <Text
            style={{ color: 'white', fontWeight: '700', fontSize: 14 }}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ color: 'white', width: '80%' }} numberOfLines={1}>
            {item?.episode
              ? item?.episode
              : item?.genres
                ? item?.genres.join(',')
                : item.date}
          </Text>
          {/* {
            //create a progress bar
            !item?.Progress ? null : (
              <View
                style={{
                  height: 5,
                  width: '100%',
                  backgroundColor: 'black',
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginTop: 5,
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${item.Progress}%`,
                    backgroundColor: 'gray',
                  }}
                />
              </View>
            )
          } */}
        </Tag>
      </TouchableOpacity>
    </View>
  );
};

export default HomeRenderItem;
