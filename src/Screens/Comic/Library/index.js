import React, {useEffect, useState, useMemo} from 'react';
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
import {getComics} from '../APIs/Home';
import {getMangaHome} from '../../../InkNest-Externals/Screens/Manga/APIs';
import {getNovelHome} from '../../Novel/APIs';
import HistoryCard from './Components/HistoryCard';
import MangaHistoryCard from './Components/MangaHistoryCard';
import AnimeAdbanner from '../../../Components/UIComp/AnimeAdBanner/AnimeAdbanner';
import {clearHistory, clearMangaHistory} from '../../../Redux/Reducers';
import {selectComicBookmarks, selectComicHistory} from '../../../Redux/Selectors/comics';
import {ComicHostName, NovelHostName} from '../../../Utils/APIs';
import {NovelSectionList} from '../../Novel/Components/NovelList';
import {
  getSourceLabel,
  getSourceStatus,
  SOURCE_STATUS,
} from '../../../Utils/sourceStatus';

export function Library({navigation}) {
  const [comicsData, setComicsData] = useState({});
  const [comicSource, setComicSource] = useState('comicbookplus');
  const [comicRetry, setComicRetry] = useState(0);
  const [mangaData, setMangaData] = useState({
    latest: null,
    manga: null,
    newest: null,
  });
  const [novelSections, setNovelSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mangaLoading, setMangaLoading] = useState(false);
  const [novelLoading, setNovelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comic');
  const [changeNovelSource, setChangeNovelSource] = useState(false);
  const history = useSelector(selectComicHistory);
  const MangaHistory = useSelector(state => state.data.MangaHistory || {});
  const NovelHistory = useSelector(state => state.data.NovelHistory || {});
  const novelBaseUrl = useSelector(state => state.data.novelBaseUrl || 'novelfire');
  const novelSources = useSelector(state => state.data.novelSources || {});
  const comicBookmarkCount = useSelector(state => selectComicBookmarks(state).length);
  const mangaBookmarkCount = useSelector(
    state => Object.keys(state.data.MangaBookMarks || {}).length,
  );
  const novelBookmarkCount = useSelector(
    state => Object.keys(state.data.NovelBookMarks || {}).length,
  );
  const totalBookmarkCount = comicBookmarkCount + mangaBookmarkCount + novelBookmarkCount;
  const notifications = useSelector(state => state.data?.notifications || []);
  const sourceStatusNotifications = useSelector(
    state => state.data?.sourceStatusNotifications || [],
  );
  const hasUnreadNotifications = useMemo(() => {
    const hasUnreadRegular = notifications.some(notification => !notification?.read);
    const hasUnreadSourceStatus = sourceStatusNotifications.some(
      notification => !notification?.read,
    );
    return hasUnreadRegular || hasUnreadSourceStatus;
  }, [notifications, sourceStatusNotifications]);
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
          hostName: ComicHostName.comicbookplus,
          lastPage: null,
          title: 'Most Viewed',
        },
      });
      setLoading(false);
      return;
    }
    if (forIosLoading) return;
    let current = true;
    setLoading(true);
    setComicsData({});
    getComics(comicSource, 1, dispatch).then(result => {
      if (!current) return;
      if (result) {
        setComicsData({
          'latest-release': {
            source: comicSource,
            title: `Latest on ${getSourceLabel(comicSource)}`,
            data: result.comicsData,
            lastPage: result.lastPage,
          },
        });
      }
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [comicSource, comicRetry, dispatch, forIosValue, forIosLoading]);

  useEffect(() => {
    if (getVersion() !== forIosValue && !forIosLoading) {
      getMangaHome(setMangaData, setMangaLoading, dispatch);
      getNovelHome(novelBaseUrl).then(data => {
        setNovelSections(data || []);
        setNovelLoading(false);
      }).catch(err => {
        console.error('Error fetching novel home:', err);
        setNovelLoading(false);
      });
    }
  }, [dispatch, forIosValue, forIosLoading, novelBaseUrl]);

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
                  color={
                    activeTab === 'comic' ? '#667EEA' : 'rgba(255,255,255,0.35)'
                  }
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
                  color={
                    activeTab === 'manga' ? '#007AFF' : 'rgba(255,255,255,0.35)'
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'manga' && styles.activeTabMangaText,
                  ]}>
                  Manga
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'novel' && styles.activeTab]}
                onPress={() => setActiveTab('novel')}>
                <Ionicons
                  name="book"
                  size={15}
                  color={
                    activeTab === 'novel' ? '#9C27B0' : 'rgba(255,255,255,0.35)'
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'novel' && styles.activeTabNovelText,
                  ]}>
                  Novels
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
                accessibilityLabel="Search"
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
            {!isSpecialBuild && !forIosLoading && (
              <View style={styles.hostRow}>
                <View style={styles.tabBar}>
                  {Object.keys(ComicHostName).map(source => (
                    <TouchableOpacity
                      key={source}
                      accessibilityRole="tab"
                      accessibilityState={{selected: comicSource === source}}
                      onPress={() => setComicSource(source)}
                      style={[styles.tab, comicSource === source && styles.activeTab]}>
                      <Text style={[styles.tabText, comicSource === source && styles.activeTabText]}>
                        {getSourceLabel(source)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {/* Continue Reading */}
            {history.length > 0 && (
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
                  data={history.slice().sort(
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
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {!isSpecialBuild && (
                      <TouchableOpacity
                        onPress={() => navigation.navigate(NAVIGATION.seeAll, {
                          title: section.title,
                          data: section.data,
                          lastPage: section.lastPage,
                          source: section.source,
                          key,
                        })}>
                        <Text style={styles.clearText}>See All</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
                          if (isSpecialBuild || section.source !== 'comicbookplus') {
                            navigation.navigate(NAVIGATION.comicDetails, item);
                          } else {
                            navigation.navigate(NAVIGATION.comicBook, {comicBookLink: item.link});
                          }
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

            {/* Empty / error state with retry */}
            {!loading && !forIosLoading && allSections.length === 0 && (
              <View style={styles.comicEmptyState}>
                <MaterialIcons
                  name="cloud-off"
                  size={44}
                  color="rgba(255,255,255,0.25)"
                />
                <Text style={styles.comicEmptyTitle}>
                  {`Couldn't load ${getSourceLabel(comicSource)}`}
                </Text>
                <Text style={styles.comicEmptySubtitle}>
                  {getSourceStatus(comicSource)?.status ===
                  SOURCE_STATUS.CLOUDFLARE_PROTECTED
                    ? `${getSourceLabel(comicSource)} is blocking requests. Try again later.`
                    : 'Something went wrong. Check your connection and try again.'}
                </Text>
                <TouchableOpacity
                  style={styles.comicRetryButton}
                  activeOpacity={0.8}
                  onPress={() => setComicRetry(count => count + 1)}>
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                  <Text style={styles.comicRetryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#667EEA" />
                <Text style={styles.loadingText}>
                  Loading {getSourceLabel(comicSource)}…
                </Text>
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

        {/* ===== NOVEL TAB ===== */}
        {activeTab === 'novel' && (
          <>
            {/* Novel Source Selector */}
            {!isSpecialBuild && forIosLoading === false && (
              <View style={styles.hostRow}>
                <TouchableOpacity
                  onPress={() => {
                    setChangeNovelSource(!changeNovelSource);
                    crashlytics().log('Novel Source Name Clicked');
                    analytics().logEvent('novel_source_name_clicked', {
                      source: novelBaseUrl.toString(),
                    });
                  }}
                  style={styles.hostSelector}>
                  <Text style={styles.hostText} numberOfLines={1}>
                    {getSourceLabel(novelBaseUrl)}
                  </Text>
                  <AntDesign
                    name={changeNovelSource ? 'up' : 'down'}
                    size={14}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Novel Source dropdown */}
            {changeNovelSource && (
              <View style={styles.dropdown}>
                {Object.keys(NovelHostName).map((key, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      crashlytics().log('Novel Source Selected');
                      analytics().logEvent('novel_source_selected', {
                        source: key,
                      });
                      setNovelSections([]); // Clear old sections
                      setNovelLoading(true); // Show loading when switching sources
                      dispatch({type: 'data/switchNovelSource', payload: key});
                      setChangeNovelSource(false);
                    }}>
                    {novelBaseUrl === key ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#667EEA"
                      />
                    ) : (
                      <View style={styles.radioEmpty} />
                    )}
                    <View style={styles.dropdownItemInfo}>
                      <Text style={styles.dropdownItemTitle}>{getSourceLabel(key)}</Text>
                      <Text style={styles.dropdownItemSub}>
                        {NovelHostName[key]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Novel Continue Reading */}
            {Object.values(NovelHistory).length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Continue Reading</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Clear Novel History',
                        'Are you sure you want to clear your novel reading history?',
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Clear',
                            onPress: () => dispatch({type: 'data/clearNovelHistory'}),
                          },
                        ],
                        {cancelable: false},
                      );
                    }}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={Object.values(NovelHistory).sort(
                    (a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0),
                  )}
                  keyExtractor={(item, index) => `novel-history-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.comicCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        crashlytics().log('Novel history card clicked');
                        navigation.navigate(NAVIGATION.novelDetails, {
                          novel: item,
                        });
                      }}>
                      <Image
                        source={{uri: item.coverImage}}
                        style={styles.comicCardImage}
                      />
                      <Text style={styles.comicCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.lastChapter && (
                        <Text style={styles.novelChapterText}>
                          Ch. {item.lastChapter}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Novel sections */}
            {!novelLoading && novelSections.length > 0 && (
              <NovelSectionList
                sections={novelSections}
                onItemPress={(novel) => {
                  crashlytics().log('Novel card clicked from Library');
                  navigation.navigate(NAVIGATION.novelDetails, {novel});
                }}
                onSeeAllPress={(sectionName, novels) => {
                  navigation.navigate(NAVIGATION.novelViewAll, {
                    title: sectionName,
                    novels,
                  });
                }}
                style={styles.novelListContent}
              />
            )}

            {/* Novel Loading */}
            {novelLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#9C27B0" />
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
  activeTabNovelText: {
    color: '#9C27B0',
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

  // Novel specific styles
  novelChapterText: {
    fontSize: 10,
    color: '#9C27B0',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  novelListContent: {
    paddingTop: 16,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 10,
  },

  // Comic empty / error state
  comicEmptyState: {
    marginHorizontal: 20,
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  comicEmptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  comicEmptySubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  comicRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#667EEA',
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 12,
  },
  comicRetryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 32,
  },
});
