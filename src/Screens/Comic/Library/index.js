import React, {useEffect, useState} from 'react';
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
import {getMangaHome} from '../../../InkNest-Externals/Screens/Manga/APIs';
import HistoryCard from './Components/HistoryCard';
import MangaHistoryCard from './Components/MangaHistoryCard';
import AnimeAdbanner from '../../../Components/UIComp/AnimeAdBanner/AnimeAdbanner';
import {clearHistory, clearMangaHistory} from '../../../Redux/Reducers';
import {ComicHostName} from '../../../Utils/APIs';

export function Library({navigation}) {
  const [comicsData, setComicsData] = useState({});
  const [mangaData, setMangaData] = useState({latest: null, manga: null, newest: null});
  const [loading, setLoading] = useState(false);
  const [mangaLoading, setMangaLoading] = useState(false);
  const [type, setType] = useState('readcomicsonline');
  const [changeType, setChangeType] = useState(false);
  const [activeTab, setActiveTab] = useState('comic');
  const History = useSelector(state => state.data.history);
  const MangaHistory = useSelector(state => state.data.MangaHistory || {});
  const comicBookmarkCount = useSelector(
    state => Object.values(state.data.dataByUrl).filter(item => item.Bookmark).length,
  );
  const mangaBookmarkCount = useSelector(
    state => Object.keys(state.data.MangaBookMarks || {}).length,
  );
  const totalBookmarkCount = comicBookmarkCount + mangaBookmarkCount;
  const notifications = useSelector(state => state.data?.notifications || []);
  const hasUnreadNotifications = notifications.some(
    notification => !notification?.read,
  );
  const dispatch = useDispatch();
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    getVersion(),
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
        getMangaHome(setMangaData, setMangaLoading);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forIosValue, forIosLoading]);

  const allSections = Object.entries(comicsData);
  const isSpecialBuild =
    getVersion() === forIosValue && forIosLoading === false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header - always visible */}
      {isSpecialBuild ? null : forIosLoading === false ? (
        <>
          {/* Header: Tabs + Actions in one row */}
          <View style={styles.headerRow}>
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'comic' && styles.activeTab]}
                onPress={() => setActiveTab('comic')}>
                <MaterialIcons
                  name="menu-book"
                  size={15}
                  color={activeTab === 'comic' ? '#667EEA' : 'rgba(255,255,255,0.35)'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'comic' && styles.activeTabText,
                  ]}>
                  Comics
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'manga' && styles.activeTab]}
                onPress={() => setActiveTab('manga')}>
                <MaterialIcons
                  name="auto-stories"
                  size={15}
                  color={activeTab === 'manga' ? '#007AFF' : 'rgba(255,255,255,0.35)'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'manga' && styles.activeTabMangaText,
                  ]}>
                  Manga
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  crashlytics().log('Bookmarks button clicked');
                  navigation.navigate(NAVIGATION.bookmarks);
                }}>
                <FontAwesome6
                  name="book-bookmark"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
                {totalBookmarkCount > 0 && (
                  <View style={styles.bookmarkBadge}>
                    <Text style={styles.bookmarkBadgeText}>
                      {totalBookmarkCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  crashlytics().log('Notifications button clicked');
                  navigation.navigate(NAVIGATION.notifications);
                }}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
                {hasUnreadNotifications && (
                  <View style={styles.notificationDot} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  crashlytics().log('Home Search button clicked');
                  navigation.navigate(NAVIGATION.search, {
                    initialTab: activeTab,
                  });
                }}>
                <Ionicons
                  name="search"
                  size={18}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>
          </View>

          <AnimeAdbanner />
        </>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ===== COMIC TAB ===== */}
        {activeTab === 'comic' && (
          <>
            {/* Comic Host Selector */}
            {!isSpecialBuild && forIosLoading === false && (
              <View style={styles.hostRow}>
                <TouchableOpacity
                  onPress={() => {
                    setChangeType(!changeType);
                    crashlytics().log('Comic Host Name Clicked');
                    analytics().logEvent('comic_host_name_clicked', {
                      hostName: type.toString(),
                    });
                  }}
                  style={styles.hostSelector}>
                  <Text style={styles.hostText} numberOfLines={1}>
                    {type}
                  </Text>
                  <AntDesign
                    name={changeType ? 'up' : 'down'}
                    size={14}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Host dropdown */}
            {changeType && (
              <View style={styles.dropdown}>
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
                    {type === key ? (
                      <Ionicons name="checkmark-circle" size={18} color="#667EEA" />
                    ) : (
                      <View style={styles.radioEmpty} />
                    )}
                    <View style={styles.dropdownItemInfo}>
                      <Text style={styles.dropdownItemTitle}>{key}</Text>
                      <Text style={styles.dropdownItemSub}>
                        {ComicHostName[key]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Continue Reading */}
            {Object.values(History).length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Continue Reading</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Clear History',
                        'Are you sure you want to clear your reading history?',
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Clear',
                            onPress: () => dispatch(clearHistory()),
                          },
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

            {/* Comic sections */}
            {!loading &&
              allSections.map(([key, section]) => (
                <View key={key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <FlatList
                    data={section.data}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={styles.comicCard}
                        activeOpacity={0.7}
                        onPress={() => {
                          crashlytics().log('Comic Details button clicked');
                          analytics().logEvent('comic_details_button_clicked', {
                            link: item?.link?.toString(),
                            title: item?.title?.toString(),
                          });
                          type === 'readallcomics' || type === 'comicbookplus'
                            ? navigation.navigate(NAVIGATION.comicBook, {
                                comicBookLink: item?.link,
                              })
                            : navigation.navigate(NAVIGATION.comicDetails, {
                                ...item,
                                isComicBookLink: key === 'readallcomics',
                              });
                        }}>
                        <Image
                          source={{uri: item.image}}
                          style={styles.comicCardImage}
                        />
                        <Text style={styles.comicCardTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              ))}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#667EEA" />
              </View>
            )}
          </>
        )}

        {/* ===== MANGA TAB ===== */}
        {activeTab === 'manga' && (
          <>
            {/* Manga Continue Reading */}
            {Object.values(MangaHistory).length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Continue Reading</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Clear Manga History',
                        'Are you sure you want to clear your manga reading history?',
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Clear',
                            onPress: () => dispatch(clearMangaHistory()),
                          },
                        ],
                        {cancelable: false},
                      );
                    }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={Object.values(MangaHistory).sort(
                    (a, b) => b.lastOpenAt - a.lastOpenAt,
                  )}
                  keyExtractor={(item, index) => `manga-history-${index}`}
                  renderItem={({item}) => <MangaHistoryCard item={item} />}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}

            {/* Manga sections */}
            {!mangaLoading && mangaData.latest?.mangaList?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Latest Manga</Text>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate(NAVIGATION.mangaViewAll, {
                        title: 'Latest',
                        LoadedData: mangaData.latest,
                        type: 'latest',
                      });
                    }}>
                    <Text style={styles.clearText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={mangaData.latest.mangaList.slice(0, 10)}
                  keyExtractor={(item, index) => `manga-latest-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.comicCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        crashlytics().log('Manga card clicked from Library');
                        analytics().logEvent('manga_library_card_clicked', {
                          link: item?.link?.toString(),
                          title: item?.title?.toString(),
                        });
                        navigation.navigate(NAVIGATION.mangaDetails, {
                          link: item.link,
                          title: item.title,
                        });
                      }}>
                      <Image
                        source={{uri: item.image}}
                        style={styles.comicCardImage}
                      />
                      <Text style={styles.comicCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {!mangaLoading && mangaData.manga?.mangaList?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Popular Manga</Text>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate(NAVIGATION.mangaViewAll, {
                        title: 'Manga',
                        LoadedData: mangaData.manga,
                        type: 'manga',
                      });
                    }}>
                    <Text style={styles.clearText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={mangaData.manga.mangaList.slice(0, 10)}
                  keyExtractor={(item, index) => `manga-manga-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.comicCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        crashlytics().log('Manga card clicked from Library');
                        analytics().logEvent('manga_library_card_clicked', {
                          link: item?.link?.toString(),
                          title: item?.title?.toString(),
                        });
                        navigation.navigate(NAVIGATION.mangaDetails, {
                          link: item.link,
                          title: item.title,
                        });
                      }}>
                      <Image
                        source={{uri: item.image}}
                        style={styles.comicCardImage}
                      />
                      <Text style={styles.comicCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {!mangaLoading && mangaData.newest?.mangaList?.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Newest Manga</Text>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate(NAVIGATION.mangaViewAll, {
                        title: 'Newest',
                        LoadedData: mangaData.newest,
                        type: 'newest',
                      });
                    }}>
                    <Text style={styles.clearText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={mangaData.newest.mangaList.slice(0, 10)}
                  keyExtractor={(item, index) => `manga-newest-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.comicCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        crashlytics().log('Manga card clicked from Library');
                        analytics().logEvent('manga_library_card_clicked', {
                          link: item?.link?.toString(),
                          title: item?.title?.toString(),
                        });
                        navigation.navigate(NAVIGATION.mangaDetails, {
                          link: item.link,
                          title: item.title,
                        });
                      }}>
                      <Image
                        source={{uri: item.image}}
                        style={styles.comicCardImage}
                      />
                      <Text style={styles.comicCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Manga Loading */}
            {mangaLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 4,
    paddingBottom: 8,
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2D55',
  },

  // Tab Bar (inline in header)
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1E1E38',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  activeTab: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  activeTabText: {
    color: '#667EEA',
  },
  activeTabMangaText: {
    color: '#007AFF',
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#667EEA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bookmarkBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },


  // Host selector (comic tab)
  hostRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  hostSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E38',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  hostText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },

  // Dropdown
  dropdown: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1E1E38',
    borderRadius: 12,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  radioEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 1,
  },

  // Sections
  section: {
    paddingLeft: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667EEA',
    marginBottom: 10,
  },

  // Horizontal comic cards
  horizontalList: {
    gap: 10,
  },
  comicCard: {
    width: 120,
    backgroundColor: '#1E1E38',
    borderRadius: 10,
    overflow: 'hidden',
  },
  comicCardImage: {
    width: 120,
    height: 165,
    backgroundColor: '#2A2A48',
  },
  comicCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    lineHeight: 16,
  },
  listItemSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  bottomSpacer: {
    height: 32,
  },
});
