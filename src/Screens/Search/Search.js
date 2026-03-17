import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
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

import {useDispatch, useSelector} from 'react-redux';
import Header from '../../Components/UIComp/Header';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {searchComic} from '../../Redux/Actions/GlobalActions';
import {getSearchManga} from '../../InkNest-Externals/Screens/Manga/APIs/Search';
import {searchNovels} from '../Novel/APIs';
import Image from '../../Components/UIComp/Image';

// Generate a consistent gradient color based on string
const getGradientColors = str => {
  const colors = [
    ['#FF6B6B', '#EE5A6F'],
    ['#4ECDC4', '#44A08D'],
    ['#667EEA', '#764BA2'],
    ['#F093FB', '#F5576C'],
    ['#4FACFE', '#00F2FE'],
    ['#43E97B', '#38F9D7'],
    ['#FA709A', '#FEE140'],
    ['#A8EDEA', '#FED6E3'],
    ['#FF9A9E', '#FECFEF'],
    ['#FFECD2', '#FCB69F'],
  ];
  let hash = 0;
  for (let i = 0; i < str?.length || 0; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from title
const getInitials = title => {
  if (!title) return '?';
  const words = title.trim().split(/\s+/);
  if (words.length === 1) {
    return title.substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Comic badge component
const ComicBadge = ({text, colors}) => (
  <View style={[styles.badge, {backgroundColor: colors[0] + '30'}]}>
    <Text style={[styles.badgeText, {color: colors[0]}]}>{text}</Text>
  </View>
);

export function Search({navigation, route}) {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.data.loading);
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
  const [viewAll, setViewAll] = useState(null);
  const [searchData, setSearchData] = useState({
    ReadAllComic: [],
    ComicHub: [],
    ComicOnline: [],
    Manga: [],
    Novel: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [activeSource, setActiveSource] = useState('All'); // Selected source after search
  const flatlistRef = useRef();
  let Tag = View;

  // Category definitions (shown before search)
  const CATEGORIES = [
    {id: 'All', label: 'All', icon: 'globe-outline', color: '#667EEA'},
    {id: 'Comics', label: 'Comics', icon: 'images-outline', color: '#FF6B6B'},
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
    // Comic sources
    ReadAllComic: {
      id: 'ReadAllComic',
      label: 'ReadAllComic',
      icon: 'images',
      color: '#FF6B6B',
      category: 'Comics',
    },
    ComicHub: {
      id: 'ComicHub',
      label: 'ComicHub',
      icon: 'images',
      color: '#FF8E53',
      category: 'Comics',
    },
    ComicOnline: {
      id: 'ComicOnline',
      label: 'ComicOnline',
      icon: 'images',
      color: '#FFA726',
      category: 'Comics',
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

  // Get ordered sources based on active category (selected category's sources come first)
  const getOrderedSources = () => {
    const allSources = [BASE_SOURCES.All];
    const comicSources = [
      BASE_SOURCES.ReadAllComic,
      BASE_SOURCES.ComicHub,
      BASE_SOURCES.ComicOnline,
    ];
    const mangaSources = [BASE_SOURCES.Manga];
    const novelSources = [BASE_SOURCES.Novel];

    // Order based on active category
    if (activeCategory === 'Manga') {
      return [...allSources, ...mangaSources, ...comicSources, ...novelSources];
    } else if (activeCategory === 'Novels') {
      return [...allSources, ...novelSources, ...comicSources, ...mangaSources];
    } else if (activeCategory === 'Comics') {
      return [...allSources, ...comicSources, ...mangaSources, ...novelSources];
    }
    // Default (All) - current order
    return [...allSources, ...comicSources, ...mangaSources, ...novelSources];
  };

  const SOURCES = getOrderedSources();

  // Determine if we should show categories or sources
  // (defined after getCategoryCount to avoid reference error)

  // Get combined results based on active category or selected source
  const getCombinedResults = () => {
    const allResults = [];

    // If showing sources (after search), filter by selected source
    if (showSources) {
      if (activeSource === 'All') {
        // Add all results
        searchData.ReadAllComic?.forEach(item => {
          allResults.push({...item, sourceType: 'ReadAllComic', type: 'Comic'});
        });
        searchData.ComicHub?.forEach(item => {
          allResults.push({...item, sourceType: 'ComicHub', type: 'Comic'});
        });
        searchData.ComicOnline?.forEach(item => {
          allResults.push({...item, sourceType: 'ComicOnline', type: 'Comic'});
        });
        searchData.Manga?.forEach(item => {
          allResults.push({...item, sourceType: 'Manga', type: 'Manga'});
        });
        searchData.Novel?.forEach(item => {
          allResults.push({...item, sourceType: 'Novel', type: 'Novel'});
        });
      } else {
        // Filter by specific source
        const sourceType =
          activeSource === 'Manga'
            ? 'Manga'
            : activeSource === 'Novel'
            ? 'Novel'
            : 'Comic';
        searchData[activeSource]?.forEach(item => {
          allResults.push({
            ...item,
            sourceType: activeSource,
            type: sourceType,
          });
        });
      }
      return allResults;
    }

    // Otherwise, filter by category (before search)
    if (activeCategory === 'All' || activeCategory === 'Comics') {
      searchData.ReadAllComic?.forEach(item => {
        allResults.push({...item, sourceType: 'ReadAllComic', type: 'Comic'});
      });
      searchData.ComicHub?.forEach(item => {
        allResults.push({...item, sourceType: 'ComicHub', type: 'Comic'});
      });
      searchData.ComicOnline?.forEach(item => {
        allResults.push({...item, sourceType: 'ComicOnline', type: 'Comic'});
      });
    }

    if (activeCategory === 'All' || activeCategory === 'Manga') {
      searchData.Manga?.forEach(item => {
        allResults.push({...item, sourceType: 'Manga', type: 'Manga'});
      });
    }

    if (activeCategory === 'All' || activeCategory === 'Novels') {
      searchData.Novel?.forEach(item => {
        allResults.push({...item, sourceType: 'Novel', type: 'Novel'});
      });
    }

    return allResults;
  };

  // Get total count for category badge
  const getCategoryCount = categoryId => {
    if (categoryId === 'All') {
      return Object.values(searchData).reduce(
        (sum, arr) => sum + (arr?.length || 0),
        0,
      );
    }
    if (categoryId === 'Comics') {
      return (
        (searchData.ReadAllComic?.length || 0) +
        (searchData.ComicHub?.length || 0) +
        (searchData.ComicOnline?.length || 0)
      );
    }
    if (categoryId === 'Manga') {
      return searchData.Manga?.length || 0;
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
    setSearchData({
      ReadAllComic: [],
      ComicHub: [],
      ComicOnline: [],
      Manga: [],
      Novel: [],
    });
    setActiveSource('All');

    await analytics().logEvent('search_comic', {
      search: searchTerm?.trim()?.toString(),
      category: activeCategory,
    });

    let link = searchTerm.trim();
    if (
      (!link.startsWith('https://comichubfree.com/comic/') &&
        !link.startsWith('https://readcomicsonline.ru/comic/') &&
        !link.startsWith('https://readallcomics.com/category/')) ||
      (!link.includes('comic/') && !link.includes('category/'))
    ) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        Alert.alert('Invalid link', 'Please enter a valid comic link');
        setIsSearching(false);
        return;
      }

      // Reset search data
      const newData = {
        ReadAllComic: [],
        ComicHub: [],
        ComicOnline: [],
        Manga: [],
        Novel: [],
      };

      const updateResults = (source, result) => {
        newData[source] = result;
        setSearchData({...newData});
      };

      // Build search promises based on active category
      const searchPromises = [];

      // Comics sources
      if (activeCategory === 'All' || activeCategory === 'Comics') {
        searchPromises.push(
          dispatch(searchComic(link, 'readcomicsonline'))
            .then(r => updateResults('ComicOnline', r ?? []))
            .catch(e => {
              console.error('ComicOnline search error:', e);
              updateResults('ComicOnline', []);
            }),
          dispatch(searchComic(link, 'comichubfree'))
            .then(r => updateResults('ComicHub', r ?? []))
            .catch(e => {
              console.error('ComicHub search error:', e);
              updateResults('ComicHub', []);
            }),
          dispatch(searchComic(link, 'readallcomics'))
            .then(r => updateResults('ReadAllComic', r ?? []))
            .catch(e => {
              console.error('ReadAllComic search error:', e);
              updateResults('ReadAllComic', []);
            }),
        );
      }

      // Manga source
      if (activeCategory === 'All' || activeCategory === 'Manga') {
        searchPromises.push(
          getSearchManga(link)
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
          searchNovels(link, 1)
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
      } else if (activeCategory === 'Comics') {
        // Select first comic source with results
        if (newData.ReadAllComic?.length > 0) setActiveSource('ReadAllComic');
        else if (newData.ComicHub?.length > 0) setActiveSource('ComicHub');
        else if (newData.ComicOnline?.length > 0)
          setActiveSource('ComicOnline');
        else setActiveSource('All');
      } else {
        setActiveSource('All');
      }

      setIsSearching(false);
      return;
    }
    link = link.replace(/\/\d+$/, '');
    navigation.navigate(NAVIGATION.comicDetails, {link});
    setIsSearching(false);
  };

  // Render combined results with type badges
  const renderCombinedItem = ({item, index}) => {
    const isEven = index % 2 === 0;
    const type = item?.type;
    const isManga = type === 'Manga';
    const isNovel = type === 'Novel';
    const isComic = type === 'Comic';

    // Get type-specific colors and icons
    const getTypeStyle = () => {
      if (isManga) return {color: '#007AFF', bgColor: 'rgba(0,122,255,0.15)'};
      if (isNovel) return {color: '#9C27B0', bgColor: 'rgba(156,39,176,0.15)'};
      return {color: '#667EEA', bgColor: 'rgba(102,126,234,0.15)'};
    };
    const typeStyle = getTypeStyle();

    // Get image source
    const imageUri = item?.coverImage || item?.image;

    // Handle press based on type
    const handlePress = () => {
      if (isManga) {
        navigation.navigate(NAVIGATION.mangaDetails, {
          link: item?.link,
          title: item?.title,
        });
      } else if (isNovel) {
        navigation.navigate(NAVIGATION.novelDetails, {novel: item});
      } else {
        navigation.navigate(NAVIGATION.comicDetails, {
          link: item?.link || item?.href,
          title: item?.title,
        });
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
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
                {type?.toUpperCase()}
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
            {isComic && item?.sourceType && (
              <Text style={[styles.mangaStatus, {color: '#667EEA'}]}>
                {item.sourceType}
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
                    : 'Search for your favorite comics, manga, and novels across multiple sources'}
                </Text>
              </View>
            );
          }}
          data={getCombinedResults()}
          renderItem={renderCombinedItem}
          keyExtractor={(item, index) =>
            `${item?.sourceType || item?.type}-${
              item?.link || item?.href || index
            }-${index}`
          }
          contentContainerStyle={styles.resultsContent}
          ListFooterComponent={<View style={styles.footerSpace} />}
          maxToRenderPerBatch={15}
          initialNumToRender={10}
        />

        {/* View All Modal */}
        <Modal
          transparent
          animationType="slide"
          visible={viewAll !== null}
          onRequestClose={() => setViewAll(null)}>
          <TouchableOpacity
            onPress={() => setViewAll(null)}
            activeOpacity={1}
            style={styles.modalOverlay}
          />
          <Tag intensity={10} tint="light" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Results</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setViewAll(null)}>
                  <AntDesign name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={viewAll ?? []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => {
                  const colors = getGradientColors(item.title);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate(NAVIGATION.comicDetails, {
                          link: item.href,
                          title: item.title,
                        });
                        setViewAll(null);
                      }}
                      style={styles.modalItem}>
                      <View
                        style={[
                          styles.modalAvatar,
                          {backgroundColor: colors[0]},
                        ]}>
                        <Text style={styles.modalAvatarText}>
                          {getInitials(item.title)}
                        </Text>
                      </View>
                      <Text style={styles.modalItemText}>{item.title}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="rgba(255,255,255,0.3)"
                      />
                    </TouchableOpacity>
                  );
                }}
                ListFooterComponent={<View style={styles.footerSpace} />}
              />
            </View>
          </Tag>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    width: '100%',
    height: heightPercentageToDP('5%'),
    backgroundColor: '#0F0F1A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
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
    backgroundColor: '#0F0F1A',
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
    backgroundColor: '#0F0F1A',
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
    backgroundColor: '#0F0F1A',
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

  // Modal
  modalOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: '#1A1A2E',
    flex: 1,
    maxHeight: heightPercentageToDP('70%'),
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalContent: {
    flexGrow: 1,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalItemText: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
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

  // ReadAllComic results
  readAllComicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  readAllComicCardEven: {
    backgroundColor: 'rgba(102, 126, 234, 0.07)',
  },
  readAllComicCover: {
    width: 60,
    height: 84,
    borderRadius: 10,
    marginRight: 14,
  },
  readAllComicCoverPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readAllComicContent: {
    flex: 1,
  },
  readAllComicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  readAllComicNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  readAllComicSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  readAllComicSourceBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#667EEA',
    letterSpacing: 0.5,
  },
  readAllComicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 20,
    marginBottom: 6,
  },
  readAllComicInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  readAllComicInfoText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  readAllComicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  readAllComicMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readAllComicMetaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  readAllComicLatestChapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  readAllComicLatestChapterText: {
    fontSize: 10,
    color: '#667EEA',
    fontWeight: '600',
    flex: 1,
  },
});
