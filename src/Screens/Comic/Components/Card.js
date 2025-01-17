import React from 'react';
import {Text, StyleSheet, Image, TouchableOpacity} from 'react-native';

export default function Card({
  item,
  index,
  onPress,
  containerStyle,
  imageStyle,
  titleStyle,
  genresStyle,
}) {
  return (
    <TouchableOpacity
      id={index}
      style={[styles.container, containerStyle]}
      onPress={() => {
        onPress();
      }}>
      <Image
        style={[styles.image, imageStyle]}
        resizeMode="cover"
        source={{
          uri: item?.image,
        }}
      />
      <Text style={[styles.title, titleStyle]} numberOfLines={2}>
        {item?.title}
      </Text>
      <Text style={[styles.genres, genresStyle]}>
        {item?.genres ?? item?.publishDate}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 138,
    height: 263,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 12,
    marginRight: 12,
  },
  image: {
    borderRadius: 7,
    height: 178,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    marginVertical: 8,
  },
  genres: {
    opacity: 0.5,
    color: '#fff',
    fontSize: 12,
  },
});
