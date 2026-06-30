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
import {WebView} from 'react-native-webview';

import {TextReader} from './Components/TextReader';
import {
  WebReader,
  buildNovelReaderUrl,
  NOVEL_WEBVIEW_ORIGIN_WHITELIST,
  shouldAllowNovelWebViewRequest,
} from './Components/WebReader';
import {ReaderSettings} from './Components/ReaderSettings';
import {WTRLabModeSelector} from './Components/WTRLabModeSelector';
import {getNovelChapter, getNovelHostKeyFromLink} from '../APIs';
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

const normalizeChapterLink = link => {
  if (typeof link !== 'string') {
    return null;
  }

  return link.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
};

const replaceChapterNumberInLink = (link, chapterNumber) => {
  if (!link || !chapterNumber || chapterNumber < 1) {
    return null;
  }

  return link.replace(/chapter-\d+/i, `chapter-${chapterNumber}`);
};

const getNovelChapterEntries = novel => {
  const chapters = novel?.chapterList || novel?.chapters || [];
  return Array.isArray(chapters) ? chapters : [];
};

export const buildWTRLabTextFallbackContent = ({novel, chapter, chapterLink}) => {
  const currentNumber = chapter?.number || extractChapterNumber(chapterLink);
  const chapterEntries = getNovelChapterEntries(novel);
  const normalizedCurrentLink = normalizeChapterLink(chapterLink);

  let matchedChapter = null;
  let prevChapter = null;
  let nextChapter = null;

  if (chapterEntries.length > 0) {
    const currentIndex = chapterEntries.findIndex(entry => {
      const entryLink = normalizeChapterLink(entry?.link);

      if (entryLink && normalizedCurrentLink && entryLink === normalizedCurrentLink) {
        return true;
      }

      if (currentNumber && Number(entry?.number) === Number(currentNumber)) {
        return true;
      }

      return false;
    });

    if (currentIndex >= 0) {
      matchedChapter = chapterEntries[currentIndex];
      prevChapter = chapterEntries[currentIndex - 1]?.link || null;
      nextChapter = chapterEntries[currentIndex + 1]?.link || null;
    }
  }

  const totalChapters =
    chapterEntries.length ||
    Number(novel?.chapters) ||
    Number(novel?.chapterCount) ||
    null;

  if (!prevChapter && currentNumber && currentNumber > 1) {
    prevChapter = replaceChapterNumberInLink(chapterLink, currentNumber - 1);
  }

  if (!nextChapter && currentNumber) {
    if (!totalChapters || currentNumber < totalChapters) {
      nextChapter = replaceChapterNumberInLink(chapterLink, currentNumber + 1);
    }
  }

  return {
    title:
      chapter?.title ||
      matchedChapter?.title ||
      (currentNumber ? `Chapter ${currentNumber}` : 'Chapter'),
    paragraphs: [],
    text: '',
    prevChapter,
    nextChapter,
    link: chapterLink,
    hostKey: 'wtrlab',
    requestedReadingMode: null,
    activeReadingMode: null,
  };
};

const WTR_LAB_TEXT_EXTRACTION_SCRIPT = `
  (function() {
    function send(type, payload) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        ...payload,
      }));
    }

    function getCurrentChapterContainer() {
      var match = window.location.pathname.match(/chapter-(\\d+)/i);
      var chapterNumber = match ? match[1] : null;

      if (chapterNumber) {
        var scopedContainer = document.querySelector('#chapter-' + chapterNumber);
        if (scopedContainer) {
          return scopedContainer;
        }
      }

      return document.querySelector('.chapter-container');
    }

    function getParagraphs() {
      var container = getCurrentChapterContainer();
      if (!container) {
        return [];
      }

      return Array.from(container.querySelectorAll('.chapter-body .pr-line-text'))
        .map(node => (node.innerText || '').trim())
        .filter(Boolean);
    }

    function extract() {
      var bodyText = document.body ? (document.body.innerText || '') : '';

      if (
        bodyText.includes('undefined - Error') ||
        bodyText.includes('An error occurred')
      ) {
        send('wtrlab_text_error', {
          message: 'WTR-Lab returned an error page for this reading mode.',
        });
        return true;
      }

      var paragraphs = getParagraphs();
      if (paragraphs.length >= 5) {
        var title = paragraphs[0] || '';
        var contentParagraphs = paragraphs.slice();

        while (title && contentParagraphs[0] === title) {
          contentParagraphs = contentParagraphs.slice(1);
        }

        send('wtrlab_text_content', {
          title: title,
          paragraphs: contentParagraphs,
          text: contentParagraphs.join('\\n\\n'),
        });
        return true;
      }

      return false;
    }

    var attempts = 0;
    var interval = setInterval(function() {
      attempts += 1;
      if (extract() || attempts >= 40) {
        clearInterval(interval);
        if (attempts >= 40) {
          send('wtrlab_text_timeout', {
            message: 'Timed out waiting for rendered WTR-Lab text.',
          });
        }
      }
    }, 500);

    true;
  })();
`;

