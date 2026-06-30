import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';

import {NovelCard} from '../Components/NovelCard';
import {getNovelsByGenre, getLatestNovels, getCompletedNovels} from '../APIs';
import {NAVIGATION} from '../../../Constants';

const {width} = Dimensions.get('window');

/**
 * Generate a safe key from a novel item
 */
const getNovelKey = (item, index) => {
  if (item?.link) {
    // Extract the slug from the URL and sanitize it
    const slug = item.link.split('/book/')[1] || item.link;
    const sanitized = slug.replace(/[^a-zA-Z0-9]/g, '-');
    return `novel-${sanitized}`;
  }
  return `novel-${index}`;
};

export function NovelViewAll() {
  const navigation = useNavigation();
  const route = useRoute();

  const {title, novels: initialNovels, genre} = route.params || {};

  const [novels, setNovels] = useState(initialNovels || []);
  const [loading, setLoading] = useState(!initialNovels?.length);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialNovels?.length && genre) {
      fetchNovels(1);
    }
  }, [genre, initialNovels]);

  const fetchNovels = useCallback(async (pageNum) => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (genre) {
        data = await getNovelsByGenre(genre, pageNum);
      } else if (title === 'Latest Novels') {
        data = await getLatestNovels(pageNum);
      } else if (title === 'Completed Stories') {
        data = await getCompletedNovels(pageNum);
      } else {
        data = [];
      }

      if (pageNum === 1) {
        setNovels(data);
      } else {
        // Filter out duplicates based on link
        setNovels(prev => {
          const existingLinks = new Set(prev.map(n => n.link));
          const newNovels = data.filter(n => !existingLinks.has(n.link));
          return [...prev, ...newNovels];
        });
      }

      setHasMore(data.length > 0);
    } catch (err) {
      console.error('Error fetching novels:', err);
      crashlytics().recordError(err);
      setError('Failed to load novels.');
    } finally {
      setLoading(false);
    }
  }, [genre, title]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNovels(nextPage);
    }
  }, [loading, hasMore, page, fetchNovels]);

  const handleNovelPress = useCallback((novel) => {
    navigation.navigate(NAVIGATION.novelDetails, {novel});
  }, [navigation]);

  const renderItem = useCallback(({item}) => (
    <NovelCard
      novel={item}
      onPress={handleNovelPress}
      style={styles.novelCard}
    />
  ), [handleNovelPress]);

  const renderFooter = useCallback(() => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color="#667EEA" />
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title || 'All Novels'}</Text>
          <Text style={styles.count}>{novels.length} novels</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={novels}
        keyExtractor={getNovelKey}
        renderItem={renderItem}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#14142A',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  count: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  novelCard: {
    width: (width - 48) / 3,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default NovelViewAll;