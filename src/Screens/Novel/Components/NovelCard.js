import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Image from '../../../Components/UIComp/Image';

const {width} = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;

/**
 * NovelCard Component
 * Displays a novel with cover, title, author, rating, and chapter count
 */
export function NovelCard({novel, onPress, style}) {
  if (!novel) return null;

  const {
    title,
    author,
    coverImage,
    rating,
    chapters,
    status,
  } = novel;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress?.(novel)}
      activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image
          source={{uri: coverImage}}
          style={styles.coverImage}
          resizeMode="cover"
        />
        {status === 'Completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {author && (
          <Text style={styles.author} numberOfLines={1}>
            {author}
          </Text>
        )}
        <View style={styles.metaContainer}>
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {chapters && (
            <Text style={styles.chapters}>{chapters} Ch</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * NovelCardHorizontal Component
 * Displays a novel in horizontal layout with more details
 */
export function NovelCardHorizontal({novel, onPress, style}) {
  if (!novel) return null;

  const {
    title,
    author,
    coverImage,
    rating,
    chapters,
    status,
    views,
    genres,
  } = novel;

  return (
    <TouchableOpacity
      style={[styles.horizontalContainer, style]}
      onPress={() => onPress?.(novel)}
      activeOpacity={0.7}>
      <Image
        source={{uri: coverImage}}
        style={styles.horizontalCover}
        resizeMode="cover"
      />
      <View style={styles.horizontalInfo}>
        <Text style={styles.horizontalTitle} numberOfLines={2}>
          {title}
        </Text>
        {author && (
          <Text style={styles.horizontalAuthor} numberOfLines={1}>
            {author}
          </Text>
        )}
        <View style={styles.horizontalMeta}>
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {chapters && (
            <Text style={styles.horizontalChapters}>{chapters} Chapters</Text>
          )}
        </View>
        {genres && genres.length > 0 && (
          <View style={styles.genreContainer}>
            {genres.slice(0, 3).map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}
        {status && (
          <Text style={[
            styles.statusText,
            status === 'Completed' && styles.completedStatus,
          ]}>
            {status}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * NovelCardSmall Component
 * Compact card for lists
 */
export function NovelCardSmall({novel, onPress, style}) {
  if (!novel) return null;

  const {title, coverImage, rating, chapters} = novel;

  return (
    <TouchableOpacity
      style={[styles.smallContainer, style]}
      onPress={() => onPress?.(novel)}
      activeOpacity={0.7}>
      <Image
        source={{uri: coverImage}}
        style={styles.smallCover}
        resizeMode="cover"
      />
      <View style={styles.smallInfo}>
        <Text style={styles.smallTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.smallMeta}>
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.smallRating}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {chapters && (
            <Text style={styles.smallChapters}>{chapters} Ch</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Standard Card Styles
  container: {
    width: CARD_WIDTH,
    marginBottom: 12,
    backgroundColor: '#1E1E38',
    borderRadius: 12,
    padding: 8,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: CARD_WIDTH * 1.4,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 8,
    paddingHorizontal: 2,
  },
  title: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  author: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '500',
  },
  chapters: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },

  // Horizontal Card Styles
  horizontalContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E38',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  horizontalCover: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  horizontalAuthor: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  horizontalChapters: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  genreTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreText: {
    color: '#667EEA',
    fontSize: 9,
  },
  statusText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
  },
  completedStatus: {
    color: '#4CAF50',
  },

  // Small Card Styles
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E38',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  smallCover: {
    width: 50,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#2a2a4a',
  },
  smallInfo: {
    flex: 1,
    marginLeft: 10,
  },
  smallTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  smallMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  smallRating: {
    color: '#FFD700',
    fontSize: 10,
  },
  smallChapters: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
});

export default NovelCard;