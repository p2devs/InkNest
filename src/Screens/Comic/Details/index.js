import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
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
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import PaginationFooter from './Components/FooterPagination';
import {rewardAdsShown} from '../../../Redux/Reducers';
import {showRewardedAd} from '../../../InkNest-Externals/Redux/Actions/Download';

const IOS_PLACEHOLDER_CHAPTERS = [
  {
    link: 'https://comicbookplus.com/?dlid=16848',
    date: 'December 4, 2010',
    title: 'Issues 1',
  },
  {
    link: 'https://comicbookplus.com/?dlid=15946',
    date: 'November 27, 2010',
    title: 'Issues 2',
  },
  {
    link: 'https://comicbookplus.com/?dlid=16857',
    date: 'December 4, 2010',
    title: 'Issues 3',
  },
  {
    link: 'https://comicbookplus.com/?cid=860',
    date: 'August 7, 2015',
    title: 'Issues 4',
  },
];

export function ComicDetails({route, navigation}) {
  const [PageLink] = useState(route?.params?.link);
  const [tabBar, setTabBar] = useState([{name: 'Chapters', active: true}]);
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  const [sort, setSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dispatch = useDispatch();

  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);
  const hasRewardAdsShown = useSelector(state => state.data.hasRewardAdsShown);
  const historyKey = useMemo(() => PageLink?.split('?')[0] ?? '', [PageLink]);
  const readingHistory = useSelector(state => state.data.history[historyKey]);

  const appVersion = useMemo(() => getVersion(), []);
  const isIosOverrideActive =
    !forIosLoading && appVersion === forIosValue && !!forIosValue;

  const availableChapters = useMemo(() => {
    if (isIosOverrideActive) {
      return IOS_PLACEHOLDER_CHAPTERS;
    }
    return ComicDetail?.chapters ?? [];
  }, [ComicDetail?.chapters, isIosOverrideActive]);

  const sortedChapters = useMemo(() => {
    if (isIosOverrideActive) {
      return IOS_PLACEHOLDER_CHAPTERS;
    }
    const baseList = [...availableChapters];
    return sort ? baseList.reverse() : baseList;
  }, [availableChapters, sort, isIosOverrideActive]);

  const activeTab = useMemo(
    () => tabBar.find(tab => tab.active)?.name ?? 'Chapters',
    [tabBar],
  );
  const isChapterTab = activeTab === 'Chapters';
  const isRecentTab = activeTab === 'Recent';

  const recentChapters = useMemo(() => {
    if (!isRecentTab || !readingHistory?.readComics) {
      return [];
    }

    const chapterMap = new Map();
    availableChapters.forEach(chapter => {
      if (!chapter?.link) return;
      chapterMap.set(chapter.link, chapter);
      const normalized = chapter.link.split('?')[0];
      chapterMap.set(normalized, chapter);
    });

    return Object.entries(readingHistory.readComics)
      .map(([chapterLink, meta]) => {
        const normalized = chapterLink?.split('?')[0];
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
  }, [availableChapters, isRecentTab, readingHistory?.readComics]);

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
    return AppendAd(filteredChapters);
  }, [filteredChapters, filteredRecentChapters, forIosLoading, isRecentTab]);

  const reportError = useCallback((message, err) => {
    try {
      crashlytics().log(message);
      if (err) {
        crashlytics().recordError(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    } catch (_) {
      // Avoid crashing the UI if Crashlytics logging fails.
    }
  }, []);

  const handleSortToggle = useCallback(() => {
    crashlytics().log('Comic Details Sort Clicked');
    analytics().logEvent('Comic_Details_Sort_Clicked');
    setSort(prev => !prev);
  }, []);

  useEffect(() => {
    (async () => {
      if (!hasRewardAdsShown) {
        try {
          crashlytics().log('Reward Ads Shown');
          analytics().logEvent('Reward_Ads_Shown');
          await showRewardedAd();
          dispatch(rewardAdsShown(true));
        } catch (err) {
          reportError('Failed to display rewarded ad', err);
        }
      }
    })();
  }, [dispatch, hasRewardAdsShown, reportError]);

  useEffect(() => {
    if (readingHistory?.readComics) {
      setTabBar(prev => [
        {name: 'Recent', active: true},
        {name: 'Chapters', active: false},
        ...prev.filter(tab => tab.name !== 'Recent' && tab.name !== 'Chapters'),
      ]);
    }
  }, [readingHistory?.readComics]);

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

  if (error) return <Error error={error} />;

  return (
    <>
      <LoadingModal loading={loading} />
      <FlatList
        ListHeaderComponent={
          <>
            <HeaderComponent
              link={PageLink}
              image={route?.params?.image}
              title={route?.params?.title}
              tabBar={tabBar}
              onTabBar={index => {
                crashlytics().log('Comic Details Tab Clicked');
                analytics().logEvent('Comic_Details_Tab_Clicked', {
                  TabName: tabBar[index].name?.toString(),
                });
                setTabBar(prev =>
                  prev.map((tab, tabIndex) => ({
                    ...tab,
                    active: tabIndex === index,
                  })),
                );
              }}
            />
            {shouldShowSearch ? (
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
            ) : null}
          </>
        }
        data={listData}
        style={styles.container}
        renderItem={({item, index}) => (
          <ChapterCard
            item={item}
            index={index}
            isBookmark={false}
            detailPageLink={PageLink}
          />
        )}
        keyExtractor={(item, index) =>
          item?.link ? `${item.link}-${index}` : `ad-${index}`
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isChapterTab ? (
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
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
  searchPlaceholder: {
    flex: 1,
    minHeight: 44,
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
