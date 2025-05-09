import React from 'react';
import {View, Text, TouchableOpacity, Image, Alert} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {setScrollPreference} from '../../Redux/Reducers';
import {handleScrollModeChange} from '../../Utils/ScrollModeUtils';

const ComicBookFooter = ({
  comicBookLink,
  setViewAll,
  ViewAll,
  scrollMode,
  setScrollMode,
}) => {
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
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
          alert(
            'This feature may cause the app to crash. Please use with caution.',
          );
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

      {/* Scroll Mode Toggle Button */}
      {!ViewAll && (
        <TouchableOpacity
          onPress={() => {
            // Convert string scroll mode to boolean isVertical for consistency
            const isVerticalScroll = scrollMode === 'vertical';
            handleScrollModeChange(
              isVerticalScroll,
              (newValue) => {
                // Convert back to string format that this component uses
                setScrollMode(newValue ? 'vertical' : 'horizontal');
              },
              dispatch,
              setScrollPreference,
              null,
              'ComicBookFooter',
              comicBookLink
            );
          }}
          style={{
            alignItems: 'center',
          }}>
          <MaterialIcons
            name={scrollMode === 'horizontal' ? 'swap-vert' : 'swap-horiz'}
            size={24}
            color="#fff"
          />
          <Text
            style={{
              fontSize: 12,
              color: '#fff',
              opacity: 0.5,
            }}>
            {scrollMode === 'horizontal' ? 'Vertical' : 'Horizontal'}
          </Text>
        </TouchableOpacity>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        {/* Previous volume controls commented out */}
      </View>
    </View>
  );
};

export default ComicBookFooter;
