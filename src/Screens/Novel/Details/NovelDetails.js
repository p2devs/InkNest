import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';
import {heightPercentageToDP} from 'react-native-responsive-screen';

import {NovelInfo} from './Components/NovelInfo';
import {getNovelDetails, getChapterList} from '../APIs';
import {NAVIGATION} from '../../../Constants';
import {
  AddNovelBookMark,
  RemoveNovelBookMark,
  pushNovelHistory,
} from '../../../Redux/Reducers';

function NovelDetailsHeader({title, onBack, onBookmark, isBookmarked}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerButton}>
        <Ionicons
          name="chevron-back"
          size={heightPercentageToDP('3%')}
          color="#fff"
        />
      </TouchableOpacity>

      <Text style={styles.headerTitle} numberOfLines={1}>
        {title || 'Novel Details'}
      </Text>

      <View style={styles.headerActions}>
        <TouchableOpacity onPress={onBookmark} style={styles.headerButton}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? '#9C27B0' : '#fff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChapterPagination({currentPage, totalPages, onPageChange, loading}) {
  if (totalPages <= 1) {
    return null;
  }

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <TouchableOpacity
          key="prev"
          style={styles.pageButton}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={loading}>
          <Ionicons name="chevron-back" size={16} color="#667EEA" />
        </TouchableOpacity>,
      );
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <TouchableOpacity
          key={1}
          style={styles.pageButton}
          onPress={() => onPageChange(1)}
          disabled={loading}>
          <Text style={styles.pageButtonText}>1</Text>
        </TouchableOpacity>,
      );
      if (startPage > 2) {
        buttons.push(
          <Text key="ellipsis1" style={styles.ellipsis}>
            ...
          </Text>,
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            currentPage === i && styles.activePageButton,
          ]}
          onPress={() => onPageChange(i)}
          disabled={loading || currentPage === i}>
          <Text
            style={[
              styles.pageButtonText,
              currentPage === i && styles.activePageText,
            ]}>
            {i}
          </Text>
        </TouchableOpacity>,
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <Text key="ellipsis2" style={styles.ellipsis}>
            ...
          </Text>,
        );
      }
      buttons.push(
        <TouchableOpacity
          key={totalPages}
          style={styles.pageButton}
          onPress={() => onPageChange(totalPages)}
          disabled={loading}>
          <Text style={styles.pageButtonText}>{totalPages}</Text>
        </TouchableOpacity>,
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <TouchableOpacity
          key="next"
          style={styles.pageButton}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={loading}>
          <Ionicons name="chevron-forward" size={16} color="#667EEA" />
        </TouchableOpacity>,
      );
    }

    return buttons;
  };

  return (
    <View style={styles.paginationContainer}>
      {loading && (
        <ActivityIndicator
          size="small"
          color="#667EEA"
          style={styles.paginationLoader}
        />
      )}
      <View style={styles.paginationButtons}>{renderPageButtons()}</View>
      <Text style={styles.paginationInfo}>
        Page {currentPage} of {totalPages}
      </Text>
    </View>
  );
}

