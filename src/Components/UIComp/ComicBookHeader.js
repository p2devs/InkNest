import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

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
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        marginBottom: 5,
      }}>
      <TouchableOpacity
        onPress={() => {
          goBack();
        }}
        style={{flexDirection: 'row', alignItems: 'center'}}>
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
          textAlign: 'center',
          color: '#fff',
          opacity: 0.9,
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
          <Feather
            name="bookmark"
            size={24}
            color={
              ComicBook?.BookmarkPages?.includes(PageIndex) ? 'yellow' : '#FFF'
            }
            style={{opacity: 0.9}}
          />
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
};

export default ComicBookHeader;
