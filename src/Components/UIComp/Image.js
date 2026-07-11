import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image as Img,
  Platform,
  Text,
  View,
} from 'react-native';
import {FasterImageView} from '@candlefinance/faster-image';

import {getClearanceHeaders} from '../../Utils/cloudflareClearance';

const Image = ({
  source,
  style,
  onFailer,
  resizeMode = null,
  onSuccess = null,
  ...rest
}) => {
  const cleanUrl = (source.uri || '').replace(/[\r\n]/g, '').trim();
  // Attach Cloudflare clearance (User-Agent [+ cf_clearance] on protected hosts)
  // so challenged image URLs (e.g. readcomicsonline main domain) load.
  const clearanceHeaders = getClearanceHeaders(cleanUrl);
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
          headers: {
            Referer: cleanUrl,
            ...(clearanceHeaders || {}),
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
