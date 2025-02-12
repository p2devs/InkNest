import React, {useEffect, useRef, useState} from 'react';
import {Text, StyleSheet, Animated, TouchableOpacity} from 'react-native';

const DescriptionView = ({vol, index}) => {
  const [readMore, setReadMore] = useState(false);
  const animation = useRef(new Animated.Value(60)).current;

  const calculateHeight = text => {
    const words = text.split(/\s+/).length;
    const wordsPerLine = 8; // Approximate number of words per line
    const lineHeight = 18; // Approximate height per line
    const numberOfLines = Math.ceil(words / wordsPerLine);
    return numberOfLines * lineHeight;
  };

  useEffect(() => {
    const targetHeight = readMore ? calculateHeight(vol) : 60;
    Animated.timing(animation, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [readMore]);

  return (
    <React.Fragment key={index}>
      <Animated.View style={{height: animation}}>
        <Text style={styles.description}>{vol}</Text>
      </Animated.View>

      <TouchableOpacity
        onPress={() => {
          setReadMore(!readMore);
        }}
        style={{
          alignSelf: 'flex-start',
        }}>
        <Text
          style={{
            fontSize: 12,
            color: '#3268de',
          }}>
          {readMore ? 'Show Less' : 'Show More'}
        </Text>
      </TouchableOpacity>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  description: {
    fontSize: 12,
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default DescriptionView;
