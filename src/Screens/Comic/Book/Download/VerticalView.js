import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Image,
} from 'react-native';
import {
  fitContainer,
  ResumableZoom,
  useImageResolution,
} from 'react-native-zoom-toolkit';

const ITEM_SPACING = 20;

export default function VerticalView({
  data,
  loading,
  setImageLinkIndex,
  activeIndex,
  resolutions,
}) {
  const {width, height} = useWindowDimensions();
  const [imageResolutionLoading, setImageResolutionLoading] = useState(true);
  const [imagesLinks, setImagesLinks] = useState('');
  const ref = useRef(null);
  const [zoomMode, setZoomMode] = useState(false);
  const [imageSizeAcuired, setImageSizeAcquired] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!data || data.length === 0) {
      setImagesLinks('');
      currentIndexRef.current = 0;
      return;
    }

    const maxIndex = data.length - 1;
    const safeIndex = Math.min(
      Math.max(activeIndex ?? 0, 0),
      maxIndex,
    );

    setImagesLinks(data[safeIndex]);
    currentIndexRef.current = safeIndex;
  }, [activeIndex, data]);

  useEffect(() => {
    setInitialSyncDone(false);
  }, [data]);

  // Properly prepare the image source object with headers
  const imageSource = useMemo(() => {
    if (data?.length > 0 && imagesLinks) {
      return {
        uri: imagesLinks,
      };
    }
    return {
      uri: '',
    };
  }, [imagesLinks, data]);

  // Only call useImageResolution with a valid image source
  const {isFetching, resolution} = useImageResolution(imageSource);

  // Calculate size only when resolution is available
  const size = resolution
    ? fitContainer(resolution.width / resolution.height, {
        width,
        height,
      })
    : null;

  // Set imageSizeAcuired when size is first calculated
  useEffect(() => {
    if (size && !imageSizeAcuired) {
      setImageSizeAcquired(true);
    }
  }, [size, imageSizeAcuired]);

  useEffect(() => {
    // Only update loading state when resolution is available
    if (resolution && imagesLinks) {
      setImageResolutionLoading(false);
    } else if (isFetching === false && !resolution) {
      // Handle case where fetch completed but no resolution was obtained
      setImageResolutionLoading(false);
    }
  }, [resolution, isFetching, imagesLinks, imageSource]);

  useEffect(() => {
    if (!data || data.length === 0) {
      return;
    }

    if (!imageSizeAcuired || initialSyncDone || !ref.current) {
      return;
    }

    const maxIndex = data.length - 1;
    const safeIndex = Math.min(
      Math.max(activeIndex ?? 0, 0),
      maxIndex,
    );

    if (safeIndex === 0) {
      currentIndexRef.current = 0;
      setInitialSyncDone(true);
      return;
    }

    try {
      ref.current.scrollToIndex({index: safeIndex, animated: false});
      currentIndexRef.current = safeIndex;
      setInitialSyncDone(true);
    } catch (error) {
      // Ignore out of range errors while list recalculates
    }
  }, [activeIndex, data, imageSizeAcuired, initialSyncDone]);

  // getItemLayout is used to optimize the FlatList performance
  const itemLength = useMemo(() => {
    const baseHeight = size?.height || resolutions?.height || height;
    return baseHeight + ITEM_SPACING;
  }, [height, resolutions?.height, size?.height]);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: itemLength,
      offset: itemLength * index,
      index,
    }),
    [itemLength],
  );

  const updateIndexFromOffset = useCallback(
    offset => {
      if (!Number.isFinite(offset) || !itemLength) {
        return;
      }

      const rawIndex = Math.round(offset / itemLength);
      const maxIndex = Math.max(0, (data?.length ?? 1) - 1);
      const safeIndex = Math.min(Math.max(rawIndex, 0), maxIndex);

      if (safeIndex === currentIndexRef.current) {
        return;
      }

      currentIndexRef.current = safeIndex;
      setImageLinkIndex(safeIndex);
    },
    [data?.length, itemLength, setImageLinkIndex],
  );

  const handleScrollEnd = useCallback(
    event => {
      updateIndexFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateIndexFromOffset],
  );

  if (loading || !imagesLinks) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading comic data...</Text>
      </View>
    );
  }

  if (imageResolutionLoading && isFetching !== false) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={'large'} color="#fff" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        ref={ref}
        initialNumToRender={2}
        maxToRenderPerBatch={5}
        windowSize={5}
        data={data}
        getItemLayout={getItemLayout}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({item, index}) => (
          <TouchableOpacity
            style={{
              marginBottom: ITEM_SPACING,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setImageLinkIndex(index);
              setImagesLinks(item);
              setZoomMode(true);
            }}>
            {/* Render placeholder or image based on size availability */}
            {size?.width && size?.height ? (
              <Image
                source={{uri: item}}
                style={{...size}}
                resizeMethod={'scale'}
              />
            ) : (
              // Optional: Render a placeholder with estimated height
              <View
                style={{
                  height: resolutions?.height || height,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size={'large'} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: ITEM_SPACING}}
      />
      {zoomMode && (
        <View
          style={{
            flex: 1,
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}>
          {size && (
            <ResumableZoom
              extendGestures={true}
              maxScale={6}
              pinchCenteringMode={'sync'}>
              <Image
                source={{uri: imagesLinks}}
                style={{...size}}
                resizeMethod="scale"
              />
            </ResumableZoom>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6347',
              paddingVertical: 10,
              borderRadius: 5,
              alignItems: 'center',
              marginHorizontal: 20,
              bottom: 30,
            }}
            onPress={() => {
              setZoomMode(false);
            }}>
            <Text style={styles.text}>Tap to close</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    justifyContent: 'center', // Center loading indicators
    alignItems: 'center', // Center loading indicators
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
