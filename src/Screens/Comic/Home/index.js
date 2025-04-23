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
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {getVersion} from 'react-native-device-info';
import {useFeatureFlag} from 'configcat-react';

import {NAVIGATION} from '../../../Constants';
import {useSelector, useDispatch} from 'react-redux';
import {getComicsHome} from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';
import Card from '../Components/Card';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import AnimeAdbanner from '../../../Components/UIComp/AnimeAdBanner/AnimeAdbanner';
import {clearHistory} from '../../../Redux/Reducers';
import {ComicHostName} from '../../../Utils/APIs';
import {widthPercentageToDP} from 'react-native-responsive-screen';

export function Home({navigation}) {
  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('comichubfree');
  const [changeType, setChangeType] = useState(false);
  const History = useSelector(state => state.data.history);
  const dispatch = useDispatch();
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  useEffect(() => {
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
        getComicsHome(type, setComicsData, setLoading);
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
                  crashlytics().log('Comic Host Name Clicked');
                  analytics().logEvent('comic_host_name_clicked', {
                    hostName: type.toString(),
                  });
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
                  crashlytics().log('Home Search button clicked');
                  navigation.navigate(NAVIGATION.search);
                }}>
                <AntDesign name="search1" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <AnimeAdbanner />
          </>
        ) : null}
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
                  analytics().logEvent('comic_host_name_clicked', {
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
                      crashlytics().log('Comic Details button clicked');
                      analytics().logEvent('comic_details_button_clicked', {
                        link: item?.link?.toString(),
                        title: item?.title?.toString(),
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
