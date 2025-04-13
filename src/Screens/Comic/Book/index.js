import React, {useEffect, useState, useMemo, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {useFeatureFlag} from 'configcat-react';
import {
  stackTransition,
  Gallery,
  fitContainer,
  ResumableZoom,
  useImageResolution,
} from 'react-native-zoom-toolkit';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {SafeAreaView} from 'react-native-safe-area-context';

import Ionicons from 'react-native-vector-icons/Ionicons';

import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import Header from '../../../Components/UIComp/Header';
import {goBack} from '../../../Navigation/NavigationService';
import GalleryImage from './GalleryImage';

export function ComicBook({navigation, route}) {
  const dispatch = useDispatch();
  const {comicBookLink, pageJump, isDownloadComic, chapterlink} = route?.params;
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );
  const ref = useRef(null);

  const comicBook = useSelector(state => state?.data?.dataByUrl[comicBookLink]);
  const loading = useSelector(state => state?.data?.loading);
  const error = useSelector(state => state?.data?.error);
  const [imageLinkIndex, setImageLinkIndex] = useState(0);

  useEffect(() => {
    if (comicBookLink) {
      dispatch(fetchComicBook(comicBookLink));
    }
  }, [comicBookLink, dispatch]);

  const activeIndex = useSharedValue(0);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading comic data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Error: {error}</Text>
      </View>
    );
  }

  if (!comicBook) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No data available</Text>
      </View>
    );
  }

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
          Page: {imageLinkIndex + 1} / {comicBook?.images.length}
        </Text>

        <View style={{flex: 0.1}} />
      </Header>
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A', // Using the dark background from your app
  },
  text: {
    fontSize: 20,
    color: '#fff',
  },
});
