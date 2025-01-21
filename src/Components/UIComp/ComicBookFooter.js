import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';

import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {NAVIGATION} from '../../Constants';

const ComicBookFooter = ({
  comicBookLink,
  setViewAll,
  ViewAll,
  navigation,
  showButton,
}) => {
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
  const baseUrl = useSelector(state => state.data.baseUrl);
  const index = ComicBook?.volumes?.findIndex(item => {
    const checklinkBaseUrl = item?.link.includes('readallcomics.com')
      ? 'readallcomics'
      : 'azcomic';
    const currentComic =
      'azcomic' == checklinkBaseUrl
        ? item.title.split('#')[1] === ComicBook?.title.split('#')[1]
        : item.title.replace('- Reading', '').trim() === ComicBook?.title;
    return currentComic;
  });

  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        bottom: 0,
      }}>
      <TouchableOpacity
        onPress={() => {
          setViewAll(!ViewAll);
        }}>
        <Ionicons
          name={ViewAll ? 'book-outline' : 'grid'}
          size={24}
          color="#fff"
        />
        <Text
          style={{
            fontSize: 12,
            color: '#fff',
            opacity: 0.5,
          }}>
          Grid
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        {index !== ComicBook?.volumes.length - 1 ? (
          showButton ? (
            <TouchableOpacity
              onPress={() => {
                if (index < ComicBook?.volumes.length - 1) {
                  navigation.replace(NAVIGATION.comicBook, {
                    comicBookLink: ComicBook?.volumes[index + 1].link,
                  });
                }
              }}
              style={{
                alignItems: 'center',
              }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color="#fff"
                style={{marginRight: 10, opacity: 0.9}}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: '#fff',
                  opacity: 0.5,
                }}>
                Back Vol
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )
        ) : null}
        {ComicBook?.volumes.length == 1 ? (
          <View />
        ) : showButton ? (
          <TouchableOpacity
            onPress={() => {
              console.log(index, ComicBook?.volumes.length - 1, 'index');
              if (index < ComicBook?.volumes.length - 1 || index > 0) {
                navigation.replace(NAVIGATION.comicBook, {
                  comicBookLink: ComicBook?.volumes[index - 1]?.link,
                });
              }
            }}
            style={{
              alignItems: 'center',
            }}
            disabled={index == 0}>
            <Ionicons
              name="arrow-forward"
              size={24}
              color="#fff"
              style={{marginRight: 10, opacity: 0.9}}
            />
            <Text
              style={{
                fontSize: 12,
                color: '#fff',
                opacity: 0.5,
              }}>
              Next Vol
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
};

export default ComicBookFooter;
