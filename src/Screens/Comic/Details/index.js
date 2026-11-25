import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {getVersion} from 'react-native-device-info';
import {useFeatureFlag} from 'configcat-react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import {fetchComicDetails} from '../../../Redux/Actions/GlobalActions';
import {updateData} from '../../../Redux/Reducers';
import {getIosSampleSeries} from '../../../Utils/iosComicSamples';
import {navigate} from '../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../Constants';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import PaginationFooter from './Components/FooterPagination';
import ContinueReadingFAB from './Components/ContinueReadingFAB';
import CommunityTab from '../../../InkNest-Externals/Community/Screens/CommunityBoard';
import useComicNotificationSubscription from '../../../InkNest-Externals/Notifications/hooks/useComicNotificationSubscription';
import LoginPrompt from '../../../Components/Auth/LoginPrompt';
import {
  signInWithApple,
  signInWithGoogle,
} from '../../../InkNest-Externals/Community/Logic/CommunityActions';

export function ComicDetails({route, navigation}) {
  const PageLink = route?.params?.link;
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    getVersion(),
  );

  const [sort, setSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const dispatch = useDispatch();

  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);
  const appVersion = getVersion();
  const isIosOverrideActive =
    !forIosLoading && appVersion === forIosValue && !!forIosValue;

  const catalogSeries = getIosSampleSeries(PageLink);
  const sampleSeries = isIosOverrideActive ? catalogSeries : undefined;

  const historyKey = catalogSeries ? PageLink : PageLink?.split('?')[0] ?? '';
  const readingHistory = useSelector(state => state.data.history[historyKey]);

  const [tabBar, setTabBar] = useState(() => {
    const hasRecent = Boolean(readingHistory?.readComics);
    return [
      ...(hasRecent ? [{name: 'Recent', active: true}] : []),
      {name: 'Chapters', active: !hasRecent},
      {name: 'Community', active: false},
    ];
  });

  const availableChapters = useMemo(
    () => sampleSeries?.issues ?? ComicDetail?.chapters ?? [],
    [sampleSeries, ComicDetail?.chapters],
  );

  const sortedChapters = useMemo(
    () => sort ? [...availableChapters].reverse() : availableChapters,
    [availableChapters, sort],
  );

  const activeTab = useMemo(
    () => tabBar.find(tab => tab.active)?.name ?? 'Chapters',
    [tabBar],
  );
  const isChapterTab = activeTab === 'Chapters';
  const isRecentTab = activeTab === 'Recent';

  // Get the last read chapter for Continue Reading FAB
  const lastReadChapter = useMemo(() => {
    if (!readingHistory?.readComics) return null;
    
    const entries = Object.entries(readingHistory.readComics);
    if (entries.length === 0) return null;
    
    // Sort by readAt timestamp (most recent first)
    const sorted = entries.sort((a, b) => (b[1]?.readAt || 0) - (a[1]?.readAt || 0));
    const [chapterLink, meta] = sorted[0];
    
    // Find chapter details
    const chapter = availableChapters.find(ch => 
      ch.link === chapterLink || (!sampleSeries && ch.link.split('?')[0] === chapterLink.split('?')[0])
    );
    
    if (!chapter) return null;
    
    const comicBook = meta?.comicBook || {};
    const totalPages = comicBook.images?.length || meta?.totalPages || 0;
    const currentPage = (meta?.lastReadPage || 0) + 1;
    const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
    
    return {
      ...chapter,
      currentPage,
      totalPages,
      progress,
    };
  }, [readingHistory, availableChapters, sampleSeries]);

  const handleContinueReading = useCallback(() => {
    if (!lastReadChapter) return;
    
    crashlytics().log('Continue Reading FAB clicked');
    analytics().logEvent('Continue_Reading_Clicked', {
      chapter: lastReadChapter.title,
    });
    
    navigate(sampleSeries ? NAVIGATION.mockBooks : NAVIGATION.comicBook, {
      comicBookLink: lastReadChapter.link,
      pageJump: lastReadChapter.currentPage - 1,
      DetailsPage: {
        link: PageLink,
        title: ComicDetail?.title,
        imgSrc: ComicDetail?.imgSrc,
      },
    });
  }, [lastReadChapter, PageLink, ComicDetail, sampleSeries]);

  const recentChapters = useMemo(() => {
    if (!isRecentTab || !readingHistory?.readComics) {
      return [];
    }

    const chapterMap = new Map();
    availableChapters.forEach(chapter => {
      if (!chapter?.link) return;
      chapterMap.set(chapter.link, chapter);
      const normalized = chapter.link.split('?')[0];
      if (!sampleSeries) chapterMap.set(normalized, chapter);
    });

    return Object.entries(readingHistory.readComics)
      .map(([chapterLink, meta]) => {
        const normalized = chapterLink?.split('?')?.[0] || '';
        const baseChapter =
          chapterMap.get(chapterLink) ||
          (normalized ? chapterMap.get(normalized) : null);
        if (!baseChapter) return null;
        return {
          ...baseChapter,
          readAt: meta?.readAt ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.readAt || 0) - (a.readAt || 0));
  }, [isRecentTab, readingHistory, availableChapters, sampleSeries]);

  const shouldShowChapterSearch =
    isChapterTab && !forIosLoading && sortedChapters.length > 10;
  const shouldShowRecentSearch = isRecentTab && recentChapters.length > 10;
  const shouldShowSearch = shouldShowChapterSearch || shouldShowRecentSearch;

  const filteredChapters = useMemo(() => {
    if (!isChapterTab) {
      return sortedChapters;
    }
    if (!shouldShowChapterSearch || !searchQuery.trim()) {
      return sortedChapters;
    }
    const loweredQuery = searchQuery.trim().toLowerCase();
    return sortedChapters.filter(chapter =>
      chapter?.title?.toLowerCase().includes(loweredQuery),
    );
  }, [isChapterTab, searchQuery, shouldShowChapterSearch, sortedChapters]);

  const filteredRecentChapters = useMemo(() => {
    if (!isRecentTab) {
      return recentChapters;
    }
    if (!shouldShowRecentSearch || !searchQuery.trim()) {
      return recentChapters;
    }
    const loweredQuery = searchQuery.trim().toLowerCase();
    return recentChapters.filter(chapter =>
      chapter?.title?.toLowerCase().includes(loweredQuery),
    );
  }, [isRecentTab, recentChapters, searchQuery, shouldShowRecentSearch]);

  const listData = useMemo(() => {
    if (forIosLoading) return [];
    if (isRecentTab) return filteredRecentChapters;
    return filteredChapters;
  }, [filteredChapters, filteredRecentChapters, forIosLoading, isRecentTab]);

  const comicMeta = useMemo(() => {
    const resolvedGenres = Array.isArray(ComicDetail?.genres)
      ? ComicDetail.genres.join(', ')
      : ComicDetail?.genres || '';
    return {
      title: ComicDetail?.title ?? route?.params?.title ?? '',
      imgSrc: ComicDetail?.imgSrc ?? route?.params?.image ?? '',
      baseUrl: ComicDetail?.baseUrl ?? '',
      publisher: ComicDetail?.publisher ?? '',
      genres: resolvedGenres,
      status: ComicDetail?.status ?? '',
    };
  }, [ComicDetail, route?.params?.image, route?.params?.title]);

  const notificationBell = useComicNotificationSubscription(
    PageLink,
    comicMeta,
  );

  const handleRequestLoginPrompt = useCallback(() => {
    setShowLoginPrompt(true);
  }, []);

  const handleCloseLoginPrompt = useCallback(() => {
    if (!authLoading) {
      setShowLoginPrompt(false);
    }
  }, [authLoading]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setAuthLoading(true);
      await dispatch(signInWithGoogle());
      setShowLoginPrompt(false);
    } catch (error) {
      Alert.alert('Sign in failed', 'Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [dispatch]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setAuthLoading(true);
      await dispatch(signInWithApple());
      setShowLoginPrompt(false);
    } catch (error) {
      Alert.alert('Sign in failed', 'Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [dispatch]);

  const reportError = useCallback((message, err) => {
    try {
      crashlytics().log(message);
      if (err) {
        crashlytics().recordError(err);
      }
    } catch (_error) {
      crashlytics().log('Error reporting failed');
      crashlytics().recordError(_error);
    }
  }, []);

  useEffect(() => {
    if (isIosOverrideActive) {
      return;
    }
    if (forIosLoading === false) {
      const fetchDetails = async () => {
        try {
          await dispatch(fetchComicDetails(PageLink));
        } catch (err) {
          reportError('Failed to fetch comic details', err);
        }
      };
      fetchDetails();
    }
  }, [PageLink, dispatch, forIosLoading, isIosOverrideActive, reportError]);

  const handleTabChange = useCallback(index => {
    crashlytics().log('Comic Details Tab Clicked');
    analytics().logEvent('Comic_Details_Tab_Clicked', {
      TabName: tabBar[index]?.name?.toString(),
    });
    setTabBar(prev =>
      prev.map((tab, tabIndex) => ({
        ...tab,
        active: tabIndex === index,
      })),
    );
  }, [tabBar]);

  const handleSortToggle = useCallback(() => {
    crashlytics().log('Comic Details Sort Clicked');
    analytics().logEvent('Comic_Details_Sort_Clicked');
    setSort(prev => !prev);
  }, []);

  if (!sampleSeries && error) return <Error error={error} />;

  return (
    <View style={styles.container}>
      {/* Header - always rendered at the top level */}
      <HeaderComponent
        link={PageLink}
        image={route?.params?.image}
        title={route?.params?.title}
        tabBar={tabBar}
        onRefresh={() => {
          if (sampleSeries) {
            dispatch(updateData({
              url: PageLink,
              data: {title: sampleSeries.title, imgSrc: sampleSeries.image},
            }));
          } else {
            dispatch(fetchComicDetails(PageLink, true));
          }
        }}
        onTabBar={handleTabChange}
        sort={sort}
        setSORT={handleSortToggle}
        notificationBell={notificationBell}
        onRequestLoginPrompt={handleRequestLoginPrompt}
      />
      
      {/* Tab Content - only switches the content below header */}
      <View style={styles.contentContainer}>
        {!isChapterTab && !isRecentTab ? (
          <CommunityTab
            comicLink={PageLink}
            navigation={navigation}
            headerComponent={null}
          />
        ) : (
          <>
            <LoadingModal loading={!sampleSeries && loading} />
            <FlatList
              ListHeaderComponent={
                shouldShowSearch ? (
                  <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                      <Ionicons
                        name="search"
                        size={18}
                        color="rgba(255,255,255,0.6)"
                        style={styles.searchIcon}
                      />
                      <TextInput
                        style={styles.searchInput}
                        placeholder={
                          isRecentTab ? 'Search recent reads' : 'Search chapters'
                        }
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={text => setSearchQuery(text)}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardAppearance="dark"
                      />
                    </View>
                    {isChapterTab ? (
                      <TouchableOpacity
                        style={styles.sortButton}
                        onPress={handleSortToggle}
                        activeOpacity={0.7}>
                        <FontAwesome5
                          name={sort ? 'sort-numeric-up' : 'sort-numeric-down-alt'}
                          size={16}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null
              }
              data={listData}
              style={styles.container}
              renderItem={({item, index}) => (
                <ChapterCard
                  item={item}
                  index={index}
                  isBookmark={false}
                  detailPageLink={PageLink}
                  sampleSeries={sampleSeries}
                  isFirst={index === 0}
                />
              )}
              keyExtractor={(item, index) =>
                item?.link ? `${item.link}-${index}` : `ad-${index}`
              }
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isChapterTab && !sampleSeries ? (
                  <PaginationFooter
                    pagination={ComicDetail?.pagination}
                    pageLink={PageLink}
                    route={route}
                    navigation={navigation}
                  />
                ) : null
              }
              keyboardShouldPersistTaps="handled"
            />
            {/* Continue Reading FAB - show on Chapters and Recent tabs when there's reading history */}
            {(isChapterTab || isRecentTab) && lastReadChapter && (
              <ContinueReadingFAB
                visible={true}
                chapterTitle={lastReadChapter.title}
                progress={lastReadChapter.progress}
                currentPage={lastReadChapter.currentPage}
                totalPages={lastReadChapter.totalPages}
                onPress={handleContinueReading}
              />
            )}
          </>
        )}
      </View>
      
      <LoginPrompt
        visible={showLoginPrompt}
        loading={authLoading}
        onClose={handleCloseLoginPrompt}
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    padding: 0,
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
  },
});
