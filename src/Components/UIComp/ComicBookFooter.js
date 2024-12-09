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
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderBottomColor: '#fff',
        borderBottomWidth: 0.5,
        borderTopColor: '#fff',
        borderTopWidth: 0.5,
        marginBottom: 5,
        bottom: 0,
      }}>
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
          disabled={index == 0}>
          <Text
            style={{
              fontSize: heightPercentageToDP('1.8%'),
              fontWeight: 'bold',
              color: index == 0 ? '#555' : '#FFF',
            }}>
            Previous Volume
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={() => {
          setViewAll(!ViewAll);
        }}>
        <Ionicons
          name={ViewAll ? 'book-outline' : 'grid-outline'}
          size={24}
          color="#fff"
          style={{marginRight: 10}}
        />
      </TouchableOpacity>
      {index !== ComicBook?.volumes.length - 1 ? (
        showButton ? (
          <TouchableOpacity
            onPress={() => {
              if (index < ComicBook?.volumes.length - 1) {
                navigation.replace(NAVIGATION.comicBook, {
                  comicBookLink: ComicBook?.volumes[index + 1].link,
                });
              }
            }}>
            <Text
              style={{
                fontSize: heightPercentageToDP('1.8%'),
                fontWeight: 'bold',
                color: '#FFF',
              }}>
              Next Volume
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )
      ) : (
        <View />
      )}
    </View>
  );
};

export default ComicBookFooter;