export function NovelReader() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  const contentHeightRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const isRestoringScrollRef = useRef(false);
  const restoredContentKeyRef = useRef(null);

  const {novel, chapter, chapterLink} = route.params || {};

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [restoringProgress, setRestoringProgress] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [extractedWTRLabText, setExtractedWTRLabText] = useState(null);
  const [wtrLabExtractionError, setWtrLabExtractionError] = useState(null);

  const readerMode = useSelector(state => state.data.novelReaderMode || 'text');
  const readerTheme = useSelector(
    state => state.data.novelReaderTheme || 'dark',
  );
  const fontSize = useSelector(state => state.data.novelFontSize || 18);
  const lineHeight = useSelector(state => state.data.novelLineHeight || 1.6);
  const fontFamily = useSelector(
    state => state.data.novelFontFamily || 'serif',
  );
  const wtrlabReadingMode = useSelector(
    state => state.data.wtrlabReadingMode || 'web',
  );

  // Detect if this is a WTR-Lab chapter
  const hostKey = getNovelHostKeyFromLink(chapterLink);
  const isWTRLab = hostKey === 'wtrlab';
  const shouldUseWebReader = readerMode === 'webview';
  const shouldUseWTRLabFallbackMetadata =
    isWTRLab && wtrlabReadingMode !== 'ai';
  const shouldExtractWTRLabText =
    shouldUseWTRLabFallbackMetadata && !shouldUseWebReader;

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
        setExtractedWTRLabText(null);
        setWtrLabExtractionError(null);
        const data = shouldUseWTRLabFallbackMetadata
          ? buildWTRLabTextFallbackContent({novel, chapter, chapterLink})
          : await getNovelChapter(
              chapterLink,
              hostKey,
              isWTRLab ? wtrlabReadingMode : undefined,
            );
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
  }, [
    chapterLink,
    novel,
    chapter,
    dispatch,
    hostKey,
    isWTRLab,
    shouldUseWTRLabFallbackMetadata,
    wtrlabReadingMode,
  ]);

  const handleWTRLabTextMessage = useCallback(
    event => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'wtrlab_text_content') {
          setExtractedWTRLabText({
            title: data.title,
            paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [],
            text: typeof data.text === 'string' ? data.text : '',
          });
          setWtrLabExtractionError(null);
          return;
        }

        if (
          data.type === 'wtrlab_text_error' ||
          data.type === 'wtrlab_text_timeout'
        ) {
          setWtrLabExtractionError(
            data.message ||
              'Failed to load the selected WTR-Lab mode in text view.',
          );
        }
      } catch (parseError) {
        console.log('[NovelReader] Failed to parse WTR-Lab text message');
      }
    },
    [],
  );

  const resolvedContent =
    shouldExtractWTRLabText && extractedWTRLabText?.text
      ? {
          ...(content || {}),
          title: extractedWTRLabText.title || content?.title,
          paragraphs: extractedWTRLabText.paragraphs,
          text: extractedWTRLabText.text,
        }
      : shouldExtractWTRLabText
      ? {
          ...(content || {}),
          paragraphs: [],
          text: '',
        }
      : content;

  const isWaitingForWTRLabText =
    shouldExtractWTRLabText &&
    !extractedWTRLabText?.text &&
    !wtrLabExtractionError;

  const resolvedTextContent = resolvedContent?.text || resolvedContent?.content || '';
  const restorationContentKey = [
    chapterLink || '',
    readerMode,
    shouldExtractWTRLabText ? wtrlabReadingMode : 'default',
    resolvedContent?.title || '',
    resolvedTextContent.length,
  ].join('|');

  useEffect(() => {
    restoredContentKeyRef.current = null;
    isRestoringScrollRef.current = false;
    setRestoringProgress(false);
    contentHeightRef.current = 0;
  }, [chapterLink, readerMode, wtrlabReadingMode]);

  // Restore scroll position after content loads
  useEffect(() => {
    const progress = savedProgressRef.current?.scrollProgress;
    if (
      loading ||
      isWaitingForWTRLabText ||
      !resolvedContent ||
      !progress ||
      shouldUseWebReader
    ) {
      return;
    }

    // Only restore if progress is between 1-94%
    if (progress <= 0 || progress >= SCROLL_PROGRESS_THRESHOLD) {
      return;
    }

    if (restoredContentKeyRef.current === restorationContentKey) {
      return;
    }

    restoredContentKeyRef.current = restorationContentKey;

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
  }, [
    loading,
    isWaitingForWTRLabText,
    resolvedContent,
    restorationContentKey,
    shouldUseWebReader,
  ]);

  // Handle scroll events to track progress
  const handleScroll = useCallback(
    event => {
      if (isRestoringScrollRef.current || shouldUseWebReader) {
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
    [dispatch, novel, chapterLink, shouldUseWebReader],
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

  if (error || wtrLabExtractionError) {
    return (
      <View style={[styles.errorContainer, {backgroundColor: themeColors.bg}]}>
        <Text style={[styles.errorText, {color: themeColors.text}]}>
          {error || wtrLabExtractionError}
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
            {isWTRLab && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowModeSelector(true)}>
                <Ionicons
                  name="language-outline"
                  size={22}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      )}

      {isWaitingForWTRLabText && (
        <View style={styles.extractionOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#667EEA" />
          <Text style={[styles.loadingText, {color: themeColors.text}]}>
            Loading chapter...
          </Text>
        </View>
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

      {!shouldUseWebReader ? (
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
            content={resolvedContent?.text || resolvedContent?.content}
            title={resolvedContent?.title}
            fontSize={fontSize}
            lineHeight={lineHeight}
            fontFamily={fontFamily}
            theme={readerTheme}
            onPress={handleToggleHeader}
          />
        </ScrollView>
      ) : (
        <WebReader
          chapterLink={chapterLink}
          theme={readerTheme}
          hostKey={hostKey}
          service={isWTRLab ? wtrlabReadingMode : undefined}
        />
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
      {showModeSelector && isWTRLab && (
        <WTRLabModeSelector
          visible={showModeSelector}
          onClose={() => setShowModeSelector(false)}
          onSelect={() => {
            // Chapter will reload automatically due to wtrlabReadingMode dependency
          }}
        />
      )}
      {shouldExtractWTRLabText &&
        !extractedWTRLabText?.text &&
        !wtrLabExtractionError && (
        <WebView
          source={{
            uri: buildNovelReaderUrl({
              chapterLink,
              hostKey,
              service: wtrlabReadingMode,
            }),
          }}
          originWhitelist={NOVEL_WEBVIEW_ORIGIN_WHITELIST}
          onShouldStartLoadWithRequest={shouldAllowNovelWebViewRequest}
          injectedJavaScript={WTR_LAB_TEXT_EXTRACTION_SCRIPT}
          onMessage={handleWTRLabTextMessage}
          onLoadStart={() => {
            console.log('[NovelReader] WTR-Lab hidden extractor load started');
          }}
          onLoadEnd={() => {
            console.log('[NovelReader] WTR-Lab hidden extractor load ended');
          }}
          onError={event => {
            console.log(
              '[NovelReader] WTR-Lab hidden extractor error:',
              event?.nativeEvent,
            );
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={true}
          setSupportMultipleWindows={false}
          javaScriptCanOpenWindowsAutomatically={false}
          style={styles.hiddenWebView}
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
  hiddenWebView: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  extractionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 20, 0.92)',
    zIndex: 999,
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
