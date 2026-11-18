import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {NAVIGATION} from '../../Constants';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import crashlytics from '@react-native-firebase/crashlytics';

import analytics from '@react-native-firebase/analytics';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Header from '../../Components/UIComp/Header';
import {getSearchManga} from '../../InkNest-Externals/Screens/Manga/APIs/Search';
import {searchNovels} from '../Novel/APIs';
import {searchableComicSources, searchComics} from '../Comic/APIs/Home';
import {getSourceLabel} from '../../Utils/sourceStatus';
import Image from '../../Components/UIComp/Image';

const emptySearchData = Object.fromEntries(
  [...searchableComicSources, 'Manga', 'Novel'].map(source => [source, []]),
);

export function Search({navigation, route}) {
  const [searchTerm, setSearchTerm] = useState('');
  const initialCategoryFromRoute = route?.params?.initialTab;
  const [activeCategory, setActiveCategory] = useState(
    initialCategoryFromRoute === 'manga'
      ? 'Manga'
      : initialCategoryFromRoute === 'novel'
      ? 'Novels'
      : initialCategoryFromRoute === 'comic'
      ? 'Comics'
      : 'All',
  );
  const [searchData, setSearchData] = useState(emptySearchData);
  const [isSearching, setIsSearching] = useState(false);
  const [activeSource, setActiveSource] = useState('All'); // Selected source after search
  const flatlistRef = useRef();

  // Category definitions (shown before search)
  const CATEGORIES = [
    {id: 'All', label: 'All', icon: 'globe-outline', color: '#667EEA'},
    {id: 'Comics', label: 'Comics', icon: 'images-outline', color: '#FF9090'},
    {id: 'Manga', label: 'Manga', icon: 'book-outline', color: '#007AFF'},
    {
      id: 'Novels',
      label: 'Novels',
      icon: 'document-text-outline',
      color: '#9C27B0',
    },
  ];

  // Base source definitions
  const BASE_SOURCES = {
    All: {
      id: 'All',
      label: 'All Sources',
      icon: 'globe-outline',
      color: '#667EEA',
      category: 'All',
    },
    // Manga source
    Manga: {
      id: 'Manga',
      label: 'Manga',
      icon: 'book',
      color: '#007AFF',
      category: 'Manga',
    },
    // Novel source
    Novel: {
      id: 'Novel',
      label: 'Novel',
      icon: 'document-text',
      color: '#9C27B0',
      category: 'Novels',
    },
  };

  const comicSources = searchableComicSources.map(id => ({
    id, label: getSourceLabel(id), icon: 'images', color: '#FF9090', category: 'Comics',
  }));
  const otherSources = activeCategory === 'Novels'
    ? [BASE_SOURCES.Novel, BASE_SOURCES.Manga]
    : [BASE_SOURCES.Manga, BASE_SOURCES.Novel];
  const SOURCES = activeCategory === 'Manga' || activeCategory === 'Novels'
    ? [BASE_SOURCES.All, ...otherSources, ...comicSources]
    : [BASE_SOURCES.All, ...comicSources, ...otherSources];

  const getCombinedResults = () => {
    const results = [];
    const selection = showSources ? activeSource : activeCategory;
    for (const source of searchableComicSources) {
      if (selection === 'All' || selection === 'Comics' || selection === source) {
        results.push(...searchData[source].map(item => ({...item, type: source})));
      }
    }
    if (selection === 'All' || selection === 'Manga') {
      results.push(...searchData.Manga.map(item => ({...item, type: 'Manga'})));
    }
    if (selection === 'All' || selection === 'Novel' || selection === 'Novels') {
      results.push(...searchData.Novel.map(item => ({...item, type: 'Novel'})));
    }
    return results;
  };

  // Get total count for category badge
  const getCategoryCount = categoryId => {
    if (categoryId === 'All') {
      return Object.values(searchData).reduce(
        (sum, arr) => sum + (arr?.length || 0),
        0,
      );
    }
    if (categoryId === 'Manga') {
      return searchData.Manga?.length || 0;
    }
    if (categoryId === 'Comics') {
      return searchableComicSources.reduce((count, id) => count + searchData[id].length, 0);
    }
    if (categoryId === 'Novels') {
      return searchData.Novel?.length || 0;
    }
    return 0;
  };

  // Get count for specific source
  const getSourceCount = sourceId => {
    if (sourceId === 'All') {
      return getCategoryCount('All');
    }
    return searchData[sourceId]?.length || 0;
  };

  // Determine if we should show categories or sources (after search with results)
  const showSources =
    searchTerm.trim().length > 0 && getCategoryCount('All') > 0;

  const fetchData = async () => {
    if (isSearching) return;
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    // Clear previous results and reset source selection when starting new search
    setSearchData(emptySearchData);
    setActiveSource('All');

    await analytics().logEvent('search_comic', {
      search: searchTerm?.trim()?.toString(),
      category: activeCategory,
    });

    const query = searchTerm.trim();
    if (/^https?:\/\//i.test(query)) {
      Alert.alert('Search by title', 'Enter a comic, manga, or novel title.');
      setIsSearching(false);
      return;
    }

    const newData = {...emptySearchData};
    const updateResults = (source, result) => {
      newData[source] = result;
      setSearchData({...newData});
    };
    const searchPromises = [];

    if (activeCategory === 'All' || activeCategory === 'Comics') {
      for (const source of searchableComicSources) {
        searchPromises.push(
          searchComics(source, query)
            .then(cards => updateResults(source, cards))
            .catch(() => updateResults(source, [])),
        );
      }
    }

    // Manga source
    if (activeCategory === 'All' || activeCategory === 'Manga') {
      searchPromises.push(
        getSearchManga(query)
          .then(r => updateResults('Manga', r?.mangaList ?? []))
          .catch(e => {
            console.error('Manga search error:', e);
            updateResults('Manga', []);
          }),
      );
    }

    // Novel source
    if (activeCategory === 'All' || activeCategory === 'Novels') {
      searchPromises.push(
        searchNovels(query, 1)
          .then(r => updateResults('Novel', r ?? []))
          .catch(e => {
            console.error('Novel search error:', e);
            updateResults('Novel', []);
          }),
      );
    }

    await Promise.all(searchPromises);

    // Auto-select the first source with results based on active category
    if (activeCategory === 'Manga' && newData.Manga?.length > 0) {
      setActiveSource('Manga');
    } else if (activeCategory === 'Novels' && newData.Novel?.length > 0) {
      setActiveSource('Novel');
    } else {
      setActiveSource('All');
    }
    setIsSearching(false);
  };

  // Render combined results with type badges
  const renderCombinedItem = ({item, index}) => {
    const isEven = index % 2 === 0;
    const type = item?.type;
    const isManga = type === 'Manga';
    const isNovel = type === 'Novel';
    const isComic = searchableComicSources.includes(type);

    // Get type-specific colors and icons
    const typeStyle = isComic
      ? {color: '#FF9090', bgColor: 'rgba(255,144,144,0.15)'}
      : isManga
      ? {color: '#007AFF', bgColor: 'rgba(0,122,255,0.15)'}
      : {color: '#9C27B0', bgColor: 'rgba(156,39,176,0.15)'};

    // Get image source
    const imageUri = item?.coverImage || item?.image;

    // Handle press based on type
    const handlePress = () => {
      if (isComic) {
        navigation.navigate(NAVIGATION.comicDetails, {link: item.link, title: item.title, image: item.image});
      } else if (isManga) {
        navigation.navigate(NAVIGATION.mangaDetails, {
          link: item?.link,
          title: item?.title,
        });
      } else {
        navigation.navigate(NAVIGATION.novelDetails, {novel: item});
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        accessibilityLabel={isComic ? `${item.title}, ${getSourceLabel(type)}` : undefined}
        activeOpacity={0.7}
        style={[styles.mangaCard, isEven && styles.mangaCardEven]}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.mangaCover} />
        ) : (
          <View style={[styles.mangaCover, styles.mangaCoverPlaceholder]}>
            <MaterialCommunityIcons
              name={isNovel ? 'book-open-page-variant' : 'book-open-variant'}
              size={24}
              color="rgba(255,255,255,0.3)"
            />
          </View>
        )}
        <View style={styles.mangaContent}>
          <View style={styles.mangaHeader}>
            <Text style={styles.mangaNumber}>#{index + 1}</Text>
            <View
              style={[
                styles.mangaSourceBadge,
                {backgroundColor: typeStyle.bgColor},
              ]}>
              <Text
                style={[styles.mangaSourceBadgeText, {color: typeStyle.color}]}>
                {isComic ? getSourceLabel(type) : type?.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.mangaTitle} numberOfLines={2}>
            {item?.title}
          </Text>

          {/* Type-specific metadata */}
          <View style={styles.mangaFooter}>
            {isNovel && item?.rank && (
              <Text style={[styles.mangaStatus, {color: '#FFD700'}]}>
                Rank {item.rank}{' '}
              </Text>
            )}
            {isNovel && item?.chapters && (
              <Text style={[styles.mangaStatus, {color: '#4CAF50'}]}>
                {item.chapters} Ch{' '}
              </Text>
            )}
            {isManga && item?.status && (
              <Text
                style={[
                  styles.mangaStatus,
                  {
                    color:
                      item.status.toLowerCase() === 'ongoing'
                        ? '#4CAF50'
                        : '#FF9800',
                  },
                ]}>
                {item.status}{' '}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <View
            style={[styles.arrowCircle, {backgroundColor: typeStyle.bgColor}]}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={typeStyle.color}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <Header style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={heightPercentageToDP('2.5%')}
              color="#FFF"
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Search</Text>
          </View>
          <TouchableOpacity
            style={styles.webSearchBtn}
            onPress={() => {
              crashlytics().log('Advanced Search button clicked');
              analytics().logEvent('advanced_search', {
                click: 'Advanced Search',
              });
              navigation.navigate(NAVIGATION.WebSearch);
            }}>
            <Text style={styles.webSearchText}>Web Search</Text>
          </TouchableOpacity>
        </Header>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color="rgba(255,255,255,0.6)"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Find comics, manga, and novels..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={fetchData}
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="web-search"
            />
            <TouchableOpacity disabled={isSearching} onPress={fetchData}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#667EEA" />
              ) : (
                <View style={styles.sendButton}>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color="#FFF"
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Category/Source Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={showSources ? SOURCES : CATEGORIES}
            renderItem={({item}) => {
              const count = showSources
                ? getSourceCount(item.id)
                : getCategoryCount(item.id);
              const isActive = showSources
                ? activeSource === item.id
                : activeCategory === item.id;

              const handlePress = () => {
                if (showSources) {
                  setActiveSource(item.id);
                  // Also update activeCategory based on source's category
                  if (item.category) {
                    setActiveCategory(item.category);
                  }
                } else {
                  setActiveCategory(item.id);
                }
              };

              return (
                <TouchableOpacity
                  onPress={handlePress}
                  style={[
                    styles.categoryTab,
                    isActive && {
                      backgroundColor: item.color + '20',
                      borderColor: item.color,
                    },
                  ]}>
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isActive ? item.color : 'rgba(255,255,255,0.5)'}
                  />
                  <Text
                    style={[
                      styles.categoryTabText,
                      isActive && {color: item.color},
                    ]}>
                    {item.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.categoryBadge,
                        {backgroundColor: item.color + '30'},
                      ]}>
                      <Text
                        style={[styles.categoryBadgeText, {color: item.color}]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.tabsContent}
          />
        </View>

        {/* Results List */}
        <FlatList
          scrollsToTop
          ref={flatlistRef}
          style={styles.resultsList}
          ListEmptyComponent={() => {
            const totalResults = getCategoryCount('All');
            const hasResultsElsewhere = totalResults > 0;
            const currentSelection = showSources
              ? activeSource
              : activeCategory;
            const currentCount = showSources
              ? getSourceCount(activeSource)
              : getCategoryCount(activeCategory);

            return (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons
                    name={hasResultsElsewhere ? 'book-off' : 'book-search'}
                    size={heightPercentageToDP('8%')}
                    color={hasResultsElsewhere ? '#FF6B6B' : '#667EEA'}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {isSearching
                    ? 'Searching...'
                    : hasResultsElsewhere
                    ? `No results in ${currentSelection}`
                    : 'Ready to explore?'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isSearching
                    ? `Searching ${
                        currentSelection === 'All'
                          ? showSources
                            ? 'all sources'
                            : 'all categories'
                          : currentSelection + ' sources'
                      }...`
                    : hasResultsElsewhere
                    ? 'This selection has no results. Try a different one!'
                    : 'Search for a comic, manga, or novel by title.'}
                </Text>
              </View>
            );
          }}
          data={getCombinedResults()}
          renderItem={renderCombinedItem}
          keyExtractor={(item, index) =>
            `${item?.type}-${
              item?.link || item?.href || index
            }-${index}`
          }
          contentContainerStyle={styles.resultsContent}
          ListFooterComponent={<View style={styles.footerSpace} />}
          maxToRenderPerBatch={15}
          initialNumToRender={10}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    width: '100%',
    height: heightPercentageToDP('5%'),
    backgroundColor: '#14142A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: heightPercentageToDP('2.2%'),
    fontWeight: 'bold',
    color: '#FFF',
  },
  webSearchBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webSearchText: {
    fontSize: heightPercentageToDP('1.5%'),
    fontWeight: '600',
    color: '#667EEA',
  },

  // Search Input
  searchContainer: {
    paddingHorizontal: widthPercentageToDP('4%'),
    paddingVertical: heightPercentageToDP('2%'),
    backgroundColor: '#14142A',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: heightPercentageToDP('6%'),
    color: '#FFF',
    fontSize: 16,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#667EEA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabsContainer: {
    paddingVertical: 8,
    backgroundColor: '#14142A',
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  categoryBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Results List
  resultsList: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  footerSpace: {
    height: heightPercentageToDP('4%'),
  },

  // Result Card
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  resultCardEven: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  resultContent: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 22,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultFooterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 4,
    borderBottomLeftRadius: 4,
    opacity: 0.8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: heightPercentageToDP('15%'),
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // User/Error Messages
  userMessageContainer: {
    flex: 1,
    marginHorizontal: widthPercentageToDP('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    maxWidth: widthPercentageToDP('76%'),
  },
  userMessageBubble: {
    marginVertical: 5,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#667EEA',
    flexDirection: 'row',
    gap: 5,
  },
  userMessageText: {
    fontSize: 14,
    color: '#FFF',
  },
  errorContainer: {
    flex: 1,
    marginHorizontal: widthPercentageToDP('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: widthPercentageToDP('76%'),
  },
  errorBubble: {
    marginVertical: 5,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 0, 79, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 79, 0.3)',
  },
  errorText: {
    color: '#FF004F',
    fontSize: 14,
  },

  // Manga results
  mangaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,122,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  mangaCardEven: {
    backgroundColor: 'rgba(0,122,255,0.07)',
  },
  mangaCover: {
    width: 56,
    height: 78,
    borderRadius: 10,
    marginRight: 14,
  },
  mangaCoverPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mangaContent: {
    flex: 1,
  },
  mangaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mangaNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  mangaSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,122,255,0.2)',
  },
  mangaSourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  mangaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  mangaGenres: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  mangaGenrePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mangaGenreText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  mangaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mangaStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});
