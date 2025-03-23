import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NAVIGATION} from '../../Constants';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

const ComicBookFooter = ({
  comicBookLink,
  setViewAll,
  ViewAll,
  navigation,
  showButton,
  scrollMode,
  setScrollMode,
}) => {
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
            analytics().logEvent('comicbook_scroll_mode', {
              scrollMode:
                scrollMode === 'horizontal' ? 'vertical' : 'horizontal',
            });
            crashlytics().log('ComicBook Scroll Mode Changed');
            crashlytics().setAttribute('scroll_mode', scrollMode);
            crashlytics().setUserId(comicBookLink);
            setScrollMode(
              scrollMode === 'horizontal' ? 'vertical' : 'horizontal',
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
