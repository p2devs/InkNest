import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image as Img,
  Platform,
  Text,
  View,
} from 'react-native';
import {FasterImageView} from '@candlefinance/faster-image';

const Image = ({
  source,
  style,
  onFailer,
  resizeMode = null,
  onSuccess = null,
  ...rest
}) => {
  return (
    <View style={[style]}>
      <FasterImageView
        {...rest}
        style={style}
        source={{
          activityColor: 'gold',
          transitionDuration: 0.3,
          resizeMode: resizeMode ?? 'fill',
          cachePolicy: 'discWithCacheControl',
          showActivityIndicator: true,
          url: source.uri,
          progressiveLoadingEnabled: true,
          allowHardware: true,
          headers: {
            Referer: source.uri,
          },
        }}
        onSuccess={event => {
          if (onSuccess) onSuccess(event);
        }}
        onError={event => {
          if (onFailer) {
            onFailer(event);
          }
        }}
      />
    </View>
  );
};

export default Image;
