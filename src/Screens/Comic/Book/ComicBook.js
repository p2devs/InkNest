import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  Text,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {useFeatureFlag} from 'configcat-react';

import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import Gallery from '../../../Components/Gallery/src/index';
import VerticalGallery from '../../../Components/VerticalGallery';
import {updateData} from '../../../Redux/Reducers';
import ComicBookHeader from '../../../Components/UIComp/ComicBookHeader';
import ComicBookFooter from '../../../Components/UIComp/ComicBookFooter';
import Image from '../../../Components/UIComp/Image';
import { isMacOS } from '../../../Utils/PlatformUtils';

// Conditional imports for device info
let getVersion = () => '1.0.0'; // Default fallback
if (!isMacOS) {
  try {
    const deviceInfo = require('react-native-device-info');
    getVersion = deviceInfo.getVersion;
  } catch (error) {
    console.log('Device info not available on this platform');
  }
}

export function ComicBook({navigation, route}) {
  const {comicBookLink, pageJump, isDownloadComic, chapterlink} = route?.params;
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
  const DownloadComic = useSelector(state => state?.data?.DownloadComic);
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const [PageIndex, setPageIndex] = useState(
    pageJump ?? ComicBook?.lastReadPage ?? 1,
  );
  const [ViewAll, setViewAll] = useState(false);
  const [DownloadedBook, setDownloadedBook] = useState(null);
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );
  const [images, setImages] = useState([]);
  // Add scrollMode state - 'horizontal' is the default as the app currently uses
  const [scrollMode, setScrollMode] = useState('horizontal');

  const {width} = Dimensions.get('window');
  const numColumns = 3;
  const imageSize = width / numColumns - 10;

  // State for controlling whether the controls are visible
  const [showControls, setShowControls] = useState(true);

  // Shared values for header and footer opacity and position
  const headerOpacity = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);
  const footerOpacity = useSharedValue(1);
  const footerTranslateY = useSharedValue(0);

  let hideControlsTimeout;

  useEffect(() => {
    if (isDownloadComic) {
      const extractedData =
        DownloadComic[isDownloadComic]?.comicBooks[chapterlink];
      setDownloadedBook(extractedData);
    }
  }, [isDownloadComic]);

  useEffect(() => {
    if (isDownloadComic) {
      return;
    }
    dispatch(fetchComicBook(comicBookLink));
  }, [comicBookLink, dispatch]);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

  useEffect(() => {
    let newImages = [];
    if (
      comicBookLink === 'https://comicbookplus.com/?dlid=16848' ||
      comicBookLink === 'https://comicbookplus.com/?dlid=15946'
    ) {
      for (let index = 0; index < 35; index++) {
        newImages.push(
          `https://box01.comicbookplus.com/viewer/4a/4af4d2facd653c6fee0013367c681f6a/${index}.jpg`,
        );
      }
    } else if (
      comicBookLink === 'https://comicbookplus.com/?dlid=16857' ||
      comicBookLink === 'https://comicbookplus.com/?cid=860'
    ) {
      for (let index = 0; index < 35; index++) {
        newImages.push(
          `https://box01.comicbookplus.com/viewer/7c/7ce6723c8f20d1ce3b78c2cda1debc50/${index}.jpg`,
        );
      }
    }

    // Only update state if newImages differs from the current images state.
    if (JSON.stringify(newImages) !== JSON.stringify(images)) {
      setImages(newImages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comicBookLink, forIosValue, forIosLoading]);

  // Function to hide/show controls with animation
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);

    if (!showControls) {
      // Reset hide controls timer when showing them
      hideControlsTimeout = setTimeout(() => hideControls(), 5000);
    }
  }, [showControls]);

  const hideControls = () => {
    headerOpacity.value = withTiming(0);
    headerTranslateY.value = withTiming(-50); // slide header up
    footerOpacity.value = withTiming(0);
    footerTranslateY.value = withTiming(50); // slide footer down
  };

  const FnshowControls = () => {
    headerOpacity.value = withTiming(1);
    headerTranslateY.value = withTiming(0);
    footerOpacity.value = withTiming(1);
    footerTranslateY.value = withTiming(0);
  };

  useEffect(() => {
    if (showControls) {
      FnshowControls();
      hideControlsTimeout = setTimeout(() => hideControls(), 5000);
    } else {
      hideControls();
    }

    // Clear timeout when the component unmounts or showControls state changes
    return () => clearTimeout(hideControlsTimeout);
  }, [showControls]);

  // Animated styles for header and footer
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{translateY: headerTranslateY.value}],
    };
  });

  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
      transform: [{translateY: footerTranslateY.value}],
    };
  });

  if (loading && !isDownloadComic) {
    return <Loading />;
  }

  if (error && !isDownloadComic) {
    return <Error error={error} />;
  }

  const GridImageItem = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          setPageIndex(index);
          setViewAll(!ViewAll);
        }}
        style={{
          margin: 5,
          borderRadius: 5,
          overflow: 'hidden',
          backgroundColor: '#333',
        }}>
        <Image
          source={{uri: item}}
          style={{
            width: imageSize,
            height: imageSize,
          }}
        />
        {ComicBook?.BookmarkPages?.includes(index) && (
          <Entypo
            name="bookmark"
            size={24}
            color="yellow"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1,
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (getVersion() === forIosValue && forIosLoading === false) {
    return (
      <SafeAreaView
        style={{flex: 1, backgroundColor: '#14142a'}}
        edges={['top', 'bottom']}>
        <TouchableWithoutFeedback onPress={toggleControls}>
          <View style={{flex: 1}}>
            {ViewAll ? (
              <TouchableOpacity
                style={{flex: 1}}
                onPress={() => setViewAll(false)}>
                <Image
                  source={{uri: images[PageIndex]}}
                  style={{flex: 1}}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ) : (
              <FlatList
                data={images}
                renderItem={({item, index}) => (
                  <GridImageItem item={item} index={index} />
                )}
                numColumns={numColumns}
                style={{
                  flex: 1,
                  marginVertical: 60,
                }}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#14142a'}}
      edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={toggleControls}>
        {/* Wrap the entire view with TouchableWithoutFeedback to detect taps */}
        <View style={{flex: 1}}>
          {ViewAll ? (
            <FlatList
              key="gridView"
              data={
                isDownloadComic
                  ? DownloadedBook?.downloadedImagesPath
                  : ComicBook?.images
              }
              renderItem={({item, index}) => (
                <GridImageItem item={item} index={index} />
              )}
              numColumns={numColumns}
              style={{
                flex: 1,
                marginVertical: 60,
              }}
            />
          ) : DownloadedBook?.downloadedImagesPath || ComicBook?.images ? (
            scrollMode === 'horizontal' ? (
              <Gallery
                key="galleryView"
                data={
                  isDownloadComic
                    ? DownloadedBook?.downloadedImagesPath
                    : ComicBook?.images
                }
                onIndexChange={newIndex => {
                  if (!isDownloadComic) {
                    dispatch(
                      updateData({
                        url: comicBookLink,
                        data: {lastReadPage: newIndex},
                        imageLength: ComicBook?.images?.length,
                        ComicDetailslink: ComicBook?.ComicDetailslink,
                      }),
                    );
                  }
                  setPageIndex(newIndex);
                }}
                initialIndex={PageIndex}
              />
            ) : (
              <VerticalGallery
                key="verticalGalleryView"
                data={
                  isDownloadComic
                    ? DownloadedBook?.downloadedImagesPath
                    : ComicBook?.images
                }
                onPageChange={newIndex => {
                  if (!isDownloadComic) {
                    dispatch(
                      updateData({
                        url: comicBookLink,
                        data: {lastReadPage: newIndex},
                        imageLength: ComicBook?.images?.length,
                        ComicDetailslink: ComicBook?.ComicDetailslink,
                      }),
                    );
                  }
                  setPageIndex(newIndex);
                }}
                initialIndex={PageIndex}
                onSingleTap={toggleControls}
              />
            )
          ) : null}

          {/* Conditionally render the header/footer only if showControls is true */}
          <Animated.View
            style={[
              {position: 'absolute', top: 0, width: '100%'},
              headerAnimatedStyle,
            ]}>
            <ComicBookHeader
              comicBookLink={isDownloadComic ? DownloadedBook : comicBookLink}
              PageIndex={PageIndex}
              ViewAll={ViewAll}
              showBookmark={isDownloadComic ? false : true}
            />
          </Animated.View>
          <Animated.View
            style={[
              {position: 'absolute', bottom: 0, width: '100%'},
              footerAnimatedStyle,
            ]}>
            <ComicBookFooter
              comicBookLink={isDownloadComic ? DownloadedBook : comicBookLink}
              setViewAll={setViewAll}
              ViewAll={ViewAll}
              navigation={navigation}
              showButton={isDownloadComic ? false : true}
              scrollMode={scrollMode}
              setScrollMode={setScrollMode}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
