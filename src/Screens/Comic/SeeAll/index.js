import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import Card from '../Components/Card';
import {getComics} from '../APIs/Home';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Toast from 'react-native-toast-message';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import AdBanner from '../../../InkNest-Externals/Ads/BannerAds';
import {BannerAdSize} from 'react-native-google-mobile-ads';
import {NAVIGATION} from '../../../Constants';

export function SeeAll({navigation, route}) {
  const {title, data, key, hostName, lastPage} = route.params;
  const [comicsData, setComicsData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchComics = async (page = 1) => {
    if (lastPage && page > lastPage) return;
    if (page < 1) return;

    setLoading(true);

    const type = key === 'readallcomics' ? null : key;

    const response = await getComics(hostName, page, type);

    if (response) {
      setPage(page);
      setComicsData(response?.comicsData);
      setLoading(false);
      return;
    }
    return Toast.show({
      type: 'error',
      text1: 'Oops! Something went wrong',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: heightPercentageToDP('4%'),
          backgroundColor: 'transparent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomWidth: 0,
          marginBottom: 24,
        }}>
        <TouchableOpacity
          onPress={() => {
            goBack();
          }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
            style={{marginRight: 10, opacity: 0.9}}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#fff',
            opacity: 0.9,
          }}>
          {title ?? 'Comics'}
        </Text>

        <View style={{flex: 0.15}} />
      </Header>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={comicsData}
          renderItem={({item, index}) => (
            <Card
              item={item}
              index={index}
              onPress={() => {
                crashlytics().log('See All Comics Card clicked');
                analytics().logEvent('see_all_comics_card_clicked', {
                  key: key?.toString(),
                  title: title?.toString(),
                  isComicBookLink: key === 'readallcomics',
                  link: item?.link?.toString(),
                });
                navigation.navigate(NAVIGATION.comicDetails, {
                  ...item,
                  isComicBookLink: key === 'readallcomics',
                });
              }}
              containerStyle={{
                width: widthPercentageToDP('44%'),
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          ItemSeparatorComponent={
            <AdBanner size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          }
          numColumns={2}
          ListFooterComponent={
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginVertical: heightPercentageToDP('2%'),
                marginBottom: heightPercentageToDP('12%'),
              }}>
              <Button
                title="Previous"
                color={page == 1 ? 'silver' : '#007AFF'}
                onPress={() => {
                  if (page > 1) {
                    crashlytics().log('See All Comics Previous Button clicked');
                    analytics().logEvent(
                      'see_all_comics_previous_button_clicked',
                      {
                        page: page?.toString(),
                        lastPage: lastPage?.toString(),
                      },
                    );
                    fetchComics(page - 1);
                  }
                }}
              />
              <Text
                onPress={() => {
                  fetchComics(lastPage);
                }}
                style={{
                  color: 'white',
                }}>
                {page} {lastPage ? 'of' : ''} {lastPage}
              </Text>

              <Button
                title="Next"
                color={lastPage && page == lastPage ? 'silver' : '#007AFF'}
                onPress={() => {
                  crashlytics().log('See All Comics Next Button clicked');
                  analytics().logEvent('see_all_comics_next_button', {
                    page: page?.toString(),
                    lastPage: lastPage?.toString(),
                  });
                  fetchComics(page + 1);
                }}
              />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    paddingHorizontal: 16,
  },
  rectangle: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  searchPeopleBy: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    opacity: 0.3,
  },
});
