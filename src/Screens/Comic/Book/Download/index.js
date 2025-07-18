import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Share,
} from 'react-native';

import {useSelector, useDispatch} from 'react-redux';
import {Gallery, useImageResolution} from 'react-native-zoom-toolkit';
import {useSharedValue} from 'react-native-reanimated';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';

import Header from '../../../../Components/UIComp/Header';
import {goBack} from '../../../../Navigation/NavigationService';
import GalleryImage from './GalleryImage';
import VerticalView from './VerticalView';
import {setScrollPreference} from '../../../../Redux/Reducers';
import {handleScrollModeChange} from '../../../../Utils/ScrollModeUtils';

import { isMacOS } from '../../../../Utils/PlatformUtils';

// Conditional imports for Firebase
let analytics = { logEvent: () => Promise.resolve() };
let crashlytics = { log: () => {}, recordError: () => {}, setAttribute: () => {}, setUserId: () => {} };
let messaging = { onMessage: () => {}, getToken: () => Promise.resolve('') };
let perf = { newTrace: () => ({ start: () => {}, stop: () => {} }) };
let inAppMessaging = { setAutomaticDataCollectionEnabled: () => {} };

if (!isMacOS) {
  try {
    analytics = require('@react-native-firebase/analytics').default;
    crashlytics = require('@react-native-firebase/crashlytics').default;
    messaging = require('@react-native-firebase/messaging').default;
    perf = require('@react-native-firebase/perf').default;
    inAppMessaging = require('@react-native-firebase/in-app-messaging').default;
  } catch (error) {
    console.log('Firebase modules not available on this platform');
  }
}

export function DownloadComicBook({route}) {
  const dispatch = useDispatch();
  const {isDownloadComic, chapterlink} = route?.params;

  const ref = useRef(null);

  const DownloadComic = useSelector(state => state?.data?.DownloadComic);
  const userScrollPreference = useSelector(state => state?.data?.scrollPreference);

  const loading = useSelector(state => state?.data?.loading);
  const error = useSelector(state => state?.data?.error);

  const [imageLinkIndex, setImageLinkIndex] = useState(0);
  const [isVerticalScroll, setIsVerticalScroll] = useState(userScrollPreference === 'vertical');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [extractDownloaded, setExtractDownloaded] = useState(null);

  useEffect(() => {
    if (isDownloadComic) {
      const extractedData =
        DownloadComic[isDownloadComic]?.comicBooks[chapterlink];
      if (extractedData) {
        setExtractDownloaded(extractedData);
      }
    }
  }, [isDownloadComic, DownloadComic, chapterlink]);

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

  const keyExtractor = useCallback((item, index) => `${item.uri}-${index}`, []);

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
              analytics.logEvent('go_back', {
                screen: 'DownloadComicBook',
                comicBookLink: isDownloadComic?.toString(),
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
            setImageLinkIndex={setImageLinkIndex}
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
              activeIndex.value = idx;
              setImageLinkIndex(idx);
            }}
            pinchCenteringMode={'sync'}
            onVerticalPull={onVerticalPulling}
          />
        )}
      </SafeAreaView>
      {isModalVisible && (
        <SafeAreaView>
          {(() => {
            // On macOS, render as a regular View instead of Modal to avoid RCTModalHostView error
            const ContentWrapper = isMacOS ? View : Modal;
            const contentProps = isMacOS 
              ? {
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  }
                }
              : {
                  animationType: "slide",
                  transparent: true,
                  visible: isModalVisible,
                  onRequestClose: () => {
                    setIsModalVisible(!isModalVisible);
                  }
                };

            return (
              <ContentWrapper {...contentProps}>
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
                      isDownloadComic
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
                    await analytics.logEvent('share_comic', {
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
                    await analytics.logEvent('report_comic', {
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
              </ContentWrapper>
            );
          })()}
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
