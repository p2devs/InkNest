import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import {updateData} from '../../Redux/Reducers';
import {goBack} from '../../Navigation/NavigationService';
import {heightPercentageToDP} from 'react-native-responsive-screen';

const ComicBookHeader = ({comicBookLink, PageIndex, ViewAll, showBookmark}) => {
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        height: heightPercentageToDP('4%'),
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderBottomColor: '#fff',
        borderBottomWidth: 0.5,
        marginBottom: 5,
      }}>
      <TouchableOpacity
        onPress={() => {
          goBack();
        }}
        style={{flexDirection: 'row', alignItems: 'center'}}>
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
        {PageIndex + 1}/
        {showBookmark
          ? ComicBook?.images?.length
          : comicBookLink?.downloadedImagesPath?.length}
      </Text>
      {ViewAll ? (
        <View />
      ) : showBookmark ? (
        <TouchableOpacity
          onPress={() => {
            let BookmarksPages = ComicBook?.BookmarkPages
              ? [...ComicBook?.BookmarkPages]
              : [];
            if (BookmarksPages.includes(PageIndex)) {
              BookmarksPages = BookmarksPages.filter(
                item => item !== PageIndex,
              );
            } else {
              BookmarksPages.push(PageIndex);
            }
            dispatch(
              updateData({
                url: comicBookLink,
                data: {BookmarkPages: BookmarksPages},
              }),
            );
          }}>
          <FontAwesome6
            name="book-bookmark"
            size={24}
            color={
              ComicBook?.BookmarkPages?.includes(PageIndex) ? 'yellow' : '#FFF'
            }
          />
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
};

export default ComicBookHeader;
