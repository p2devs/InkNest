import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Modal,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';

import { heightPercentageToDP } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Gallery from '../Gallery/src';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { navigate, replace } from '../../Navigation/NavigationService';
import { NAVIGATION } from '../../Constants';

const GalleryPopup = ({ images, setClose, isOpen, link, BookMarkRemove }) => {
  const [PageIndex, setPageIndex] = useState(0);
  const [jumpToPage, setJumpToPage] = useState('');
  const GalleryRef = useRef(null);
  const InputRef = useRef(null);

  // Shared values for header and footer animations
  const headerOpacity = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);
  const footerOpacity = useSharedValue(1);
  const footerTranslateY = useSharedValue(0);

  // Control showing or hiding of the controls
  const [showControls, setShowControls] = useState(true);

  let hideControlsTimeout;

  useEffect(() => {
    if (!isOpen) setPageIndex(0);
    if (isOpen?.index) setPageIndex(isOpen?.index + 1);
  }, [isOpen]);

  // Function to hide controls with animation
  const hideControls = () => {
    headerOpacity.value = withTiming(0);
    headerTranslateY.value = withTiming(-50); // slide header up
    footerOpacity.value = withTiming(0);
    footerTranslateY.value = withTiming(50); // slide footer down
  };

  // Function to show controls with animation
  const showControlsAnimation = () => {
    headerOpacity.value = withTiming(1);
    headerTranslateY.value = withTiming(0);
    footerOpacity.value = withTiming(1);
    footerTranslateY.value = withTiming(0);
  };

  // Toggle controls
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);

    if (!showControls) {
      hideControlsTimeout = setTimeout(() => hideControls(), 5000);
    }
  }, [showControls]);

  useEffect(() => {
    if (showControls) {
      showControlsAnimation();
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

  return (
    <Modal
      animationType="slide"
      visible={isOpen !== null}
      onRequestClose={() => {
        setClose(null);
      }}>

      <TouchableWithoutFeedback onPress={toggleControls}>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: '#222',
          }}>
          {/* Header */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: '100%',
                height: heightPercentageToDP('4%'),
                top: heightPercentageToDP('6%'),
                backgroundColor: '#222',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                borderBottomColor: '#fff',
                borderBottomWidth: 0.5,
                marginBottom: 5,
                zIndex: 1,
              },
              headerAnimatedStyle,
            ]}>
            <TouchableOpacity
              onPress={() => {
                setClose(null);
              }}>
              <Ionicons
                name="chevron-back"
                size={30}
                color="#fff"
                style={{ marginRight: 10 }}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: heightPercentageToDP('2%'),
                fontWeight: 'bold',
                color: '#FFF',
              }}>
              {PageIndex + 1}/{images.length}
            </Text>

            {!link ? (
              <View style={{ width: 30 }} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  let RemoveIndex = images[PageIndex].id;
                  BookMarkRemove(link, RemoveIndex);
                }}>
                <FontAwesome6
                  name="book-bookmark"
                  size={24}
                  color={'yellow'}
                />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Gallery */}
          <Gallery
            data={images.map(item => item.image)}
            onIndexChange={newIndex => {
              setPageIndex(newIndex);
            }}
            pinchEnabled
            initialIndex={isOpen?.index}
            ref={GalleryRef}
          />

          {/* Footer */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: '100%',
                height: 50,
                backgroundColor: '#222',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingHorizontal: 12,
                borderBottomColor: '#fff',
                borderBottomWidth: 0.5,
                borderTopColor: '#fff',
                borderTopWidth: 0.5,
                marginBottom: 5,
                bottom: heightPercentageToDP('2%'),
              },
              footerAnimatedStyle,
            ]}>
            {!link ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{
                    width: '25%',
                    height: 35,
                    backgroundColor: '#333',
                    borderRadius: 5,
                    paddingHorizontal: 10,
                    marginRight: 10,
                    color: '#fff',
                  }}
                  placeholderTextColor={'#fff3'}
                  placeholder="Jump to"
                  keyboardType="numeric"
                  value={jumpToPage}
                  ref={InputRef}
                  onChangeText={text => {
                    if (text === '') return;
                    // Validate the input for page number
                    if (text.match(/[^0-9]/g)) {
                      setJumpToPage(text.replace(/[^0-9]/g, ''));
                      return Alert.alert('Please enter a valid page number');
                    }
                    let index = parseInt(text) - 1;
                    if (isNaN(index) || index < 0 || index >= images.length) {
                      return Alert.alert('Invalid page number');
                    }
                    setJumpToPage(index);
                  }}
                />
                <Text
                  style={{
                    fontSize: heightPercentageToDP('1.8%'),
                    fontWeight: 'bold',
                    color: '#FFF',
                  }}>
                  / {images.length}
                </Text>
                <TouchableOpacity
                  style={{ marginLeft: 10 }}
                  disabled={jumpToPage === ''}
                  onPress={() => {
                    if (jumpToPage === '') return;
                    GalleryRef.current?.setIndex(jumpToPage);
                    InputRef.current?.clear();
                    InputRef.current?.blur();
                    setJumpToPage('');
                  }}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={24}
                    color={!jumpToPage ? '#fff3' : '#fff'}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (link === undefined) return;
                  navigate(NAVIGATION.comicBook, {
                    comicBook: link,
                    pageJump: images[PageIndex]?.id,
                  });
                  setClose(null);
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={24}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{
                    fontSize: heightPercentageToDP('1.8%'),
                    fontWeight: 'bold',
                    color: '#FFF',
                  }}>
                  Jump To
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default GalleryPopup;
