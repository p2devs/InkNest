import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { navigate } from '../../Navigation/NavigationService';
import { NAVIGATION } from '../../Constants';
import Image from './Image';
import { BlurView } from '@react-native-community/blur';
import { useSelector } from 'react-redux';

const HomeRenderItem = ({ item, index, Showhistory, search = false }) => {
  let Tag = Platform.OS === 'ios' ? BlurView : View;
  const [showItem, setShowItem] = useState(true);
  const isAnime = useSelector(state => state?.data?.Anime);
  // console.log('isAnime', isAnime);
  if (!showItem) return null;
  return (
    <View
      key={index}
      style={{
        flex: 1,
        alignItems: 'center',
      }}>
      <TouchableOpacity
        style={{
          marginVertical: 5,
          marginHorizontal: 5,
          width: 180,
          height: 180,
          borderRadius: 10,
          flexWrap: 'wrap',
        }}
        onPress={async () => {
          if (isAnime) {
            const navigationTarget = search
              ? NAVIGATION.animeDetails
              : NAVIGATION.animeVideo;
            navigate(navigationTarget, {
              link: item.link,
              title: item.title,
              imageUrl: item.imageUrl,
            });
            return;
          }
          navigate(NAVIGATION.comicDetails, {
            link: item.link,
            home: !Showhistory,
            search: Showhistory,
            PageUrl: item.link,
          });
        }}>
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 180,
            height: 180,
          }}
          onFailer={() => {
            // console.log('Image Load Failed', item.imageUrl);
            setShowItem(false);
          }}
        />
        <Tag
          intensity={10}
          tint="light"
          style={[
            {
              padding: 10,
              justifyContent: 'space-between',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              minHeight: '20%',
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
          ]}>
          <Text
            style={{ color: 'white', fontWeight: '700', fontSize: 14 }}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={{ color: 'white', width: '80%' }} numberOfLines={1}>
            {item?.episode
              ? item?.episode
              : item?.genres
                ? item?.genres.join(',')
                : item.date}
          </Text>
          {/* {
            //create a progress bar
            !item?.Progress ? null : (
              <View
                style={{
                  height: 5,
                  width: '100%',
                  backgroundColor: 'black',
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginTop: 5,
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${item.Progress}%`,
                    backgroundColor: 'gray',
                  }}
                />
              </View>
            )
          } */}
        </Tag>
      </TouchableOpacity>
    </View>
  );
};

export default HomeRenderItem;
