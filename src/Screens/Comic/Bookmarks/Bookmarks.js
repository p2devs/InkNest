import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {heightPercentageToDP} from 'react-native-responsive-screen';

import {updateData} from '../../../Redux/Reducers';
import Image from '../../../Components/UIComp/Image';
import {NAVIGATION} from '../../../Constants';

import { isMacOS } from '../../../Utils/PlatformUtils';

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

export function Bookmarks({navigation}) {
  const dispatch = useDispatch();
  const data = useSelector(state => state.data.dataByUrl);
  //filter the data to get only the bookmarks data is an object
  const bookmarks = Object.values(data).filter(item => item.Bookmark);
  //write funcation get the key from data by title
  const getKey = title => {
    return Object.keys(data).find(key => data[key].title === title);
  };

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      data={bookmarks}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({item}) => {
        return (
          <TouchableOpacity
            onPress={async () => {
              crashlytics().log('Comic Bookmark clicked');
              analytics.logEvent('Comic_Bookmark_clicked', {
                title: item?.title?.toString(),
                link: getKey(item.title)?.toString(),
              });
              navigation.navigate(NAVIGATION.comicDetails, {
                title: item.title,
                image: item.imgSrc,
                link: getKey(item.title),
              });
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 10,
              borderBottomColor: '#fff',
              borderBottomWidth: 0.5,
            }}>
            <Image source={{uri: item?.imgSrc}} style={styles.image} />
            <View
              style={{
                width: Dimensions.get('window').width - 150,
                alignItems: 'flex-start',
                paddingHorizontal: 10,
                gap: 8,
              }}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.text}>
                <Text>Genres:</Text> {item?.genres}
              </Text>
              <Text style={styles.text}>
                <Text>Publisher:</Text> {item?.publisher}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                crashlytics().log('Comic Bookmark removed');
                analytics.logEvent('Comic_Bookmark_removed', {
                  url: getKey(item.title)?.toString(),
                });
                dispatch(
                  updateData({
                    url: getKey(item.title),
                    data: {Bookmark: false},
                  }),
                );
              }}>
              <FontAwesome6 name="book-bookmark" size={24} color={'yellow'} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={() => (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            height: heightPercentageToDP('80%'),
          }}>
          <MaterialCommunityIcons
            name="comment-bookmark-outline"
            size={heightPercentageToDP('10%')}
            color="gold"
          />
          <Text style={[styles.title, {marginTop: 12}]}>
            No Bookmarks Found
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  image: {
    width: 90,
    height: 120,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
});
