import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';

import {useFeatureFlag} from 'configcat-react';

export function MockBooks({route}) {
  const {comicBookLink} = route?.params;
  const [ViewAll, setViewAll] = useState(false);
  const [PageIndex, setPageIndex] = useState(0);
  const [images, setImages] = useState([]);
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  const {width} = Dimensions.get('window');
  const numColumns = 3;
  const imageSize = width / numColumns - 10;

  useEffect(() => {
    let newImages = [];
    if (
      comicBookLink === 'https://comicbookplus.com/?dlid=16848' ||
      comicBookLink === 'https://comicbookplus.com/?dlid=15946'
    ) {
      for (let index = 0; index < 35; index++) {
        newImages.push(
          `https://box01.comicbookplus.com/viewer/4a/4af4d2facd653c6fee0013367c681f6a/${index}.jpg`,
        );
      }
    } else if (
      comicBookLink === 'https://comicbookplus.com/?dlid=16857' ||
      comicBookLink === 'https://comicbookplus.com/?cid=860'
    ) {
      for (let index = 0; index < 35; index++) {
        newImages.push(
          `https://box01.comicbookplus.com/viewer/7c/7ce6723c8f20d1ce3b78c2cda1debc50/${index}.jpg`,
        );
      }
    }

    // Only update state if newImages differs from the current images state.
    if (JSON.stringify(newImages) !== JSON.stringify(images)) {
      setImages(newImages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comicBookLink, forIosValue, forIosLoading]);

  const GridImageItem = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          setPageIndex(index);
          setViewAll(!ViewAll);
        }}
        style={{
          margin: 5,
          borderRadius: 5,
          overflow: 'hidden',
          backgroundColor: '#333',
        }}>
        <Image
          source={{uri: item}}
          style={{
            width: imageSize,
            height: imageSize,
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: '#14142a'}}
      edges={['top', 'bottom']}>
      <View style={{flex: 1}}>
        {ViewAll ? (
          <TouchableOpacity style={{flex: 1}} onPress={() => setViewAll(false)}>
            <Image
              source={{uri: images[PageIndex]}}
              style={{flex: 1}}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : (
          <FlatList
            data={images}
            renderItem={({item, index}) => (
              <GridImageItem item={item} index={index} />
            )}
            numColumns={numColumns}
            style={{
              flex: 1,
              marginVertical: 60,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
