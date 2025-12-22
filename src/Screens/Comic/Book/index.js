import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Share,
  Animated,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {Gallery, useImageResolution} from 'react-native-zoom-toolkit';
import {useSharedValue} from 'react-native-reanimated';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';
import analytics from '@react-native-firebase/analytics';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import GalleryImage from './GalleryImage';
import VerticalView from './VerticalView';
import {
  downloadComicBook,
  showRewardedAd,
} from '../../../InkNest-Externals/Redux/Actions/Download';
import {updateData, setScrollPreference} from '../../../Redux/Reducers';
import {handleScrollModeChange} from '../../../Utils/ScrollModeUtils';
import {NAVIGATION} from '../../../Constants';

export function ComicBook({navigation, route}) {
  const ref = useRef(null);
  const dispatch = useDispatch();
  const {comicBookLink, pageJump, isDownloadComic, DetailsPage} = route?.params;
  const comicBook = useSelector(state => state?.data?.dataByUrl[comicBookLink]);

  const [detailsPageLink, setDetailsPageLink] = useState(
    DetailsPage?.link ?? comicBook?.detailsLink ?? '',
  );
  const ComicDetails = useSelector(
    state => state?.data?.dataByUrl[detailsPageLink],
  );
  const isComicDownload = Boolean(
    useSelector(
      state =>
        state?.data?.DownloadComic?.[detailsPageLink]?.comicBooks?.[
          comicBookLink
        ],
    ),
  );

  const loading = useSelector(state => state?.data?.loading);
  const error = useSelector(state => state?.data?.error);
  const userScrollPreference = useSelector(
    state => state?.data?.scrollPreference,
  );

  const [imageLinkIndex, setImageLinkIndex] = useState(0);
  const [isVerticalScroll, setIsVerticalScroll] = useState(
    userScrollPreference === 'vertical',
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [progress, setProgress] = useState({downloaded: 0, total: 0});
  const [isNextChapter, setIsNextChapter] = useState(false);
  const [isPreviousChapter, setIsPreviousChapter] = useState(false);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTimeoutRef = useRef(null);
  const isHeaderVisibleRef = useRef(true);

  // Function to hide header with animation (no state update to avoid re-render)
  const hideHeader = useCallback(() => {
    if (!isHeaderVisibleRef.current) return;
    isHeaderVisibleRef.current = false;
    Animated.timing(headerOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  // Function to show header with animation (no state update to avoid re-render)
  const showHeader = useCallback(() => {
    if (isHeaderVisibleRef.current) return;
    isHeaderVisibleRef.current = true;
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  // Start/reset the auto-hide timer
  const resetHeaderTimer = useCallback(() => {
    if (headerTimeoutRef.current) {
      clearTimeout(headerTimeoutRef.current);
    }
    showHeader();
    headerTimeoutRef.current = setTimeout(() => {
      hideHeader();
    }, 4000); // Hide after 4 seconds
  }, [showHeader, hideHeader]);

  // Toggle header visibility on tap (called from Gallery onTap)
  const handleScreenTap = useCallback(() => {
    if (isHeaderVisibleRef.current) {
      hideHeader();
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    } else {
      resetHeaderTimer();
    }
  }, [hideHeader, resetHeaderTimer]);

  // Initial auto-hide timer and cleanup
  useEffect(() => {
    resetHeaderTimer();
    return () => {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (comicBookLink) {
      analytics().logEvent('fetch_comic_book', {
        screen: 'ComicBook',
        comicBookLink: comicBookLink?.toString(),
        DetailsPageLink: detailsPageLink?.toString(),
        pageJump: pageJump,
        isVerticalScroll: isVerticalScroll,
        timestamp: new Date().toISOString(),
      });
      dispatch(fetchComicBook(comicBookLink, !detailsPageLink));
      setIsPreviousChapter(getChapterIndex() === 0);
      setIsNextChapter(
        getChapterIndex() === ComicDetails?.chapters?.length - 1,
      );
    }
  }, [comicBookLink, dispatch]);

  useEffect(() => {
    if (comicBook?.detailsLink) {
      setDetailsPageLink(comicBook?.detailsLink);
    }
  }, [comicBook?.detailsLink]);

  const activeIndex = useSharedValue(0);

  const imageSource = useMemo(() => {
    if (comicBook?.images?.length > 0) {
      return {
        uri: comicBook?.images[0],
      };
    }
    return {
      uri: '',
    };
  }, [comicBook?.images]);

  const {isFetching, resolution} = useImageResolution(imageSource);

  const renderItem = useCallback(
    (item, index) => {
      let assets = {uri: item};
      return (
        <GalleryImage asset={assets} index={index} activeIndex={activeIndex} />
      );
    },
    [activeIndex],
  );

  function getChapterIndex() {
    if (!ComicDetails?.chapters || ComicDetails.chapters.length === 0)
      return -1;
    return ComicDetails.chapters.findIndex(
      chapter => chapter.link === comicBookLink,
    );
  }

  function navigateToChapter(direction) {
    const currentIndex = getChapterIndex();
    if (currentIndex === -1) return;

    let targetIndex;
    if (
      direction === 'next' &&
      currentIndex < ComicDetails.chapters.length - 1
    ) {
      targetIndex = currentIndex + 1;
    } else if (direction === 'previous' && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    } else {
      return; // No valid navigation
    }

    const targetChapter = ComicDetails.chapters[targetIndex];
    analytics().logEvent('chapter_navigation', {
      screen: 'ComicBook',
      direction: direction,
      fromChapter: comicBookLink,
      toChapter: targetChapter.link,
    });

    navigation.replace('ComicBook', {
      comicBookLink: targetChapter.link,
      pageJump: 0,
      isDownloadComic: isComicDownload,
      DetailsPage: DetailsPage,
    });
  }

  const keyExtractor = useCallback((item, index) => `${item.uri}-${index}`, []);

  // used to derived the color animation when pulling vertically
  const translateY = useSharedValue(0);
  const onVerticalPulling = ty => {
    'worklet';
    translateY.value = ty;
  };

  useEffect(() => {
    if (pageJump && pageJump > 0) {
      setImageLinkIndex(pageJump - 1);
      ref?.current?.setIndex(pageJump - 1);
    }
  }, [pageJump, ref]);

  useEffect(() => {
    if (!isVerticalScroll && imageLinkIndex > 0) {
      ref?.current?.setIndex(imageLinkIndex);
    }
  }, [isVerticalScroll, imageLinkIndex, ref]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Text style={styles.text}>Loading comic data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          style={{
            width: '100%',
            height: heightPercentageToDP('4%'),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
          <TouchableOpacity
            onPress={() => {
              analytics().logEvent('go_back_error', {
                screen: 'ComicBook',
                comicBookLink: comicBookLink?.toString(),
                DetailsPageLink: detailsPageLink?.toString(),
              });
              goBack();
            }}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{marginRight: 10, opacity: 0.9}}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#fff',
              opacity: 0.9,
            }}>
            Comic Book
          </Text>
          <View style={{flex: 0.1}} />
        </Header>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={styles.text}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!comicBook?.images?.length > 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          style={{
            width: '100%',
            height: heightPercentageToDP('4%'),
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}>
          <TouchableOpacity
            onPress={() => {
              analytics().logEvent('go_back_nodata', {
                screen: 'ComicBook',
                comicBookLink: comicBookLink?.toString(),
                DetailsPageLink: detailsPageLink?.toString(),
              });
              goBack();
            }}>
            <Ionicons
              name="arrow-back"
              size={24}
              color="#fff"
              style={{marginRight: 10, opacity: 0.9}}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#fff',
              opacity: 0.9,
            }}>
            Comic Book
          </Text>
          <View style={{flex: 0.1}} />
        </Header>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={styles.text}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{flex: 1}}>
          <Animated.View
            style={{
              opacity: headerOpacity,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}>
            <Header
              style={{
                width: '100%',
                height: heightPercentageToDP('4%'),
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
              }}>
              <TouchableOpacity
                onPress={() => {
                  analytics().logEvent('go_back', {
                    screen: 'ComicBook',
                    comicBookLink: comicBookLink?.toString(),
                    DetailsPageLink: detailsPageLink?.toString(),
                    pageJump: pageJump?.toString(),
                    isDownloadComic: isDownloadComic?.toString(),
                    isVerticalScroll: isVerticalScroll?.toString(),
                  });
                  dispatch(
                    updateData({
                      url: comicBookLink,
                      data: {lastReadPage: imageLinkIndex},
                      imageLength: comicBook?.images?.length ?? 0,
                      ComicDetailslink: ComicDetails?.link,
                      readAt: Date.now(),
                    }),
                  );

                  goBack();
                }}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color="#fff"
                  style={{marginRight: 10, opacity: 0.9}}
                />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: '#fff',
                  opacity: 0.9,
                }}>
                Page: {imageLinkIndex + 1} / {comicBook?.images?.length}
              </Text>

              <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                <Ionicons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            </Header>
          </Animated.View>
          {isVerticalScroll ? (
            <VerticalView
              data={comicBook?.images}
              loading={loading}
              setImageLinkIndex={setImageLinkIndex}
              activeIndex={imageLinkIndex}
              resolutions={resolution}
              onTap={handleScreenTap}
            />
          ) : (
            <Gallery
              ref={ref}
              data={comicBook?.images}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              gap={24}
              onIndexChange={idx => {
                activeIndex.value = idx;
                setImageLinkIndex(idx);
              }}
              pinchCenteringMode={'sync'}
              onVerticalPull={onVerticalPulling}
              onTap={handleScreenTap}
            />
          )}
        </View>
      </SafeAreaView>
      {isModalVisible && (
        <SafeAreaView>
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => {
              setIsModalVisible(!isModalVisible);
            }}>
            <SafeAreaView
              style={{
                flex: 1,
                padding: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                {/* Add your modal content here */}
                <Text style={styles.text}>Comic Book Options</Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(false);
                  }}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    handleScrollModeChange(
                      isVerticalScroll,
                      setIsVerticalScroll,
                      dispatch,
                      setScrollPreference,
                      () => setIsModalVisible(false),
                      'ComicBook',
                      comicBookLink,
                    );
                  }}>
                  <Text style={styles.text}>
                    {!isVerticalScroll
                      ? 'Vertical Scroll'
                      : 'Horizontal Scroll'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: !detailsPageLink ? '#555' : '#FF6347'},
                  ]}
                  disabled={!detailsPageLink}
                  onPress={() => {
                    analytics().logEvent('navigate_Comic_details_page', {
                      screen: 'ComicBook',
                      currentChapterLink: comicBookLink?.toString(),
                      detailsPageLink: detailsPageLink?.toString(),
                      isDownloadComic: isDownloadComic?.toString(),
                      pageJump: pageJump?.toString(),
                      isVerticalScroll: isVerticalScroll?.toString(),
                    });

                    setIsModalVisible(false);
                    setImageLinkIndex(0);
                    navigation.replace(NAVIGATION.comicDetails, {
                      link: detailsPageLink,
                    });

                    dispatch(
                      updateData({
                        url: comicBookLink,
                        data: {lastReadPage: imageLinkIndex},
                        imageLength: comicBook?.images?.length ?? 0,
                        ComicDetailslink: ComicDetails?.link,
                        readAt: Date.now(),
                      }),
                    );
                  }}>
                  <Text style={styles.text}>Open Details Page</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: isPreviousChapter ? '#555' : '#FF6347'},
                  ]}
                  disabled={isPreviousChapter}
                  onPress={() => {
                    navigateToChapter('previous');
                    setIsModalVisible(false);
                    setImageLinkIndex(0);
                    analytics().logEvent('navigate_previous_chapter', {
                      screen: 'ComicBook',
                      currentChapterLink: comicBookLink?.toString(),
                    });
                  }}>
                  <Text style={styles.text}>Previous Chapter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: isNextChapter ? '#555' : '#FF6347'},
                  ]}
                  disabled={isNextChapter}
                  onPress={() => {
                    navigateToChapter('next');
                    setIsModalVisible(false);
                    setImageLinkIndex(0);
                    analytics().logEvent('navigate_next_chapter', {
                      screen: 'ComicBook',
                      currentChapterLink: comicBookLink?.toString(),
                    });
                  }}>
                  <Text style={styles.text}>Next Chapter</Text>
                </TouchableOpacity>

                {DetailsPage?.title && comicBookLink ? (
                  <TouchableOpacity
                    style={styles.button}
                    disabled={downloadLoading || isComicDownload}
                    onPress={() => {
                      if (isComicDownload) return;
                      if (downloadLoading) return;

                      analytics().logEvent('download_comic', {
                        screen: 'ComicBook',
                        comicBookLink: comicBookLink?.toString(),
                        DetailsPageLink: detailsPageLink?.toString(),
                        pageJump: pageJump,
                        isDownloadComic: isDownloadComic,
                        isVerticalScroll: isVerticalScroll,
                      });
                      showRewardedAd();
                      dispatch(
                        downloadComicBook({
                          comicDetails: DetailsPage,
                          comicBook: {...comicBook, link: comicBookLink},
                          setLoadingStatus: setDownloadLoading,
                          onProgress: (downloaded, total) => {
                            setProgress({downloaded, total});
                          },
                        }),
                      );
                    }}>
                    <Text style={styles.text}>
                      {isComicDownload
                        ? 'Downloaded'
                        : downloadLoading
                        ? `Downloading ${progress.downloaded}/${progress.total}`
                        : 'Download Comic'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.button}
                  onPress={async () => {
                    setIsModalVisible(false);
                    await analytics().logEvent('share_comic', {
                      screen: 'ComicBook',
                      comicBookLink: comicBookLink?.toString(),
                    });
                    Share.share({
                      message: `📖✨ Explore comics & manga for free with InkNest: your ultimate mobile companion
      
      InkNest is a free mobile app offering a vast collection of comics and manga across genres like superheroes, sci-fi, fantasy, and manga. Enjoy a seamless experience with user-friendly navigation and customizable settings. Stay updated with the latest releases and classics. With InkNest, your favorite stories and characters are always at your fingertips.
      
      🚀 Download now and start exploring: https://p2devs.github.io/InkNest/
      `,
                    });
                  }}>
                  <Text style={styles.text}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={async () => {
                    await analytics().logEvent('report_comic', {
                      screen: 'ComicBook',
                      comicBookLink: comicBookLink?.toString(),
                    });
                    Linking.openURL('https://discord.gg/WYwJefvWNT');
                    setIsModalVisible(false);
                  }}>
                  <Text style={styles.text}>Report</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                }}
                style={{
                  backgroundColor: '#FF6347',
                  padding: 10,
                  borderRadius: 5,
                  alignItems: 'center',
                }}>
                <Text style={styles.text}>Close</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  text: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FF6347',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
});
