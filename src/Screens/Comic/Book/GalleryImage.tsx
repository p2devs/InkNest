import React, {useMemo, useState} from 'react';
import {useWindowDimensions, Image, ActivityIndicator} from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';

import {fitContainer, useImageResolution} from 'react-native-zoom-toolkit';

type GalleryImageProps = {
  asset: any;
  index: number;
  activeIndex: SharedValue<number>;
};

const GalleryImage: React.FC<GalleryImageProps> = ({
  asset,
  index,
  activeIndex,
}) => {
  const {width, height} = useWindowDimensions();

  // Properly prepare the image source object with headers
  const imageSource = useMemo(() => {
    if (asset.uri) {
      return {
        uri: asset.uri,
      };
    }
    return {
      uri: '',
    };
  }, [asset.uri]);

  const {isFetching, resolution} = useImageResolution(imageSource);

  const size = resolution
    ? fitContainer(resolution.width / resolution.height, {
        width,
        height,
      })
    : null;

  console.log('GalleryImage', asset.uri, size);

  const [downScale, setDownScale] = useState<boolean>(true);

  const wrapper = (active: number) => {
    if (index === active) setDownScale(false);
    if (index === active - 1 && !downScale) setDownScale(true);
    if (index === active + 1 && !downScale) setDownScale(true);
  };

  useAnimatedReaction(
    () => activeIndex.value,
    value => runOnJS(wrapper)(value),
    [activeIndex],
  );

  if (isFetching) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <Image
      source={{uri: asset.uri}}
      style={size}
      allowDownscaling={downScale}
    />
  );
};

export default GalleryImage;
