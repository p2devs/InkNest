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
  const cleanUrl = (source.uri || '').replace(/[\r\n]/g, '').trim();
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
          url: cleanUrl,
          progressiveLoadingEnabled: true,
          allowHardware: true,
          headers: {Referer: cleanUrl},
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
