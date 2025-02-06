import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import Gallery from '../../../Components/Gallery/src/index';
import {updateData} from '../../../Redux/Reducers';
import ComicBookHeader from '../../../Components/UIComp/ComicBookHeader';
import ComicBookFooter from '../../../Components/UIComp/ComicBookFooter';
import Image from '../../../Components/UIComp/Image';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import WebView from 'react-native-webview';

export function ComicBook({navigation, route}) {
  const {comicBookLink, pageJump, isDownloadComic, chapterlink} = route?.params;
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
  const DownloadComic = useSelector(state => state?.data?.DownloadComic);
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const [PageIndex, setPageIndex] = useState(
    pageJump ?? ComicBook?.lastReadPage ?? 0,
  );
  const [ViewAll, setViewAll] = useState(false);
  const [DownloadedBook, setDownloadedBook] = useState(null);

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
  }, [comicBookLink]);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => StatusBar.setHidden(false);
  }, []);

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

  const GridImageItem = props => {
    const {item, index} = props;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          setPageIndex(index);
          setViewAll(false);
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

  if (loading && !isDownloadComic) {
    return <Loading />;
  }

  if (error && !isDownloadComic) {
    console.log(error, comicBookLink);

    if (error.includes('403')) {
      console.log('403 error');

      const injectedJS = `
      (function() {
          const logoElement = document.querySelector('a[title="Read All Comics Online"]');
        if (logoElement) {
          window.ReactNativeWebView.postMessage(document.documentElement.outerHTML);
        } else {
          let previousKey = '';
          const observer = new MutationObserver(() => {
            const key = document.querySelector('meta[name="key"]').getAttribute('content');
            if (key !== previousKey) {
              previousKey = key;
              window.ReactNativeWebView.postMessage('Key changed: ' + key);
            }
          });
          observer.observe(document, { attributes: true, childList: true, subtree: true });
        }
      })();
    `;

      const onMessage = async event => {
        const {data} = event.nativeEvent;
        console.log('data: ', data);

        const html = data;
        console.log('HTML: data ', html, 'comicBookLink', comicBookLink);
        
        dispatch(fetchComicBook(comicBookLink, null, false, html));
      };
      console.log(loading, 'inside error block', error);
      
      return (
        <WebView
          source={{uri: comicBookLink}}
          injectedJavaScript={injectedJS}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      );
    }

    return <Error error={error} />;
  }
  console.log(loading, 'comicBookLink', error);

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#14142a'}}
      edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={toggleControls}>
        {/* Wrap the entire view with TouchableWithoutFeedback to detect taps */}
        <View style={{flex: 1}}>
          {ViewAll ? (
            <FlatList
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
            <Gallery
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
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
