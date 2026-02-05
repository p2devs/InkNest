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
  Image,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {getVersion} from 'react-native-device-info';
import {useFeatureFlag} from 'configcat-react';

import {NAVIGATION} from '../../../Constants';
import {useSelector, useDispatch} from 'react-redux';
import {getComicsHome} from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import AnimeAdbanner from '../../../Components/UIComp/AnimeAdBanner/AnimeAdbanner';
import {clearHistory} from '../../../Redux/Reducers';
import {ComicHostName} from '../../../Utils/APIs';

// Generate colors for sections
const getSectionColor = (index) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#667EEA', '#F093FB', 
    '#4FACFE', '#43E97B', '#FA709A', '#FEE140'
  ];
  return colors[index % colors.length];
};

export function Library({navigation}) {
  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('readcomicsonline');
  const [changeType, setChangeType] = useState(false);
  const History = useSelector(state => state.data.history);
  const notifications = useSelector(state => state.data?.notifications || []);
  const hasUnreadNotifications = notifications.some(
    notification => !notification?.read,
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forIosValue, forIosLoading]);

  const allSections = Object.entries(comicsData);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {getVersion() === forIosValue &&
        forIosLoading === false ? null : forIosLoading === false ? (
          <>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => {
                  setChangeType(!changeType);
                  crashlytics().log('Comic Host Name Clicked');
                  analytics().logEvent('comic_host_name_clicked', {
                    hostName: type.toString(),
                  });
                }}
                style={styles.hostSelector}>
                <Text style={styles.hostText}>{type}</Text>
                <AntDesign name="down" size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  crashlytics().log('Bookmarks button clicked');
                  navigation.navigate(NAVIGATION.bookmarks);
                }}>
                <FontAwesome6 name="book-bookmark" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  crashlytics().log('Notifications button clicked');
                  navigation.navigate(NAVIGATION.notifications);
                }}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                {hasUnreadNotifications && (
                  <View style={styles.notificationBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
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
          <View style={styles.dropdownMenu}>
            {Object.keys(ComicHostName).map((key, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
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
                  <MaterialIcons name="radio-button-unchecked" size={20} color="#fff" />
                )}
                <View>
                  <Text style={styles.dropdownItemTitle}>{key}</Text>
                  <Text style={styles.dropdownItemSubtitle}>{ComicHostName[key]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Continue Reading */}
        {!Object.values(History).length ? null : (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Reading</Text>
              <TouchableOpacity onPress={() => {
                Alert.alert(
                  'Clear History',
                  'Are you sure you want to clear your reading history?',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Clear', onPress: () => dispatch(clearHistory())},
                  ],
                  {cancelable: false},
                );
              }}>
                <Text style={styles.clearText}>Clear</Text>
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

        {/* Stacked List Sections */}
        {!loading && allSections.map(([key, section], sectionIndex) => (
          <View key={key} style={styles.stackedSection}>
            <View style={styles.stackedHeader}>
              <View style={[styles.stackedIndicator, {backgroundColor: getSectionColor(sectionIndex)}]} />
              <Text style={styles.stackedTitle}>{section.title}</Text>
            </View>
            {section.data?.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stackedItem}
                onPress={() => {
                  crashlytics().log('Comic Details button clicked');
                  analytics().logEvent('comic_details_button_clicked', {
                    link: item?.link?.toString(),
                    title: item?.title?.toString(),
                  });
                  type === 'readallcomics' || type == 'comicbookplus'
                    ? navigation.navigate(NAVIGATION.comicBook, {
                        comicBookLink: item?.link,
                      })
                    : navigation.navigate(NAVIGATION.comicDetails, {
                        ...item,
                        isComicBookLink: key === 'readallcomics',
                      });
                }}>
                <Image source={{uri: item.image}} style={styles.stackedImage} />
                <View style={styles.stackedInfo}>
                  <Text style={styles.stackedItemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.stackedItemDate}>{item.publishDate}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <View style={{paddingVertical: 40, alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#667EEA" />
          </View>
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
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  hostSelector: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  iconButton: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F74B78',
    borderWidth: 1,
    borderColor: '#14142A',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 12,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdownItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  dropdownItemSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  
  // Section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  clearText: {
    fontSize: 14,
    color: '#2767f2',
  },
  
  // Continue Reading
  historySection: {
    marginBottom: 24,
  },
  gameDetailsParent: {
    marginBottom: 24,
  },
  
  // Stacked List Sections
  stackedSection: {
    marginBottom: 20,
  },
  stackedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stackedIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  stackedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  stackedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  stackedImage: {
    width: 50,
    height: 70,
    borderRadius: 8,
  },
  stackedInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  stackedItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  stackedItemDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
