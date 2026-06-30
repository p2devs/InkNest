import React, {useEffect, useRef, useState} from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const DescriptionView = ({vol, index}) => {
  const [readMore, setReadMore] = useState(false);
  const animation = useRef(new Animated.Value(60)).current;
  const [contentHeight, setContentHeight] = useState(60);
  const [hasOverflow, setHasOverflow] = useState(false);

  const calculateHeight = text => {
    const words = text?.split(/\s+/)?.length || 0;
    const wordsPerLine = 10; // Approximate number of words per line
    const lineHeight = 20; // Approximate height per line
    const numberOfLines = Math.ceil(words / wordsPerLine);
    return Math.max(numberOfLines * lineHeight, 60);
  };

  useEffect(() => {
    const calculatedHeight = calculateHeight(vol);
    setContentHeight(calculatedHeight);
    setHasOverflow(calculatedHeight > 80);
    
    const targetHeight = readMore ? calculatedHeight : 60;
    Animated.timing(animation, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [readMore, vol]);

  return (
    <View key={index} style={styles.container}>
      <View style={styles.descriptionWrapper}>
        <Animated.View style={{height: animation, overflow: 'hidden'}}>
          <Text style={styles.description}>{vol}</Text>
        </Animated.View>
        
        {/* Fade gradient overlay when collapsed */}
        {!readMore && hasOverflow && (
          <View style={styles.fadeOverlay} />
        )}
      </View>

      {hasOverflow && (
        <TouchableOpacity
          onPress={() => {
            setReadMore(!readMore);
          }}
          style={styles.showMoreButton}
          activeOpacity={0.7}>
          <Text style={styles.showMoreText}>
            {readMore ? 'Show Less' : 'Show More'}
          </Text>
          <Ionicons
            name={readMore ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#3268de"
            style={styles.showMoreIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  descriptionWrapper: {
    position: 'relative',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'transparent',
    // Using a gradient-like effect with multiple transparent layers
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 20, 42, 0.3)',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  showMoreText: {
    fontSize: 12,
    color: '#3268de',
    fontWeight: '600',
  },
  showMoreIcon: {
    marginLeft: 2,
  },
});

export default DescriptionView;
