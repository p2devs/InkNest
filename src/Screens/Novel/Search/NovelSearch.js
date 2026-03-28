import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';

import {NovelCard} from '../Components/NovelCard';
import {searchNovels} from '../APIs';
import {NAVIGATION} from '../../../Constants';

const GENRES = [
  'Action', 'Adventure', 'Fantasy', 'Romance', 'Martial Arts',
  'Sci-fi', 'Supernatural', 'Slice of Life', 'Horror', 'Comedy',
  'Drama', 'Mystery', 'Psychological', 'School Life', 'Seinen',
  'Shoujo', 'Shounen', 'Xianxia', 'Xuanhuan',
];

export function NovelSearch() {
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleSearch = useCallback(async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setShowHistory(false);
      setPage(1);
      setHasMore(true);
      Keyboard.dismiss();

      const data = await searchNovels(searchQuery, 1);
      setResults(data || []);

      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 10);
        return newHistory;
      });

      crashlytics().log(`Novel search: ${searchQuery}`);
    } catch (err) {
      console.error('Error searching novels:', err);
      crashlytics().recordError(err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !query.trim()) {
      return;
    }

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await searchNovels(query, nextPage);

      if (data && data.length > 0) {
        // Filter out duplicates
        setResults(prev => {
          const existingLinks = new Set(prev.map(n => n.link));
          const newNovels = data.filter(n => !existingLinks.has(n.link));
          return [...prev, ...newNovels];
        });
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more novels:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, query, page]);

  const handleNovelPress = useCallback((novel) => {
    navigation.navigate(NAVIGATION.novelDetails, {novel});
  }, [navigation]);

  const handleGenrePress = useCallback((genre) => {
    navigation.navigate(NAVIGATION.novelViewAll, {
      title: genre,
      genre,
    });
  }, [navigation]);

  const handleHistoryPress = useCallback((historyQuery) => {
    setQuery(historyQuery);
    handleSearch(historyQuery);
  }, [handleSearch]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const renderNovel = useCallback(({item}) => (
    <NovelCard
      novel={item}
      onPress={handleNovelPress}
      style={styles.novelCard}
    />
  ), [handleNovelPress]);

  const renderGenre = useCallback((genre) => (
    <TouchableOpacity
      key={genre}
      style={styles.genreTag}
      onPress={() => handleGenrePress(genre)}>
      <Text style={styles.genreText}>{genre}</Text>
    </TouchableOpacity>
  ), [handleGenrePress]);

  const renderHistoryItem = useCallback(({item}) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item)}>
      <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.4)" />
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  ), [handleHistoryPress]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search novels..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showHistory && searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchHistory}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={renderHistoryItem}
          />
        </View>
      )}

      {showHistory && (
        <View style={styles.genresSection}>
          <Text style={styles.sectionTitle}>Browse by Genre</Text>
          <View style={styles.genresGrid}>
            {GENRES.map(renderGenre)}
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => handleSearch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && !showHistory && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.emptyText}>No novels found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      )}

      {!loading && !error && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.link || index}`}
          renderItem={renderNovel}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsList}
          columnWrapperStyle={styles.resultsRow}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#667EEA" />
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  historySection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearText: {
    color: '#667EEA',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  historyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  genresSection: {
    paddingHorizontal: 16,
    flex: 1,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  genreTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  genreText: {
    color: '#667EEA',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: '#667EEA',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 4,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  resultsRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  novelCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NovelSearch;