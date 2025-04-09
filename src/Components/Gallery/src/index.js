import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Image from '../../../Components/UIComp/Image';

const Gallery = ({
  data,
  initialIndex = 0,
  onIndexChange,
  isVartical,
  onImagePress,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef(null);
  const {width, height} = Dimensions.get('screen');
  const itemSize = isVartical ? height : width;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onIndexChange?.(index);
      }
    }
  }).current;

  const getItemLayout = useCallback(
    (_, index) => ({
      length: itemSize,
      offset: itemSize * index,
      index,
    }),
    [itemSize],
  );

  const handleScrollToIndexFailed = info => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: false,
      });
    }, 500);
  };

  useEffect(() => {
    if (flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [initialIndex]);

  const renderItem = ({item}) => (
    <TouchableWithoutFeedback onPress={onImagePress}>
      <View style={{width, height}}>
        <Image source={{uri: item}} style={{width, height}} />
      </View>
    </TouchableWithoutFeedback>
  );

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No images available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, index) => `gallery-image-${index}`}
        horizontal={!isVartical}
        pagingEnabled={!isVartical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
};

export default Gallery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Helps with performance
  },
});
