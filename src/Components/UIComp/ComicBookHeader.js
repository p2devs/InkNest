import React, {memo, useEffect, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';

import {updateData} from '../../Redux/Reducers';
import {goBack} from '../../Navigation/NavigationService';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import AdBanner from '../../InkNest-Externals/Ads/BannerAds';
import {BannerAdSize} from 'react-native-google-mobile-ads';
import {showRewardedAd} from '../../InkNest-Externals/Redux/Actions/Download';

const ComicBookHeader = ({comicBookLink, PageIndex, ViewAll, showBookmark}) => {
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBookLink]);
  const [isAdSeen, setIsAdSeen] = useState(false);

  useEffect(() => {
    if (!isAdSeen) {
      if (PageIndex === Math.floor(ComicBook?.images?.length / 2)) {
        showRewardedAd();
        setIsAdSeen(true);
      }
    }
  }, [PageIndex]);

  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        flexDirection: 'column',
      }}>
      <AdBanner size={BannerAdSize.BANNER} />
      <View
        style={{
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
            <Fontisto
              name={`bookmark${
                ComicBook?.BookmarkPages?.includes(PageIndex) ? '-alt' : ''
              }`}
              size={heightPercentageToDP('2.4%')}
              color={
                ComicBook?.BookmarkPages?.includes(PageIndex)
                  ? 'yellow'
                  : '#FFF'
              }
            />
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>
      <Text style={{color: '#fff', fontSize: 12, opacity: 0.9, padding: 10}}>
        Images may take time to load due to high quality.
      </Text>
    </View>
  );
};

export default memo(ComicBookHeader);
