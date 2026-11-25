import React, {useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';

import {getIosSamplePages} from '../../../Utils/iosComicSamples';
import PageImage from './PageImage';

export function MockBooks({route}) {
  const {comicBookLink, pageJump = 0} = route.params;
  const images = useMemo(
    () => getIosSamplePages(comicBookLink),
    [comicBookLink],
  );
  const [viewAll, setViewAll] = useState(pageJump > 0 && images.length > 0);
  const [PageIndex, setPageIndex] = useState(
    Math.max(0, Math.min(pageJump, images.length - 1)),
  );

  const {width} = Dimensions.get('window');
  const numColumns = 3;
  const imageSize = width / numColumns - 10;

  const GridImageItem = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        accessibilityRole="button"
        accessibilityLabel={`Page ${index + 1}`}
        onPress={() => {
          setPageIndex(index);
          setViewAll(!viewAll);
        }}
        style={{
          margin: 5,
          borderRadius: 5,
          overflow: 'hidden',
          backgroundColor: '#333',
        }}
      >
        <PageImage
          thumbnail
          uri={item}
          index={index}
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
      edges={['top', 'bottom']}
    >
      <View style={{flex: 1}}>
        {viewAll ? (
          <TouchableOpacity style={{flex: 1}} onPress={() => setViewAll(false)}>
            <PageImage
              uri={images[PageIndex]}
              index={PageIndex}
              sourceName="Comic Book Plus"
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
