import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Share,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {useFeatureFlag} from 'configcat-react';
import {Gallery} from 'react-native-zoom-toolkit';
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
  const [isVerticalScroll, setIsVerticalScroll] = useState(false);
  const [isModelVisible, setIsModalVisible] = useState(false);

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
    <>
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

          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </Header>
        {isVerticalScroll ? (
          <VerticalView
            data={comicBook?.images}
            loading={loading}
            setImageLinkIndex={setImageLinkIndex}
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
          />
        )}
      </SafeAreaView>
      {isModelVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModelVisible}
          onRequestClose={() => {
            setIsModalVisible(!isModelVisible);
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
              style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setIsVerticalScroll(!isVerticalScroll);
                  setIsModalVisible(false);
                  setImageLinkIndex(0);
                  analytics().logEvent('toggle_vertical_scroll', {
                    screen: 'ComicBook',
                    isVerticalScroll: !isVerticalScroll,
                  });
                }}>
                <Text style={styles.text}>
                  {!isVerticalScroll ? 'Vertical Scroll' : 'Horizontal Scroll'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={async () => {
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
                  setIsModalVisible(false);
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
