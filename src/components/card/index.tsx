import React from 'react';
import {
  Text,
  StyleSheet,
  Image,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ComicItem } from '../../types/comic';
import { useHaptic } from '../../zustand';

interface ComicCardProps {
  item: ComicItem;
  onPress: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  titleStyle?: TextStyle;
  genresStyle?: TextStyle;
}

export const Card: React.FC<ComicCardProps> = ({
  item,
  onPress,
  containerStyle,
  imageStyle,
  titleStyle,
  genresStyle,
}) => {
  const { cardPress } = useHaptic();
  
  const handlePress = () => {
    // Trigger contextual haptic feedback based on user preferences
    cardPress();
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        containerStyle,
        // Custom press animation - scale down slightly when pressed
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      // Additional Pressable props for better UX
      android_ripple={{
        color: 'rgba(255, 255, 255, 0.1)',
        borderless: false,
        radius: 12,
      }}
      // Hit area expansion for better touch targets
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      // Accessibility
      accessibilityRole="button"
      accessibilityLabel={`Comic: ${item.title}`}
      accessibilityHint="Tap to view comic details"
    >
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
    </Pressable>
  );
};

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
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
});
