import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';

import {useSelector, useDispatch} from 'react-redux';
import {Gallery, useImageResolution} from 'react-native-zoom-toolkit';
import {useSharedValue} from 'react-native-reanimated';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';
import analytics from '@react-native-firebase/analytics';
import * as RNFS from '@dr.pogodin/react-native-fs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import Header from '../../../../Components/UIComp/Header';
import {goBack} from '../../../../Navigation/NavigationService';
import GalleryImage from './GalleryImage';
import VerticalView from './VerticalView';
import {
  setScrollPreference,
  updateDownloadedComicBook,
} from '../../../../Redux/Reducers';
import {handleScrollModeChange} from '../../../../Utils/ScrollModeUtils';
import {downloadComicBook} from '../../../../InkNest-Externals/Redux/Actions/Download';

export function DownloadComicBook({route}) {
  const dispatch = useDispatch();
  const {isDownloadComic, chapterlink} = route?.params;

  const ref = useRef(null);

  const DownloadComic = useSelector(state => state?.data?.DownloadComic);
  const userScrollPreference = useSelector(
    state => state?.data?.scrollPreference,
  );

  const loading = useSelector(state => state?.data?.loading);
  const error = useSelector(state => state?.data?.error);

  const [imageLinkIndex, setImageLinkIndex] = useState(0);
  const [isVerticalScroll, setIsVerticalScroll] = useState(
    userScrollPreference === 'vertical',
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [extractDownloaded, setExtractDownloaded] = useState(null);
  const [isMissingFiles, setIsMissingFiles] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({downloaded: 0, total: 0});

  const normalizeLocalPath = useCallback(path => {
    if (typeof path !== 'string') {
      return '';
    }

    if (path.startsWith('file://')) {
      return path.replace('file://', '');
    }

    return path;
  }, []);

  const ensureStoredFiles = useCallback(
    async data => {
      if (!data) {
        return false;
      }

      const candidatePaths = [];

      if (data.folderPath) {
        candidatePaths.push(normalizeLocalPath(data.folderPath));
      }

      if (Array.isArray(data.downloadedImagesPath)) {
        const firstImagePath = data.downloadedImagesPath[0];
        if (firstImagePath) {
          candidatePaths.push(normalizeLocalPath(firstImagePath));
        }
      }

      if (candidatePaths.length === 0) {
        return false;
      }

      try {
        const checks = await Promise.all(
          candidatePaths.map(async path => {
            if (!path) {
              return false;
            }
            try {
              return await RNFS.exists(path);
            } catch (err) {
              console.log('RNFS exists check failed', err);
              return false;
            }
          }),
        );

        return checks.every(Boolean);
      } catch (error) {
        console.log('ensureStoredFiles error', error);
        return false;
      }
    },
    [normalizeLocalPath],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateDownloadedComic = async () => {
      if (!isDownloadComic) {
        if (isMounted) {
          setExtractDownloaded(null);
          setIsMissingFiles(false);
        }
        return;
      }

      const storedEntry =
        DownloadComic?.[isDownloadComic]?.comicBooks?.[chapterlink];

      if (!storedEntry) {
        if (isMounted) {
          setExtractDownloaded(null);
          setIsMissingFiles(false);
        }
        return;
      }

      const hasFiles = await ensureStoredFiles(storedEntry);

      if (!isMounted) {
        return;
      }

      setExtractDownloaded(storedEntry);
      setIsMissingFiles(!hasFiles);
      if (hasFiles) {
        setIsSyncing(false);
        setSyncProgress({downloaded: 0, total: 0});
      }
    };

    hydrateDownloadedComic();

    return () => {
      isMounted = false;
    };
  }, [
    DownloadComic,
    chapterlink,
    ensureStoredFiles,
    isDownloadComic,
  ]);

  useEffect(() => {
    if (route?.params?.localComic) {
      let localComic = route?.params?.localComic;
      let pages = localComic.map((page, index) => page.uri);
      setExtractDownloaded({downloadedImagesPath: pages});
      setImageLinkIndex(route?.params?.initialIndex || 0);
    }
  }, [route?.params?.localComic, route?.params?.initialIndex]);

  useEffect(() => {
    if (
      extractDownloaded?.lastReadPage !== undefined &&
      Array.isArray(extractDownloaded?.downloadedImagesPath) &&
      extractDownloaded.downloadedImagesPath.length > 0
    ) {
      const maxIndex = extractDownloaded.downloadedImagesPath.length - 1;
      const safeIndex = Math.min(
        Math.max(extractDownloaded.lastReadPage, 0),
        maxIndex,
      );

      setImageLinkIndex(safeIndex);
      activeIndex.value = safeIndex;

      if (!isVerticalScroll && ref?.current && safeIndex >= 0) {
        ref.current.setIndex(safeIndex);
      }
    }
  }, [
    activeIndex,
    extractDownloaded?.downloadedImagesPath,
    extractDownloaded?.lastReadPage,
    isVerticalScroll,
  ]);

  const activeIndex = useSharedValue(0);

  const imageSource = useMemo(() => {
    if (extractDownloaded?.downloadedImagesPath?.length > 0) {
      return {
        uri: extractDownloaded?.downloadedImagesPath[0],
      };
    }
    return {
      uri: '',
    };
  }, [extractDownloaded?.downloadedImagesPath]);

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

  const keyExtractor = useCallback((item, index) => `${item}-${index}`, []);

  const handleDownloadedPageChange = useCallback(
    newIndex => {
      if (typeof newIndex !== 'number' || Number.isNaN(newIndex)) {
        return;
      }

      const totalPages =
        extractDownloaded?.downloadedImagesPath?.length ?? 0;
      const safeIndex =
        totalPages > 0
          ? Math.min(Math.max(newIndex, 0), totalPages - 1)
          : Math.max(newIndex, 0);

      if (safeIndex === imageLinkIndex) {
        return;
      }

      setImageLinkIndex(safeIndex);
      activeIndex.value = safeIndex;

      if (isDownloadComic && chapterlink) {
        dispatch(
          updateDownloadedComicBook({
            comicDetailsLink: isDownloadComic,
            chapterLink: chapterlink,
            data: {lastReadPage: safeIndex},
          }),
        );
      }
    },
    [
      activeIndex,
      chapterlink,
      dispatch,
      extractDownloaded?.downloadedImagesPath?.length,
      imageLinkIndex,
      isDownloadComic,
    ],
  );

  const handleSyncDownloads = useCallback(() => {
    if (!isDownloadComic || !chapterlink || !extractDownloaded?.comicBook) {
      return;
    }

    setIsSyncing(true);
    setSyncProgress({downloaded: 0, total: 0});

    const parentSeries = DownloadComic?.[isDownloadComic];

    dispatch(
      downloadComicBook({
        comicDetails: {
          title: parentSeries?.title ?? extractDownloaded?.comicBook?.title,
          link: parentSeries?.link ?? isDownloadComic,
          imgSrc: parentSeries?.imgSrc ?? extractDownloaded?.comicBook?.imgSrc,
        },
        comicBook: {
          ...extractDownloaded.comicBook,
          link: extractDownloaded?.comicBook?.link ?? chapterlink,
        },
        setLoadingStatus: status => {
          setIsSyncing(Boolean(status));
          if (!status) {
            setSyncProgress({downloaded: 0, total: 0});
          }
        },
        onProgress: (downloaded, total) =>
          setSyncProgress({downloaded, total}),
        initialLastReadPage: extractDownloaded?.lastReadPage ?? 0,
      }),
    );
  }, [
    DownloadComic,
    chapterlink,
    dispatch,
    extractDownloaded,
    isDownloadComic,
  ]);

  // used to derived the color animation when pulling vertically
  const translateY = useSharedValue(0);
  const onVerticalPulling = ty => {
    'worklet';
    translateY.value = ty;
  };

  useEffect(() => {
    if (!isVerticalScroll && imageLinkIndex > 0) {
      ref?.current?.setIndex(imageLinkIndex);
    }
  }, [isVerticalScroll, imageLinkIndex, ref]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Loading comic data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  if (isMissingFiles) {
    return (
      <SafeAreaView style={styles.container}>
        <Text
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 20,
            paddingHorizontal: 24,
          }}>
          We could not find the downloaded files for this chapter. Sync to
          restore them offline.
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            {opacity: isSyncing ? 0.7 : 1, width: '80%'},
          ]}
          disabled={
            isSyncing || !extractDownloaded?.comicBook?.images?.length
          }
          onPress={handleSyncDownloads}>
          {isSyncing ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.text}>
                {syncProgress.total
                  ? `Syncing ${syncProgress.downloaded}/${syncProgress.total}`
                  : 'Syncing downloads...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.text}>Sync Downloads</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: '#555', width: '80%'}]}
          onPress={() => {
            goBack();
          }}>
          <Text style={styles.text}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!extractDownloaded) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>No data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{flex: 1, backgroundColor: '#14142A'}}>
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
                screen: 'DownloadComicBook',
                comicBookLink: isDownloadComic?.toString(),
              });
              handleDownloadedPageChange(imageLinkIndex);
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
            Page: {imageLinkIndex + 1} /{' '}
            {extractDownloaded?.downloadedImagesPath.length}
          </Text>

          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </Header>
        {isVerticalScroll ? (
          <VerticalView
            data={extractDownloaded?.downloadedImagesPath}
            loading={loading}
            setImageLinkIndex={handleDownloadedPageChange}
            activeIndex={activeIndex?.value}
            resolutions={resolution}
          />
        ) : (
          <Gallery
            ref={ref}
            data={extractDownloaded?.downloadedImagesPath}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            gap={24}
            onIndexChange={idx => {
              handleDownloadedPageChange(idx);
            }}
            pinchCenteringMode={'sync'}
            onVerticalPull={onVerticalPulling}
          />
        )}
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
                      'DownloadComicBook',
                      isDownloadComic,
                    );
                  }}>
                  <Text style={styles.text}>
                    {!isVerticalScroll
                      ? 'Vertical Scroll'
                      : 'Horizontal Scroll'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={async () => {
                    setIsModalVisible(false);
                    await analytics().logEvent('share_comic', {
                      screen: 'DownloadComicBook',
                      comicBookLink: isDownloadComic?.toString(),
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
                      screen: 'DownloadComicBook',
                      comicBookLink: isDownloadComic?.toString(),
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
    justifyContent: 'center',
    alignItems: 'center',
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
