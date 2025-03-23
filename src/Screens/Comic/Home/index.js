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

export function Home({navigation}) {
  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
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
        getComicsHome(setComicsData, setLoading);
      }
    }
  }, [forIosValue, forIosLoading]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AnimeAdbanner />
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
