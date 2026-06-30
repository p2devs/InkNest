import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * ChapterList Component
 * Displays a virtualized list of chapters with sort functionality
 */
export function ChapterList({
  chapters,
  currentChapter,
  onChapterPress,
  downloadedChapters = [],
  sortAscending = true,
  onSortToggle,
  loading = false,
  chapterProgress = {}, // {chapterLink: {scrollProgress, completed, lastReadAt}}
  style,
}) {
  const [sortOrder, setSortOrder] = useState(sortAscending ? 'asc' : 'desc');

  const sortedChapters = [...(chapters || [])].sort((a, b) => {
    if (sortOrder === 'asc') {
      return (a.number || 0) - (b.number || 0);
    }
    return (b.number || 0) - (a.number || 0);
  });

  const handleSortToggle = useCallback(() => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onSortToggle?.(newOrder === 'asc');
  }, [sortOrder, onSortToggle]);

  const isChapterDownloaded = useCallback((chapterNumber) => {
    return downloadedChapters.includes(chapterNumber);
  }, [downloadedChapters]);

  const isCurrentChapter = useCallback((chapterNumber) => {
    return currentChapter === chapterNumber;
  }, [currentChapter]);

  const getChapterProgress = useCallback((chapterLink) => {
    return chapterProgress?.[chapterLink];
  }, [chapterProgress]);

  const renderItem = useCallback(({item}) => {
    const isDownloaded = isChapterDownloaded(item.number);
    const isCurrent = isCurrentChapter(item.number);
    const progress = getChapterProgress(item.link);
    const isCompleted = progress?.completed;
    const scrollProgress = progress?.scrollProgress || 0;

    return (
      <TouchableOpacity
        style={[
          styles.chapterItem,
          isCurrent && styles.currentChapter,
        ]}
        onPress={() => onChapterPress?.(item)}
        activeOpacity={0.7}>
        <View style={styles.chapterInfo}>
          <View style={styles.chapterTitleRow}>
            <Text style={[
              styles.chapterNumber,
              isCurrent && styles.currentChapterText,
            ]}>
              Chapter {item.number}
            </Text>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.completedIcon} />
            )}
          </View>
          {item.title && (
            <Text style={styles.chapterTitle} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {/* Progress bar */}
          {!isCompleted && scrollProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${scrollProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{Math.round(scrollProgress)}%</Text>
            </View>
          )}
        </View>
        <View style={styles.chapterMeta}>
          {isDownloaded && (
            <Ionicons name="download-outline" size={16} color="#4CAF50" />
          )}
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      </TouchableOpacity>
    );
  }, [isChapterDownloaded, isCurrentChapter, getChapterProgress, onChapterPress]);

  const keyExtractor = useCallback((item, index) => {
    return `${item.number || index}`;
  }, []);

  const getItemLayout = useCallback((data, index) => ({
    length: 56,
    offset: 56 * index,
    index,
  }), []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color="#667EEA" />
        <Text style={styles.loadingText}>Loading chapters...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {chapters?.length || 0} Chapters
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={handleSortToggle}>
          <Ionicons
            name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
            size={16}
            color="#667EEA"
          />
          <Text style={styles.sortText}>
            {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedChapters}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No chapters available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  sortText: {
    color: '#667EEA',
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  currentChapter: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  completedIcon: {
    marginLeft: 6,
  },
  currentChapterText: {
    color: '#667EEA',
  },
  chapterTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    minWidth: 30,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 12,
  },
});

export default ChapterList;