export function NovelDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const {novel: initialNovel} = route.params || {};
  const novelLink = initialNovel?.link;

  const [novel, setNovel] = useState(initialNovel);
  const [loading, setLoading] = useState(!initialNovel?.chapterList?.length);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const bookmarks = useSelector(state => state.data.NovelBookMarks || {});
  const isBookmarked = !!bookmarks[novelLink];
  const novelHistory = useSelector(state => state.data.NovelHistory || {});
  const readingProgress = novelHistory[novelLink];

  useEffect(() => {
    if (!novelLink) {
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await getNovelDetails(novelLink);
        setNovel(prev => ({...prev, ...details}));

        // Set pagination info
        if (details?.chapterPagination) {
          setTotalPages(details.chapterPagination.totalPages || 1);
        }

        // Add to history
        dispatch(
          pushNovelHistory({
            link: novelLink,
            title: details.title,
            coverImage: details.coverImage,
            author: details.author,
            lastReadAt: Date.now(),
          }),
        );
      } catch (err) {
        console.error('Error fetching novel details:', err);
        crashlytics().recordError(err);
        setError('Failed to load novel details.');
      } finally {
        setLoading(false);
      }
    };

    if (!initialNovel?.chapterList?.length) {
      fetchDetails();
    }
  }, [novelLink, initialNovel, dispatch]);

  const handleChapterPress = useCallback(
    chapter => {
      crashlytics().log(`Chapter pressed: ${chapter.number}`);
      navigation.navigate(NAVIGATION.novelReader, {
        novel,
        chapter,
        chapterLink: chapter.link,
      });
    },
    [navigation, novel],
  );

  const handleBookmarkToggle = useCallback(() => {
    if (isBookmarked) {
      dispatch(RemoveNovelBookMark({link: novelLink}));
    } else {
      dispatch(
        AddNovelBookMark({
          link: novelLink,
          title: novel?.title,
          coverImage: novel?.coverImage,
          author: novel?.author,
          chapters: novel?.chapters,
          status: novel?.status,
        }),
      );
    }
  }, [dispatch, isBookmarked, novelLink, novel]);

  const handleGenrePress = useCallback(
    genre => {
      crashlytics().log(`Genre pressed: ${genre}`);
      navigation.navigate(NAVIGATION.novelViewAll, {
        title: genre,
        genre,
      });
    },
    [navigation],
  );

  const handleStartReading = useCallback(() => {
    const chapters = novel?.chapterList || [];
    if (chapters.length > 0) {
      // Check if there's reading progress
      if (readingProgress?.lastChapterLink) {
        // Find the last read chapter
        const lastReadChapter = chapters.find(
          ch =>
            ch.link === readingProgress.lastChapterLink ||
            ch.number === readingProgress.lastChapter,
        );
        if (lastReadChapter) {
          handleChapterPress(lastReadChapter);
          return;
        }
      }

      // Otherwise, get first chapter based on current sort order
      const sortedList = [...chapters].sort((a, b) => {
        if (sortOrder === 'asc') {
          return (a.number || 0) - (b.number || 0);
        }
        return (b.number || 0) - (a.number || 0);
      });
      handleChapterPress(sortedList[0]);
    }
  }, [novel, handleChapterPress, sortOrder, readingProgress]);

  const handleSortToggle = useCallback(() => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handlePageChange = useCallback(
    async page => {
      if (!novelLink || chaptersLoading) {
        return;
      }

      try {
        setChaptersLoading(true);
        const result = await getChapterList(novelLink, page);

        if (result?.chapters) {
          setNovel(prev => ({
            ...prev,
            chapterList: result.chapters,
          }));
          setCurrentPage(page);

          if (result?.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
          }
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
        crashlytics().recordError(err);
      } finally {
        setChaptersLoading(false);
      }
    },
    [novelLink, chaptersLoading],
  );

  const sortedChapters = useMemo(() => {
    return [...(novel?.chapterList || [])].sort((a, b) => {
      if (sortOrder === 'asc') {
        return (a.number || 0) - (b.number || 0);
      }
      return (b.number || 0) - (a.number || 0);
    });
  }, [novel?.chapterList, sortOrder]);

  const renderChapter = useCallback(
    ({item}) => {
      const isLastRead =
        readingProgress?.lastChapterLink === item.link ||
        readingProgress?.lastChapter === item.number;

      // Get chapter progress
      const chapterProgress = readingProgress?.chapterProgress?.[item.link];
      const isCompleted = chapterProgress?.completed;
      const scrollProgress = chapterProgress?.scrollProgress || 0;

      return (
        <TouchableOpacity
          style={[styles.chapterItem, isLastRead && styles.lastReadChapter]}
          onPress={() => handleChapterPress(item)}
          activeOpacity={0.7}>
          <View style={styles.chapterInfo}>
            <View style={styles.chapterTitleRow}>
              <Text
                style={[
                  styles.chapterNumber,
                  isLastRead && styles.lastReadText,
                ]}>
                Chapter {item.number}
              </Text>
              {isCompleted && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#4CAF50"
                  style={styles.completedIcon}
                />
              )}
            </View>
            {item.title && (
              <Text
                style={[styles.chapterTitle, isLastRead && styles.lastReadText]}
                numberOfLines={1}>
                {item.title}
              </Text>
            )}
            {/* Progress bar */}
            {!isCompleted && scrollProgress > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[styles.progressFill, {width: `${scrollProgress}%`}]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(scrollProgress)}%
                </Text>
              </View>
            )}
            {isLastRead && (
              <View style={styles.lastReadBadge}>
                <Ionicons name="bookmark" size={12} color="#9C27B0" />
                <Text style={styles.lastReadBadgeText}>Last Read</Text>
              </View>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={isLastRead ? '#9C27B0' : 'rgba(255,255,255,0.4)'}
          />
        </TouchableOpacity>
      );
    },
    [handleChapterPress, readingProgress],
  );

  const keyExtractor = useCallback((item, index) => {
    return `${item.number || index}`;
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 56,
      offset: 56 * index,
      index,
    }),
    [],
  );

  const ListHeaderComponent = useCallback(() => {
    const firstChapter = sortedChapters?.[0];
    const hasChapters = sortedChapters?.length > 0;

    // Determine button label based on reading progress
    let chapterLabel = 'Start Reading';
    let buttonIcon = 'book';

    if (readingProgress?.lastChapter) {
      chapterLabel = `Continue: Chapter ${readingProgress.lastChapter}`;
      buttonIcon = 'book-outline';
    } else if (firstChapter) {
      chapterLabel = `Start Reading: Chapter ${firstChapter.number || 1}`;
    }

    return (
      <>
        <NovelInfo novel={novel} onGenrePress={handleGenrePress} />

        {hasChapters && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.readButton}
              onPress={handleStartReading}
              activeOpacity={0.7}>
              <Ionicons name={buttonIcon} size={18} color="#fff" />
              <Text style={styles.readButtonText}>{chapterLabel}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.chapterHeader}>
          <Text style={styles.chapterHeaderTitle}>
            {novel?.chapterList?.length || 0} Chapters
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
      </>
    );
  }, [
    novel,
    sortedChapters,
    readingProgress,
    handleGenrePress,
    handleStartReading,
    handleSortToggle,
    sortOrder,
  ]);

  const ListFooterComponent = useCallback(() => {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <ChapterPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={chaptersLoading}
      />
    );
  }, [currentPage, totalPages, handlePageChange, chaptersLoading]);

  if (!novel && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667EEA" />
      </View>
    );
  }

  if (!novel) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Novel not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <NovelDetailsHeader
        title={novel?.title}
        onBack={() => navigation.goBack()}
        onBookmark={handleBookmarkToggle}
        isBookmarked={isBookmarked}
      />

      <View style={{marginVertical: 8}} />

      <FlatList
        data={sortedChapters}
        keyExtractor={keyExtractor}
        renderItem={renderChapter}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator color="#667EEA" />
              <Text style={styles.loadingText}>Loading chapters...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="book-outline"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.emptyText}>No chapters available</Text>
            </View>
          )
        }
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#14142A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
    padding: 20,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  backText: {
    color: '#667EEA',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667EEA',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  readButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chapterHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: '#667EEA',
    fontWeight: '500',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    minHeight: 56,
  },
  lastReadChapter: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#9C27B0',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  completedIcon: {
    marginLeft: 6,
  },
  lastReadText: {
    color: '#9C27B0',
  },
  chapterTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
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
  lastReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  lastReadBadgeText: {
    fontSize: 11,
    color: '#9C27B0',
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 12,
  },
  paginationContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 16,
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  paginationButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  paginationButtonActive: {
    backgroundColor: '#667EEA',
  },
  paginationButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationInfo: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  paginationLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NovelDetails;
