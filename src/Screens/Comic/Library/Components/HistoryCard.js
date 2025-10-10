import React, {useEffect, useState} from 'react';
import {TouchableOpacity, Image, View, Text} from 'react-native';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {useSelector} from 'react-redux';

import {navigate} from '../../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../../Constants';

const HistoryCard = ({item, index}) => {
  const ComicDetail = useSelector(state => state.data.dataByUrl[item.link]);
  const [progress, setProgress] = useState(0);
  const calculateProgress = () => {
    const totalChapters = (ComicDetail?.issues ?? ComicDetail?.chapters)
      ?.length;
    const ReadChapter = item?.readComics
      ? Object?.keys(item?.readComics)?.length
      : 0;
    setProgress((ReadChapter / totalChapters) * 100);
  };

  useEffect(() => {
    calculateProgress();
  }, [ComicDetail]);

  if (!item?.title || !item?.link || !ComicDetail) return null;

  return (
    <TouchableOpacity
      key={index}
      style={{
        height: 144,
        width: 264,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: 12,
        marginRight: 12,
        paddingHorizontal: 8,
        paddingVertical: 8,
        flexDirection: 'row',
        gap: 12,
      }}
      onPress={() => {
        crashlytics().log('History Card Comic Details button clicked');
        analytics().logEvent('history_card_comic_details_button', {
          link: item?.link?.toString(),
          title: item?.title?.toString(),
        });
        navigate(NAVIGATION.comicDetails, item);
      }}>
      <Image
        style={{
          borderRadius: 7,
          height: 128,
          width: 88,
        }}
        resizeMode="cover"
        source={{
          uri: item?.image,
        }}
      />
      <View
        style={{
          width: 145,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: '#fff',
            marginVertical: 8,
          }}
          numberOfLines={2}>
          {item?.title}
        </Text>
        <Text
          style={{
            opacity: 0.5,
            color: '#fff',
            fontSize: 12,
          }}
          numberOfLines={1}>
          {item?.genres}
        </Text>

        <View
          style={{
            marginVertical: 4,
          }}
        />

        <Progress progress={progress} height={10} innerheight={6} />

        <View
          style={{
            marginVertical: 4,
          }}
        />

        <Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: '#f56b00',
          }}>
          Continue Reading
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default HistoryCard;
function Progress({progress, height, innerheight}) {
  const [width, setWidth] = useState(0);

  return (
    <>
      <Text
        style={{
          fontSize: 8,
          color: '#fff',
          opacity: 0.5,
        }}>
        {progress.toFixed(2)}% Completed
      </Text>
      <View
        style={{
          overflow: 'hidden',
          borderRadius: height,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          height: height,
          paddingHorizontal: 2,
          paddingVertical: 2,
          marginVertical: 4,
        }}
        onLayout={e => {
          if (width !== 0) {
            return;
          }
          setWidth(e.nativeEvent.layout.width);
        }}>
        <View
          style={{
            backgroundColor: '#3268de',
            height: innerheight,
            borderRadius: innerheight,
            top: 0,
            left: 0,
            width: `${progress}%`,
          }}
        />
      </View>
    </>
  );
}
