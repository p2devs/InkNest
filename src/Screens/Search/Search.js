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
import Image from '../../Components/UIComp/Image';

// Generate a consistent gradient color based on string
const getGradientColors = (str) => {
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
const getInitials = (title) => {
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
  const initialTab = route?.params?.initialTab === 'manga' ? 'Manga' : 'ReadAllComic';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [viewAll, setViewAll] = useState(null);
  const [searchData, setSearchData] = useState({
    ReadAllComic: [],
    ComicHub: [],
    ComicOnline: [],
    Manga: [],
  });
  const [sortedSources, setSortedSources] = useState(['ReadAllComic', 'ComicHub', 'ComicOnline', 'Manga']);
  const flatlistRef = useRef();
  let Tag = View;

  // Sort sources by result count — fewer results first
  const updateSourcesOrder = (data) => {
    const sourcesWithCounts = [
      {name: 'ReadAllComic', count: data.ReadAllComic?.length || 0},
      {name: 'ComicHub', count: data.ComicHub?.length || 0},
      {name: 'ComicOnline', count: data.ComicOnline?.length || 0},
      {name: 'Manga', count: data.Manga?.length || 0},
    ];
    
    // Sort by count ascending — shorter results come first
    sourcesWithCounts.sort((a, b) => a.count - b.count);
    
    const sorted = sourcesWithCounts.map(s => s.name);
    setSortedSources(sorted);
    
    // Set active tab to the source with most results (if any have results)
    const bestSource = [...sourcesWithCounts].reverse().find(s => s.count > 0);
    if (bestSource) {
      setActiveTab(bestSource.name);
    }
  };

  const fetchData = async () => {
    if (loading) return;
    if (!searchTerm.trim()) return;

    await analytics().logEvent('search_comic', {
      search: searchTerm?.trim()?.toString(),
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
        return;
      }

      // Fire all searches in parallel but show results as they arrive
      const newData = {
        ReadAllComic: [],
        ComicHub: [],
        ComicOnline: [],
        Manga: [],
      };

      const updateResults = (source, result) => {
        newData[source] = result;
        setSearchData({...newData});
        updateSourcesOrder({...newData});
      };

      await Promise.all([
        dispatch(searchComic(link, 'readcomicsonline')).then(r =>
          updateResults('ComicOnline', r ?? []),
        ),
        dispatch(searchComic(link, 'comichubfree')).then(r =>
          updateResults('ComicHub', r ?? []),
        ),
        dispatch(searchComic(link, 'readallcomics')).then(r =>
          updateResults('ReadAllComic', r ?? []),
        ),
        getSearchManga(link)
          .then(r => updateResults('Manga', r?.mangaList ?? []))
          .catch(e => {
            console.error('Manga search error:', e);
            updateResults('Manga', []);
          }),
      ]);

      return;
    }
    link = link.replace(/\/\d+$/, '');
    navigation.navigate(NAVIGATION.comicDetails, {link});
  };

  const renderMangaItem = ({item, index}) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(NAVIGATION.mangaDetails, {
            link: item?.link,
            title: item?.title,
          });
        }}
        activeOpacity={0.7}
        style={[styles.mangaCard, isEven && styles.mangaCardEven]}>
        {item?.image ? (
          <Image
            source={{uri: item.image}}
            style={styles.mangaCover}
          />
        ) : (
          <View style={[styles.mangaCover, styles.mangaCoverPlaceholder]}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <View style={styles.mangaContent}>
          <View style={styles.mangaHeader}>
            <Text style={styles.mangaNumber}>#{index + 1}</Text>
            <View style={styles.mangaSourceBadge}>
              <Text style={styles.mangaSourceBadgeText}>MANGA</Text>
            </View>
          </View>
          <Text style={styles.mangaTitle} numberOfLines={2}>{item?.title}</Text>
          {item?.genres?.length > 0 && (
            <View style={styles.mangaGenres}>
              {item.genres.slice(0, 2).map((genre, i) => (
                <View key={i} style={styles.mangaGenrePill}>
                  <Text style={styles.mangaGenreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.mangaFooter}>
            {item?.status && (
              <Text style={[
                styles.mangaStatus,
                {color: item.status.toLowerCase() === 'ongoing' ? '#4CAF50' : '#FF9800'},
              ]}>
                {item.status}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowCircle, {backgroundColor: 'rgba(0,122,255,0.15)'}]}>
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({item, index}) => {
    if (item.user === 'user') {
      return (
        <View style={styles.userMessageContainer}>
          <Tag intensity={60} tint="dark" style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>{item.query}</Text>
          </Tag>
        </View>
      );
    }

    if (item.user === 'error') {
      return (
        <View style={styles.errorContainer}>
          <Tag intensity={60} tint="dark" style={styles.errorBubble}>
            <Text style={styles.errorText}>{item.error}</Text>
          </Tag>
        </View>
      );
    }

    const colors = getGradientColors(item?.title);
    const initials = getInitials(item?.title);
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(NAVIGATION.comicDetails, {
            link: item?.link,
            title: item?.title,
          });
        }}
        activeOpacity={0.7}
        style={[styles.resultCard, isEven && styles.resultCardEven]}>
        {/* Avatar with gradient */}
        <View
          style={[
            styles.avatar,
            {backgroundColor: colors[0]},
            isEven && {backgroundColor: colors[1]},
          ]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultNumber}>#{index + 1}</Text>
            <ComicBadge text={activeTab} colors={colors} />
          </View>
          
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item?.title}
          </Text>
          
          <View style={styles.resultFooter}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={12}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.resultFooterText}>Tap to read</Text>
          </View>
        </View>

        {/* Arrow indicator */}
        <View style={styles.arrowContainer}>
          <View
            style={[
              styles.arrowCircle,
              {backgroundColor: colors[0] + '20'},
            ]}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors[0]}
            />
          </View>
        </View>

        {/* Decorative corner accent */}
        <View
          style={[
            styles.cornerAccent,
            {backgroundColor: colors[0]},
            isEven && {backgroundColor: colors[1]},
          ]}
        />
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
              placeholder="Find comics and manga..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={fetchData}
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="web-search"
            />
            <TouchableOpacity disabled={loading} onPress={fetchData}>
              {loading ? (
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

        {/* Source Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={sortedSources.filter(s => (searchData[s]?.length || 0) > 0 || s === activeTab)}
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => setActiveTab(item)}
                style={[
                  styles.tabButton,
                  activeTab === item && styles.tabButtonActive,
                ]}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === item && styles.tabTextActive,
                  ]}>
                  {item}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    activeTab === item && styles.tabBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.tabBadgeText,
                      activeTab === item && styles.tabBadgeTextActive,
                    ]}>
                    {searchData[item]?.length || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.tabsContent}
          />
        </View>

        {/* Results List */}
        <FlatList
          scrollsToTop
          ref={flatlistRef}
          style={styles.resultsList}
          ListEmptyComponent={() => {
            // Check if any source has results
            const totalResults = Object.values(searchData).reduce(
              (sum, arr) => sum + (arr?.length || 0),
              0
            );
            const hasResultsElsewhere = totalResults > 0;
            const isSearching = loading;
            
            return (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons
                    name={hasResultsElsewhere ? "book-off" : "book-search"}
                    size={heightPercentageToDP('8%')}
                    color={hasResultsElsewhere ? "#FF6B6B" : "#667EEA"}
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {isSearching
                    ? 'Searching...'
                    : hasResultsElsewhere 
                      ? `No results in ${activeTab}` 
                      : 'Ready to explore?'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {isSearching
                    ? 'Looking across all sources'
                    : hasResultsElsewhere 
                      ? 'This source has no results. Check the other tabs above!' 
                      : 'Search for your favorite comics and manga across multiple sources'}
                </Text>
              </View>
            );
          }}
          data={searchData?.[activeTab ?? 'ComicOnline'] ?? []}
          renderItem={activeTab === 'Manga' ? renderMangaItem : renderItem}
          keyExtractor={(item, index) => index.toString()}
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
          <Tag
            intensity={10}
            tint="light"
            style={styles.modalContainer}>
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
                ListFooterComponent={
                  <View style={styles.footerSpace} />
                }
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
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#667EEA',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  tabBadgeTextActive: {
    color: '#FFF',
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
});
