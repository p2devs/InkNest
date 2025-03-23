import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  FlatList,
  StyleSheet, 
  Dimensions,
  TouchableWithoutFeedback,
  Text
} from 'react-native';
import CustomImage from '../../Components/UIComp/Image';

const { width, height } = Dimensions.get('window');

const VerticalGallery = ({ 
  data, 
  initialIndex = 0, 
  onPageChange,
  onSingleTap
}) => {
  const [currentPage, setCurrentPage] = useState(initialIndex);
  const flatListRef = useRef(null);
  
  // Scroll to initial index on mount
  React.useEffect(() => {
    if (flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [initialIndex]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentPage) {
        setCurrentPage(newIndex);
        if (onPageChange) {
          onPageChange(newIndex);
        }
      }
    }
  }, [currentPage, onPageChange]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged }
  ]);

  const renderItem = ({ item, index }) => {
    // Add error handling for item format
    if (!item) {
      return (
        <View style={styles.pageContainer}>
          <Text style={{color: '#fff'}}>Image not available</Text>
        </View>
      );
    }
    
    return (
      <TouchableWithoutFeedback
        onPress={onSingleTap}
        key={index}
      >
        <View style={styles.pageContainer}>
          <CustomImage
            source={{ uri: item }}
            style={styles.image}
            resizeMode="contain"
            // Enable downsampling to reduce memory usage
            downsample={true}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const getItemLayout = (_, index) => ({
    length: height,
    offset: height * index,
    index,
  });

  // Memory cleanup for images that are no longer visible
  const keyExtractor = useCallback((_, index) => `page-${index}`, []);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      getItemLayout={getItemLayout}
      initialNumToRender={2} // Reduced from 3 to 2
      maxToRenderPerBatch={2} // Reduced to save memory
      windowSize={3} // Reduced from 5 to 3
      removeClippedSubviews={true} // Important for memory management
      updateCellsBatchingPeriod={100} // Delay updates to improve performance
      style={styles.container}
      onScrollToIndexFailed={info => {
        const wait = new Promise(resolve => setTimeout(resolve, 100));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({ 
            index: info.index, 
            animated: false 
          });
        });
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#14142a', // Match app background color
  },
  image: {
    width: '100%',
    height: '100%',
  }
});

export default VerticalGallery;