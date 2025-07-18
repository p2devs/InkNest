import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Chip, List} from 'react-native-paper';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import Header from '../../Components/UIComp/Header';
import {NAVIGATION} from '../../Constants';
import {navigate} from '../../Navigation/NavigationService';
import {showRewardedAd} from '../../InkNest-Externals/Redux/Actions/Download';
import {SwtichBaseUrl, SwtichToAnime} from '../../Redux/Reducers';

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

export function Sources({navigation}) {
  const dispatch = useDispatch();
  const [SwitchServer, setSwitchServer] = useState(null);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const Anime = useSelector(state => state.data.Anime);
  const SwitchAnimeToggle = () => {
    dispatch(SwtichToAnime(!Anime));
    if (Anime) {
      crashlytics().log('Switched to Comic Mode');
      dispatch(SwtichBaseUrl('readcomicsonline'));
    }
    if (!Anime) {
      crashlytics().log('Switched to Anime Mode');
      dispatch(SwtichBaseUrl('s3taku'));
    }

    navigation.reset({
      index: 0,
      routes: [{name: NAVIGATION.home}],
    });

    showRewardedAd();
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          backgroundColor: '#222',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomColor: '#fff',
          borderBottomWidth: 0.5,
          marginBottom: 5,
        }}>
        <View style={{flexDirection: 'row', gap: 12}}>
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#FFF',
            }}>
            {'InkNest Sources'}
          </Text>
        </View>
      </Header>

      <TouchableOpacity
        onPress={() => {
          analytics.logEvent('open_manga', {
            item: 'Open_Manga',
          });
          showRewardedAd();
          navigate(NAVIGATION.homeManga);
        }}
        style={{
          backgroundColor: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: heightPercentageToDP('1%'),
        }}>
        <View style={{flexDirection: 'row'}}>
          <Entypo
            name="open-book"
            size={heightPercentageToDP('2.5%')}
            color="#000"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            Manga reader
          </Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={heightPercentageToDP('2.5%')}
          color="#000"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          analytics.logEvent('open_browser', {
            item: 'Open_Browser',
          });
          showRewardedAd();
          navigate(NAVIGATION.WebSourcesList);
        }}
        style={{
          backgroundColor: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: heightPercentageToDP('1%'),
        }}>
        <View style={{flexDirection: 'row'}}>
          <AntDesign
            name="earth"
            size={heightPercentageToDP('2.5%')}
            color="#000"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            Browser
            <Text
              style={{fontSize: heightPercentageToDP('1.3%'), color: 'purple'}}>
              {' '}
              (Beta)
            </Text>
          </Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={heightPercentageToDP('2.5%')}
          color="#000"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={SwitchAnimeToggle}
        style={{
          backgroundColor: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          paddingHorizontal: 10,
          borderRadius: 5,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: heightPercentageToDP('1%'),
        }}>
        <View style={{flexDirection: 'row'}}>
          <Entypo
            name={!Anime ? 'tv' : 'open-book'}
            size={heightPercentageToDP('2.5%')}
            color="#000"
            style={{marginRight: 10}}
          />
          <Text
            style={{
              fontSize: heightPercentageToDP('2%'),
              fontWeight: 'bold',
              color: '#000',
            }}>
            {!Anime ? 'Watch Anime' : 'Read Comics'}
          </Text>
        </View>
        <Feather
          name="arrow-up-right"
          size={heightPercentageToDP('2.5%')}
          color="#000"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>

      <Text
        style={{
          fontSize: heightPercentageToDP('2%'),
          fontWeight: 'bold',
          color: '#FFF',
          marginHorizontal: widthPercentageToDP('2%'),
          marginVertical: heightPercentageToDP('1%'),
          textAlign: 'center',
        }}>
        More Sources Coming Soon...
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
});
