import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Image,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  fitContainer,
  ResumableZoom,
  useImageResolution,
} from 'react-native-zoom-toolkit';

export default function VerticalView({
  data,
  loading,
  setImageLinkIndex,
  activeIndex,
}) {
  const {width, height} = useWindowDimensions();
  const [imageResolutionLoading, setImageResolutionLoading] = useState(true);
  const [imagesLinks, setImagesLinks] = useState('');
  const ref = useRef(null);
  const [zoomMode, setZoomMode] = useState(false);

  // Update imagesLinks when comicBook changes
  useEffect(() => {
    if (data && data?.length > 0) {
      setImagesLinks(data[0]);
    }
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
    if (activeIndex > 0 && data?.length > 0 && size?.width && size?.height) {
      ref?.current?.scrollToIndex({index: activeIndex, animated: true});
    }
  }, [activeIndex, data, ref, size]);

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
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({item, index}) => (
          <TouchableOpacity
            style={{
              marginBottom: 5,
            }}
            onPress={() => {
              setImageLinkIndex(index);
              setImagesLinks(item);
              setZoomMode(true);
            }}>
            {size?.width && size?.height ? (
              <Image
                source={{uri: item}}
                style={{...size}}
                resizeMethod={'scale'}
              />
            ) : (
              <ActivityIndicator size={'large'} color="#fff" />
            )}
          </TouchableOpacity>
        )}
        onScroll={event => {
          const index = Math.floor(
            event.nativeEvent.contentOffset.y / size.height,
          );
          setImageLinkIndex(index);
        }}
        showsVerticalScrollIndicator={false}
      />
      <Modal
        visible={zoomMode}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setZoomMode(false)}>
        <SafeAreaView style={{flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)'}}>
          <ResumableZoom
            ref={ref}
            extendGestures={true}
            maxScale={resolution}
            pinchCenteringMode={'sync'}>
            <Image
              source={{uri: imagesLinks}}
              style={{...size}}
              resizeMethod="scale"
            />
          </ResumableZoom>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6347',
              paddingVertical: 10,
              borderRadius: 5,
              alignItems: 'center',
              marginHorizontal: 20,
              marginVertical: 10,
            }}
            onPress={() => setZoomMode(false)}>
            <Text style={styles.text}>Tap to close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
