import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useFeatureFlag} from 'configcat-react';
import {isMacOS} from '../../../Utils/PlatformUtils';

import {NAVIGATION} from '../../../Constants';
import {useSelector, useDispatch} from 'react-redux';
import {getComicsHome} from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';
import Card from '../Components/Card';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import AnimeAdbanner from '../../../Components/UIComp/AnimeAdBanner/AnimeAdbanner';
import {clearHistory} from '../../../Redux/Reducers';
import {ComicHostName} from '../../../Utils/APIs';

// Conditional imports for Firebase and device info
let crashlytics, analytics, getVersion;
if (!isMacOS) {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    analytics = require('@react-native-firebase/analytics').default;
    getVersion = require('react-native-device-info').getVersion;
  } catch (error) {
    console.log('Firebase or device-info modules not available:', error.message);
    getVersion = () => '1.0.0';
  }
} else {
  // Fallback function for macOS
  getVersion = () => '1.0.0';
}

export function Home({navigation}) {
  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('readcomicsonline');
  const [changeType, setChangeType] = useState(false);
  const History = useSelector(state => state.data.history);
  const dispatch = useDispatch();
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  useEffect(() => {
    console.log('=== macOS Debug Info ===');
    console.log('isMacOS:', isMacOS);
    console.log('getVersion():', getVersion());
    console.log('forIosValue:', forIosValue);
    console.log('forIosLoading:', forIosLoading);
    console.log('Condition result:', getVersion() === forIosValue && forIosLoading === false);
    console.log('========================');
    
    if (getVersion() === forIosValue && forIosLoading === false) {
      setComicsData({
        'most-viewed': {
          data: [
            {
              genres: null,
              image: 'https://box01.comicbookplus.com/thumbs/ace/AllLove.png',
              link: 'https://comicbookplus.com/?cid=3245',
              publishDate: 'May 1949 - May 1950',
              status: null,
              title: 'All Love',
            },
            {
              genres: null,
              image:
                'https://box01.comicbookplus.com/thumbs/ace/AllRomances.png',
              link: 'https://comicbookplus.com/?cid=858',
              publishDate: 'Aug 1949 - Aug 1950',
              status: null,
              title: 'All Romances',
            },
            {
              genres: null,
              image: 'https://box01.comicbookplus.com/thumbs/ace/Andy.png',
              link: 'https://comicbookplus.com/?cid=859',
              publishDate: 'Jun 1948 - Aug 1948',
              status: null,
              title: 'Andy Comics',
            },
            {
              genres: null,
              image: 'https://box01.comicbookplus.com/thumbs/ace/AtomicWar.png',
              link: 'https://comicbookplus.com/?cid=860',
              publishDate: 'Nov 1952 - Apr 1953',
              status: null,
              title: 'Atomic War!',
            },
          ],
          hostName: 'https://readcomicsonline.ru/',
          lastPage: null,
          title: 'Most Viewed',
        },
      });
    } else {
      if (forIosLoading === false) {
        console.log('Loading comics data for type:', type);
        getComicsHome(type, (data) => {
          console.log('=== API Response Debug ===');
          console.log('Received data:', data);
          console.log('Data keys:', Object.keys(data || {}));
          console.log('=========================');
          setComicsData(data);
        }, setLoading);
      }
    }
  }, [forIosValue, forIosLoading]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {getVersion() === forIosValue &&
        forIosLoading === false ? null : forIosLoading === false ? (
          <>
            <View style={{flex: 1, flexDirection: 'row', gap: 15}}>
              <TouchableOpacity
                onPress={() => {
                  setChangeType(!changeType);
                  if (!isMacOS) {
                    if (crashlytics) crashlytics().log('Comic Host Name Clicked');
                    if (analytics) analytics.logEvent('comic_host_name_clicked', {
                      hostName: type.toString(),
                    });
                  }
                }}
                style={styles.rectangle}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                  }}>
                  {type}
                </Text>
                <AntDesign name="down" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderRadius: 100,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  if (!isMacOS && crashlytics) {
                    crashlytics().log('Home Search button clicked');
                  }
                  navigation.navigate(NAVIGATION.search);
                }}>
                <AntDesign name="search1" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <AnimeAdbanner />
          </>
        ) : (
          <View style={{padding: 20}}>
            <Text style={{color: 'white', fontSize: 18}}>Loading content...</Text>
          </View>
        )}
        {changeType ? (
          <View
            style={{
              flexGrow: 1,
              position: 'absolute',
              width: '100%',
              flexDirection: 'column',
              gap: 6,
              paddingHorizontal: 20,
              marginBottom: 24,
              backgroundColor: '#14142A',
              borderRadius: 10,
              paddingVertical: 10,
              paddingLeft: 10,
              paddingRight: 10,
              zIndex: 1,
              top: 50,
              left: 0,
              right: 0,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.2,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
            {Object.keys(ComicHostName).map((key, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 100,
                  width: '100%',
                  height: 40,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginVertical: 6,
                }}
                onPress={() => {
                  crashlytics().log('Comic Host Name Clicked');
                  analytics.logEvent('comic_host_name_clicked', {
                    hostName: key,
                  });
                  setType(key);
                  getComicsHome(key, setComicsData, setLoading);
                  setChangeType(false);
                }}>
                {type == key ? (
                  <AntDesign name="checkcircle" size={20} color="#fff" />
                ) : (
                  <MaterialIcons
                    name="radio-button-unchecked"
                    size={20}
                    color="#fff"
                  />
                )}
                <View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 1)',
                      textAlign: 'left',
                      opacity: 0.9,
                    }}>
                    {key}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'left',
                    }}>
                    {ComicHostName[key]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

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
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Clear History',
                    'Are you sure you want to clear your reading history?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Clear',
                        onPress: () => dispatch(clearHistory()),
                      },
                    ],
                    {cancelable: false},
                  );
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#2767f2',
                    textAlign: 'right',
                  }}>
                  Clear
                </Text>
              </TouchableOpacity>
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
                      if (!isMacOS && crashlytics) {
                        crashlytics().log('Comic Details button clicked');
                      }
                      if (!isMacOS && analytics) {
                        analytics.logEvent('comic_details_button_clicked', {
                          link: item?.link?.toString(),
                          title: item?.title?.toString(),
                        });
                      }
                      type === 'readallcomics'
                        ? navigation.navigate(NAVIGATION.comicBook, {
                            comicBookLink: item?.link,
                          })
                        : navigation.navigate(NAVIGATION.comicDetails, {
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
    flex: 1,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
