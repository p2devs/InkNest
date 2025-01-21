import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import {NAVIGATION} from '../../../Constants';
import {useSelector} from 'react-redux';
import {getComicsHome} from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';
import Card from '../Components/Card';
import {AppendAd} from '../../../Components/Ads/AppendAd';

export function Home({navigation}) {
  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const History = useSelector(state => state.data.history);

  useEffect(() => {
    getComicsHome(setComicsData, setLoading);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.rectangle}
          onPress={() => {
            crashlytics().log('Home Search button clicked');
            navigation.navigate(NAVIGATION.search);
          }}>
          <AntDesign name="search1" size={20} color="#fff" />
          <Text style={styles.searchPeopleBy}>Search here</Text>
        </TouchableOpacity>
        {!Object.values(History).length ? null : (
          <View style={styles.gameDetailsParent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: '#fff',
                  textAlign: 'left',
                  opacity: 0.9,
                }}>
                Continue Reading
              </Text>
            </View>

            <FlatList
              data={Object.values(History).sort(
                (a, b) => b.lastOpenAt - a.lastOpenAt,
              )}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (
                <HistoryCard item={item} index={index} key={index} />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          Object.keys(comicsData).map((key, index) => (
            <View key={index} style={styles.gameDetailsParent}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  {comicsData?.[key]?.title}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    crashlytics().log('See All (Home) button clicked');
                    analytics().logEvent('see_all_button_clicked', {
                      key: key?.toString(),
                      title: comicsData?.[key]?.title?.toString(),
                      data: comicsData?.[key]?.data?.toString(),
                      lastPage: comicsData?.[key]?.lastPage?.toString(),
                      hostName: comicsData?.[key]?.hostName?.toString(),
                    });
                    navigation.navigate(NAVIGATION.seeAll, {
                      key,
                      title: comicsData?.[key]?.title,
                      data: comicsData?.[key]?.data,
                      lastPage: comicsData?.[key]?.lastPage,
                      hostName: comicsData?.[key]?.hostName,
                    });
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#2767f2',
                      textAlign: 'right',
                    }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
              {/* // append an type ad in this add and this should be in every 4th index */}
              <FlatList
                data={AppendAd(comicsData?.[key]?.data)}
                keyExtractor={(item, index) => index.toString()}
                ref={flatListRef}
                renderItem={({item, index}) => (
                  <Card
                    item={item}
                    index={index}
                    onPress={() => {
                      crashlytics().log('Comic Details button clicked');
                      analytics().logEvent('comic_details_button_clicked', {
                        link: item?.link?.toString(),
                        title: item?.title?.toString(),
                        isComicBookLink: key === 'readallcomics',
                      });
                      navigation.navigate(NAVIGATION.comicDetails, {
                        ...item,
                        isComicBookLink: key === 'readallcomics',
                      });
                    }}
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
  gameDetailsParent: {
    marginBottom: 24,
  },
});
