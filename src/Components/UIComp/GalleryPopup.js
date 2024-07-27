import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';

import { heightPercentageToDP } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import Gallery from '../Gallery/src';
import { navigate } from '../../Navigation/NavigationService';
import { NAVIGATION } from '../../Constants';

const GalleryPopup = ({ images, setClose, isOpen, link, BookMarkRemove }) => {
  const [PageIndex, setPageIndex] = useState(0);
  const [jumpToPage, setJumpToPage] = useState("");
  const GalleryRef = useRef(null);
  const InputRef = useRef(null);
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

          {!link ?
            <View style={{ width: 30 }} />
            :
            <TouchableOpacity
              onPress={() => {
                let RemoveIndex = images[PageIndex].id;
                BookMarkRemove(link, RemoveIndex);
              }}>
              <FontAwesome6 name="book-bookmark" size={24} color={'yellow'} />
            </TouchableOpacity>}
        </View>
        <Gallery
          data={images.map(item => item.image)}
          onIndexChange={newIndex => {
            setPageIndex(newIndex);
          }}
          pinchEnabled
          initialIndex={isOpen?.index}
          ref={GalleryRef}
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
            bottom: heightPercentageToDP('2%'),
          }}>
          {!link ?
            <View
              style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                value={PageIndex + 1}
                ref={InputRef}
                onChangeText={(text) => {
                  if (text === '') return;
                  let index = parseInt(text) - 1;
                  //check is vaild number
                  if (isNaN(index)) return Alert.alert('Please enter a valid number');
                  if (index < 0 || index >= images.length) return Alert.alert('Invalid page number');
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
                onPress={() => {
                  GalleryRef.current?.setIndex(jumpToPage);
                  InputRef.current?.clear();
                  InputRef.current?.blur();
                  setJumpToPage("");
                }}>
                <MaterialCommunityIcons
                  name="book-open-page-variant-outline"
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            :
            <TouchableOpacity
              onPress={() => {
                if (link === undefined) return;
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
          }
        </View>

      </SafeAreaView>
    </Modal>
  );
};

export default GalleryPopup;
