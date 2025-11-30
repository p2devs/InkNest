import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {navigate} from '../../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../../Constants';

/**
 * ChapterImagePreview Component
 * Shows image preview for tagged chapters that user has read
 * Only displays if chapter exists in user's reading history
 */

const ChapterImagePreview = ({
  chapterLink,
  chapterName,
  comicLink,
  selectedImages,
  onPressImage,
}) => {
  const history = useSelector(state => state.data.history);
  const chapterData = useSelector(state =>
    chapterLink ? state.data.dataByUrl[chapterLink] : null,
  );
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(
    Dimensions.get('window').width - 48,
  );

  useEffect(() => {
    if (selectedImages?.length) {
      setImages(selectedImages);
      setHasAccess(true);
      setLoading(false);
      return;
    }

    checkAccessAndLoadImages();
  }, [chapterLink, comicLink, selectedImages, chapterData, history]);

  const checkAccessAndLoadImages = () => {
    const chapterImages = chapterDataFromStore();

    if (chapterImages.length > 0) {
      setImages(chapterImages.slice(0, 6));
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Fallback: only show if user has read this chapter (legacy behaviour)
    const comicHistory = history[comicLink];
    const readComics = comicHistory?.readComics || {};
    const hasHistoryEntry = readComics[chapterLink];

    if (!hasHistoryEntry) {
      setHasAccess(false);
      setImages([]);
      setLoading(false);
      return;
    }

    setHasAccess(true);
    setLoading(false);
  };

  const chapterDataFromStore = () => {
    if (selectedImages?.length) {
      return selectedImages;
    }
    const imagesFromStore = chapterData?.images || [];
    return imagesFromStore;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3268de" />
      </View>
    );
  }

  if (!hasAccess || images.length === 0) {
    return null;
  }

  const handleImagePress = (item, index) => {
    if (typeof onPressImage !== 'function') {
      return;
    }
    const resolvedIndex = typeof item?.index === 'number' ? item.index : index;
    const resolvedUri = item?.uri || item;

    onPressImage({
      chapterLink,
      chapterName,
      imageIndex: resolvedIndex,
      imageUri: resolvedUri,
    });
  };

  const handleLayout = event => {
    const width = event?.nativeEvent?.layout?.width;
    if (width && Math.abs(width - carouselWidth) > 2) {
      setCarouselWidth(width);
    }
  };

  const renderCarouselItem = ({item, index}) => (
    <TouchableOpacity
      style={[styles.carouselImageWrapper, {width: carouselWidth}]}
      activeOpacity={0.85}
      onPress={() => handleImagePress(item, index)}>
      <Image
        source={{uri: item.uri || item}}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      <View style={styles.carouselBadge}>
        <Text style={styles.carouselBadgeText}>{index + 1}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSingleImage = (item, index = 0) => (
    <TouchableOpacity
      style={styles.singleImageWrapper}
      activeOpacity={0.9}
      onPress={() => handleImagePress(item, index)}>
      <Image
        source={{uri: item.uri || item}}
        style={styles.singleImage}
        resizeMode="cover"
      />
      <View style={styles.singleBadge}>
        <Text style={styles.singleBadgeText}>#{index + 1}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleMomentumEnd = event => {
    const offsetX = event?.nativeEvent?.contentOffset?.x || 0;
    if (!carouselWidth) {
      return;
    }
    const nextIndex = Math.round(offsetX / carouselWidth);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Text
        style={[styles.titleText, {color: '#9ec6ff'}]}
        onPress={() =>
          navigate(NAVIGATION.comicBook, {
            comicBookLink: chapterLink,
            isDownloadComic: false,
          })
        }>
        {chapterName}
      </Text>
      {images.length === 1 ? (
        renderSingleImage(images[0])
      ) : (
        <>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            keyExtractor={(item, index) => `${chapterLink}_${index}`}
            renderItem={renderCarouselItem}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
          />
          <View style={styles.indicators}>
            {images.map((_, index) => (
              <View
                // eslint-disable-next-line react/no-array-index-key
                key={`indicator_${index}`}
                style={[
                  styles.indicatorDot,
                  index === activeIndex && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    gap: 10,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  carouselImageWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#1d1d32',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  carouselBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  indicatorDotActive: {
    backgroundColor: '#9ec6ff',
    width: 18,
  },
  singleImageWrapper: {
    height: 250,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1d1d32',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  singleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  singleBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ChapterImagePreview;
