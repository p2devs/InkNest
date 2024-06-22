import React, {useEffect, useState} from 'react';
import {
  View,
  Modal,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';

import {heightPercentageToDP} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Gallery from '../Gallery/src';
import {navigate} from '../../Navigation/NavigationService';
import {NAVIGATION} from '../../Constants';

const GalleryPopup = ({images, setClose, isOpen, link, BookMarkRemove}) => {
  const [PageIndex, setPageIndex] = useState(0);
  useEffect(() => {
    console.log(isOpen);
    if (!isOpen) setPageIndex(0);
    if (isOpen?.index) setPageIndex(isOpen?.index + 1);
  }, [isOpen]);
  return (
    <Modal
      animationType="slide"
      // transparent={true}
      visible={isOpen !== null}
      onRequestClose={() => {
        setClose(null);
      }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#222',
        }}>
        <View
          style={{
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
          }}>
          <TouchableOpacity
            onPress={() => {
              setClose(null);
            }}>
            <Ionicons
              name="chevron-back"
              size={30}
              color="#fff"
              style={{marginRight: 10}}
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

          <TouchableOpacity
            onPress={() => {
              let RemoveIndex = images[PageIndex].id;
              BookMarkRemove(link, RemoveIndex);
            }}>
            <FontAwesome6 name="book-bookmark" size={24} color={'yellow'} />
          </TouchableOpacity>
        </View>
        <Gallery
          data={images.map(item => item.image)}
          onIndexChange={newIndex => {
            setPageIndex(newIndex);
          }}
          initialIndex={isOpen?.index}
        />
        <View
          style={{
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
            bottom: heightPercentageToDP('3%'),
          }}>
          <TouchableOpacity
            onPress={() => {
              console.log({
                name: NAVIGATION.comicBook,
                link,
                id: images[PageIndex].id,
              });
              navigate(NAVIGATION.comicBook, {
                comicBook: link,
                pageJump: images[PageIndex]?.id,
              });
              setClose(null);
            }}
            style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={24}
              color="#fff"
              style={{marginRight: 10}}
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
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default GalleryPopup;
