import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Image as Img,
  Platform,
  Text,
  View,
  Dimensions,
} from 'react-native';
import {FasterImageView} from '@candlefinance/faster-image';

const Image = ({
  source,
  style,
  onFailer,
  resizeMode = null,
  onSuccess = null,
  downsample = true, // Enable downsampling by default
  ...rest
}) => {
  const [imageError, setImageError] = useState(false);
  const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
  
  // Calculate optimal resize dimensions based on screen size and style
  const getOptimalDimensions = () => {
    // If style has specific dimensions, use those as a base
    let targetWidth = style?.width || screenWidth;
    let targetHeight = style?.height || screenHeight;
    
    // Convert percentage values to actual dimensions
    if (typeof targetWidth === 'string' && targetWidth.endsWith('%')) {
      const percentage = parseFloat(targetWidth) / 100;
      targetWidth = screenWidth * percentage;
    }
    if (typeof targetHeight === 'string' && targetHeight.endsWith('%')) {
      const percentage = parseFloat(targetHeight) / 100;
      targetHeight = screenHeight * percentage;
    }
    
    // For flex layouts, use screen dimensions
    if (targetWidth === undefined || targetHeight === undefined) {
      targetWidth = screenWidth;
      targetHeight = screenHeight;
    }
    
    // Calculate a reasonable downsampling value to save memory
    // The 2 multiplier accounts for high-density screens
    return {
      width: Math.round(targetWidth * 2),
      height: Math.round(targetHeight * 2),
    };
  };
  
  const dimensions = getOptimalDimensions();
  
  // Clean up error state when source changes
  useEffect(() => {
    setImageError(false);
  }, [source]);
  
  // If image loading fails
  const handleError = (event) => {
    setImageError(true);
    if (onFailer) {
      onFailer(event);
    }
  };
  
  // Handle successful image load
  const handleSuccess = (event) => {
    if (onSuccess) {
      onSuccess(event);
    }
  };
  
  // If there's an error, show a fallback
  if (imageError) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#999' }}>Image Error</Text>
      </View>
    );
  }
  
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
          // Add downsampling configuration if enabled
          ...(downsample ? {
            downsampling: {
              width: dimensions.width,
              height: dimensions.height,
            }
          } : {}),
        }}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </View>
  );
};

export default Image;
