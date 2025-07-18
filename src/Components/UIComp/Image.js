import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image as RNImage,
  Platform,
  Text,
  View,
} from 'react-native';
import {isMacOS} from '../../Utils/PlatformUtils';

let FasterImageView;
try {
  if (!isMacOS) {
    FasterImageView = require('@candlefinance/faster-image').FasterImageView;
  }
} catch (error) {
  console.log('@candlefinance/faster-image not available on this platform');
}

const Image = ({
  source,
  style,
  onFailer,
  resizeMode = null,
  onSuccess = null,
  ...rest
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Use regular Image on macOS or when FasterImageView is not available
  if (isMacOS || !FasterImageView) {
    return (
      <View style={[style]}>
        {loading && (
          <View style={[style, {position: 'absolute', justifyContent: 'center', alignItems: 'center'}]}>
            <ActivityIndicator color="gold" />
          </View>
        )}
        <RNImage
          {...rest}
          style={style}
          source={source}
          resizeMode={resizeMode || 'cover'}
          onLoad={() => {
            setLoading(false);
            if (onSuccess) onSuccess();
          }}
          onError={(event) => {
            setLoading(false);
            setError(true);
            if (onFailer) onFailer(event);
          }}
        />
        {error && (
          <View style={[style, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0'}]}>
            <Text>Failed to load image</Text>
          </View>
        )}
      </View>
    );
  }

  // Use FasterImageView on iOS and Android
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
