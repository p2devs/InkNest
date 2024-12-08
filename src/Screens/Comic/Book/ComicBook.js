import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

import { fetchComicBook } from '../../../Redux/Actions/GlobalActions';
import Loading from '../../../Components/UIComp/Loading';
import Error from '../../../Components/UIComp/Error';
import Gallery from '../../../Components/Gallery/src/index';
import { updateData } from '../../../Redux/Reducers';
import ComicBookHeader from '../../../Components/UIComp/ComicBookHeader';
import ComicBookFooter from '../../../Components/UIComp/ComicBookFooter';
import Image from '../../../Components/UIComp/Image';

export function ComicBook({ navigation, route }) {
  const { comicBook, pageJump, isDownloadComic } = route?.params;
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBook]);
  const DownloadComic = useSelector(state => state?.data?.DownloadComic);
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const [PageIndex, setPageIndex] = useState(pageJump ?? ComicBook?.lastReadPage ?? 0);
  const [ViewAll, setViewAll] = useState(false);
  const [DownloadedBook, setDownloadedBook] = useState(null);

  const { width } = Dimensions.get('window');
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
    if(isDownloadComic) {

      const extractedData = DownloadComic[isDownloadComic]?.comicBooks;
      {Object.keys(extractedData).slice(0, 1).map((key, index) => {
        let data = extractedData[key];
        console.log("DownloadedBook -->", data?.comicBook?.images);
        setDownloadedBook(data?.comicBook);
      });
      }
    }
  }, [isDownloadComic]);

  useEffect(() => {
    if(isDownloadComic) { 
      return;
    }
    dispatch(fetchComicBook(comicBook));
  }, [comicBook, dispatch]);

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
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
      transform: [{ translateY: footerTranslateY.value }],
    };
  });

  if (loading && !isDownloadComic) {
    return <Loading />;
  }

  if (error && !isDownloadComic) {
    return <Error error={error} />;
  }

  const GridImageItem = props => {
    const { item, index } = props;
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
          source={{ uri: item }}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={toggleControls}>
        {/* Wrap the entire view with TouchableWithoutFeedback to detect taps */}
        <View style={{ flex: 1 }}>
          {ViewAll ? (
            <FlatList
              data={isDownloadComic ? DownloadedBook?.images : ComicBook?.images}
              renderItem={({ item, index }) => <GridImageItem item={item} index={index} />}
              keyExtractor={(item, index) => index.toString()}
              numColumns={numColumns}
              key={numColumns}
              style={{
                flex: 1,
                marginVertical: 60,
              }}
            />
          ) : DownloadedBook?.images||ComicBook?.images ? (
            <Gallery
              data={isDownloadComic ? DownloadedBook?.images : ComicBook?.images}
              onIndexChange={newIndex => {
                if(!isDownloadComic) {
                  dispatch(
                    updateData({ url: comicBook, data: { lastReadPage: newIndex } }),
                  );
                }
                setPageIndex(newIndex);
              }}
              initialIndex={PageIndex}
            />
          ) : null}

          {/* Conditionally render the header/footer only if showControls is true */}
          <Animated.View style={[{ position: 'absolute', top: 0, width: '100%' }, headerAnimatedStyle]}>
            <ComicBookHeader
              comicBook={isDownloadComic ? DownloadedBook : ComicBook}
              PageIndex={PageIndex}
              ViewAll={ViewAll}
              showBookmark={isDownloadComic ? false : true}
            />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', bottom: 0, width: '100%' }, footerAnimatedStyle]}>
            <ComicBookFooter
              comicBook={isDownloadComic ? DownloadedBook : ComicBook}
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
