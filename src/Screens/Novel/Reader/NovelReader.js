import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import crashlytics from '@react-native-firebase/crashlytics';

import {TextReader} from './Components/TextReader';
import {WebReader} from './Components/WebReader';
import {ReaderSettings} from './Components/ReaderSettings';
import {getNovelChapter} from '../APIs';
import {NAVIGATION} from '../../../Constants';
import {
  updateNovelHistory,
  updateNovelChapterProgress,
} from '../../../Redux/Reducers';

const SCROLL_PROGRESS_THRESHOLD = 95; // Mark as completed at 95%

// Helper function to extract chapter number from link
const extractChapterNumber = link => {
  if (!link) {
    return null;
  }
  const match = link.match(/chapter-(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

export function NovelReader() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  const contentHeightRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const isRestoringScrollRef = useRef(false);

  const {novel, chapter, chapterLink} = route.params || {};

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [restoringProgress, setRestoringProgress] = useState(false);

  const readerMode = useSelector(state => state.data.novelReaderMode || 'text');
  const readerTheme = useSelector(
    state => state.data.novelReaderTheme || 'dark',
  );
  const fontSize = useSelector(state => state.data.novelFontSize || 18);
  const lineHeight = useSelector(state => state.data.novelLineHeight || 1.6);
  const fontFamily = useSelector(
    state => state.data.novelFontFamily || 'serif',
  );

  // Get saved chapter progress from Redux
  const novelHistory = useSelector(
    state => state.data.NovelHistory?.[novel?.link],
  );
  const savedProgress = novelHistory?.chapterProgress?.[chapterLink];

  // Use ref to avoid re-triggering fetch when progress updates
  const savedProgressRef = useRef(savedProgress);
  savedProgressRef.current = savedProgress;

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterLink) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getNovelChapter(chapterLink);
        setContent(data);

        // Extract chapter number from link if not provided
        const chapterNumber =
          chapter?.number || extractChapterNumber(chapterLink);
        const chapterTitle = chapter?.title || data?.title;

        // Get saved scroll progress from ref to avoid dependency issues
        const savedScrollProgress =
          savedProgressRef.current?.scrollProgress || 0;

        // Update reading history with current progress
        dispatch(
          updateNovelHistory({
            novelLink: novel?.link,
            chapterLink,
            chapterNumber,
            chapterTitle,
            scrollProgress: savedScrollProgress,
          }),
        );
      } catch (err) {
        console.error('Error fetching chapter:', err);
        crashlytics().recordError(err);
        setError('Failed to load chapter.');
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterLink, novel, chapter, dispatch]);

  // Restore scroll position after content loads
  useEffect(() => {
    const progress = savedProgressRef.current?.scrollProgress;
    if (loading || !content || !progress || readerMode !== 'text') {
      return;
    }

    // Only restore if progress is between 1-94%
    if (progress <= 0 || progress >= SCROLL_PROGRESS_THRESHOLD) {
      return;
    }

    isRestoringScrollRef.current = true;
    setRestoringProgress(true);

    // Wait for content to be laid out
    const attemptScroll = (attempts = 0) => {
      if (attempts > 10) {
        // Give up after 10 attempts
        isRestoringScrollRef.current = false;
        setRestoringProgress(false);
        return;
      }

      setTimeout(() => {
        if (contentHeightRef.current > 0 && scrollViewRef.current) {
          const scrollY = (contentHeightRef.current * progress) / 100;
          scrollViewRef.current.scrollTo({y: scrollY, animated: false});

          setTimeout(() => {
            isRestoringScrollRef.current = false;
            setRestoringProgress(false);
          }, 100);
        } else {
          // Content not ready yet, try again
          attemptScroll(attempts + 1);
        }
      }, 100);
    };

    attemptScroll();
  }, [loading, content, readerMode]);

  // Handle scroll events to track progress
  const handleScroll = useCallback(
    event => {
      if (isRestoringScrollRef.current || readerMode !== 'text') {
        return;
      }

      const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
      contentHeightRef.current = contentSize.height;

      // Calculate scroll percentage
      const maxScroll = contentSize.height - layoutMeasurement.height;
      if (maxScroll <= 0) {
        return;
      }

      const currentScroll = contentOffset.y;
      const scrollPercentage = Math.min(
        100,
        Math.max(0, (currentScroll / maxScroll) * 100),
      );

      // Only update if progress changed significantly (avoid too many updates)
      if (Math.abs(scrollPercentage - scrollProgressRef.current) >= 1) {
        scrollProgressRef.current = scrollPercentage;

        // Update Redux with progress (debounced via the threshold check)
        dispatch(
          updateNovelChapterProgress({
            novelLink: novel?.link,
            chapterLink,
            scrollProgress: scrollPercentage,
          }),
        );
      }
    },
    [dispatch, novel, chapterLink, readerMode],
  );

  const handlePrevChapter = useCallback(() => {
    if (content?.prevChapter) {
      // Calculate chapter number: use current number +/- 1, or extract from link
      const currentNumber =
        chapter?.number || extractChapterNumber(chapterLink);
      const prevNumber = currentNumber
        ? currentNumber - 1
        : extractChapterNumber(content.prevChapter);

      navigation.replace(NAVIGATION.novelReader, {
        novel,
        chapter: {
          link: content.prevChapter,
          number: prevNumber,
        },
        chapterLink: content.prevChapter,
      });
    }
  }, [content, novel, chapter, chapterLink, navigation]);

  const handleNextChapter = useCallback(() => {
    if (content?.nextChapter) {
      // Calculate chapter number: use current number + 1, or extract from link
      const currentNumber =
        chapter?.number || extractChapterNumber(chapterLink);
      const nextNumber = currentNumber
        ? currentNumber + 1
        : extractChapterNumber(content.nextChapter);

      navigation.replace(NAVIGATION.novelReader, {
        novel,
        chapter: {
          link: content.nextChapter,
          number: nextNumber,
        },
        chapterLink: content.nextChapter,
      });
    }
  }, [content, novel, chapter, chapterLink, navigation]);

  const handleToggleHeader = useCallback(() => {
    setShowHeader(prev => !prev);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const getThemeColors = useCallback(() => {
    switch (readerTheme) {
      case 'light':
        return {bg: '#ffffff', text: '#1a1a1a'};
      case 'sepia':
        return {bg: '#f4ecd8', text: '#5c4b37'};
      default:
        return {bg: '#0a0a14', text: '#e0e0e0'};
    }
  }, [readerTheme]);

  const themeColors = getThemeColors();

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, {backgroundColor: themeColors.bg}]}>
        <ActivityIndicator size="large" color="#667EEA" />
        <Text style={[styles.loadingText, {color: themeColors.text}]}>
          Loading chapter...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, {backgroundColor: themeColors.bg}]}>
        <Text style={[styles.errorText, {color: themeColors.text}]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <StatusBar
        barStyle={readerTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.bg}
      />

      {showHeader && (
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text
                style={[styles.headerTitle, {color: themeColors.text}]}
                numberOfLines={1}>
                {novel?.title}
              </Text>
              <Text style={[styles.headerSubtitle, {color: themeColors.text}]}>
                Chapter{' '}
                {chapter?.number ||
                  extractChapterNumber(chapterLink) ||
                  content?.title}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleSettings}>
              <Ionicons
                name="settings-outline"
                size={22}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Restoring progress overlay */}
      {restoringProgress && (
        <View style={styles.restoringOverlay}>
          <View style={styles.restoringContent}>
            <ActivityIndicator size="large" color="#667EEA" />
            <Text style={styles.restoringText}>Restoring your position...</Text>
          </View>
        </View>
      )}

      {readerMode === 'text' ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={400}
          onContentSizeChange={(width, height) => {
            contentHeightRef.current = height;
          }}>
          <TextReader
            content={content?.content}
            title={content?.title}
            fontSize={fontSize}
            lineHeight={lineHeight}
            fontFamily={fontFamily}
            theme={readerTheme}
            onPress={handleToggleHeader}
          />
        </ScrollView>
      ) : (
        <WebReader chapterLink={chapterLink} theme={readerTheme} />
      )}

      {showHeader && (
        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.navButton,
                !content?.prevChapter && styles.navButtonDisabled,
              ]}
              onPress={handlePrevChapter}
              disabled={!content?.prevChapter}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={
                  content?.prevChapter
                    ? themeColors.text
                    : 'rgba(255,255,255,0.3)'
                }
              />
              <Text style={[styles.navText, {color: themeColors.text}]}>
                Prev
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chapterListButton}
              onPress={() =>
                navigation.navigate(NAVIGATION.novelDetails, {novel})
              }>
              <Ionicons
                name="list-outline"
                size={20}
                color={themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                !content?.nextChapter && styles.navButtonDisabled,
              ]}
              onPress={handleNextChapter}
              disabled={!content?.nextChapter}>
              <Text style={[styles.navText, {color: themeColors.text}]}>
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  content?.nextChapter
                    ? themeColors.text
                    : 'rgba(255,255,255,0.3)'
                }
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {showSettings && (
        <ReaderSettings
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
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
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#667EEA',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  headerContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  footerContainer: {
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chapterListButton: {
    padding: 8,
  },
  restoringOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  restoringContent: {
    alignItems: 'center',
  },
  restoringText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
});

export default NovelReader;
