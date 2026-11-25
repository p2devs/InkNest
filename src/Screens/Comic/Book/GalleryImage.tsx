import React, {useMemo, useState} from 'react';
import {useWindowDimensions, ActivityIndicator} from 'react-native';
import PageImage from './PageImage';
import {
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';
import { heightPercentageToDP } from 'react-native-responsive-screen';

import {fitContainer, useImageResolution} from 'react-native-zoom-toolkit';

type GalleryImageProps = {
  asset: any;
  index: number;
  sourceName: string;
  activeIndex: SharedValue<number>;
};

const GalleryImage: React.FC<GalleryImageProps> = ({
  asset,
  index,
  sourceName,
  activeIndex,
}) => {
  const {width, height} = useWindowDimensions();

  const imageSource = useMemo(() => ({uri: asset.uri || ''}), [asset.uri]);

  const {isFetching, resolution} = useImageResolution(imageSource);

  const size = resolution && resolution.width > 0 && resolution.height > 0
    ? fitContainer(resolution.width / resolution.height, {
        width,
        height: height - heightPercentageToDP('4%'),
      })
    : null;

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
    <PageImage
      uri={imageSource.uri}
      index={index}
      sourceName={sourceName}
      style={size || {width, height}}
      allowDownscaling={downScale}
    />
  );
};

export default GalleryImage;
