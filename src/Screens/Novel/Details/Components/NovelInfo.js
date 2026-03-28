import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Image from '../../../../Components/UIComp/Image';
import {GenreTags} from './GenreTags';

/**
 * NovelInfo Component
 * Displays novel header information with cover, title, author, etc.
 */
export function NovelInfo({
  novel,
  onGenrePress,
  onBookmarkPress,
  isBookmarked,
  style,
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
    summary,
  } = novel;
  
  // Debug log for cover image
  console.log('[NovelInfo] coverImage:', coverImage ? coverImage.substring(0, 80) + '...' : null);

  // Check if summary is long enough to need truncation (more than ~150 chars or 3 lines)
  const shouldTruncate = summary && summary.length > 150;
  const displaySummary = !shouldTruncate || descriptionExpanded 
    ? summary 
    : summary.slice(0, 150) + '...';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Image
          source={{uri: coverImage}}
          style={styles.cover}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={3}>
            {title}
          </Text>
          {author && (
            <Text style={styles.author}>by {author}</Text>
          )}
          <View style={styles.stats}>
            {rating && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.statText}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {chapters && (
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>{chapters} Ch</Text>
              </View>
            )}
            {views && (
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.statText}>{views}</Text>
              </View>
            )}
          </View>
          {status && (
            <View style={[
              styles.statusBadge,
              status === 'Completed' && styles.completedBadge,
            ]}>
              <Text style={[
                styles.statusText,
                status === 'Completed' && styles.completedText,
              ]}>
                {status}
              </Text>
            </View>
          )}
        </View>
      </View>

      {genres && genres.length > 0 && (
        <GenreTags
          genres={genres}
          onGenrePress={onGenrePress}
          style={styles.genres}
        />
      )}

      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Synopsis</Text>
          <Text style={styles.summary} numberOfLines={descriptionExpanded ? undefined : 3}>
            {displaySummary}
          </Text>
          {shouldTruncate && (
            <TouchableOpacity 
              style={styles.readMoreButton}
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              activeOpacity={0.7}>
              <Text style={styles.readMoreText}>
                {descriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
              <Ionicons 
                name={descriptionExpanded ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#667EEA" 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {onBookmarkPress && (
        <TouchableOpacity
          style={[
            styles.bookmarkButton,
            isBookmarked && styles.bookmarkedButton,
          ]}
          onPress={onBookmarkPress}
          activeOpacity={0.7}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isBookmarked ? '#fff' : '#667EEA'}
          />
          <Text style={[
            styles.bookmarkText,
            isBookmarked && styles.bookmarkedText,
          ]}>
            {isBookmarked ? 'Bookmarked' : 'Add to Library'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * NovelInfoCompact Component
 * Compact version for headers
 */
export function NovelInfoCompact({novel, style}) {
  if (!novel) return null;

  const {title, author, coverImage, rating, chapters} = novel;

  return (
    <View style={[styles.compactContainer, style]}>
      <Image
        source={{uri: coverImage}}
        style={styles.compactCover}
        resizeMode="cover"
      />
      <View style={styles.compactInfo}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {title}
        </Text>
        {author && (
          <Text style={styles.compactAuthor} numberOfLines={1}>
            {author}
          </Text>
        )}
        <View style={styles.compactStats}>
          {rating && (
            <View style={styles.statItem}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.compactStatText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {chapters && (
            <Text style={styles.compactChapters}>{chapters} Chapters</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
  },
  cover: {
    width: 120,
    height: 170,
    borderRadius: 12,
    backgroundColor: '#2a2a4a',
  },
  info: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  author: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  completedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  completedText: {
    color: '#4CAF50',
  },
  genres: {
    marginTop: 16,
  },
  summaryContainer: {
    marginTop: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 22,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  readMoreText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '500',
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  bookmarkedButton: {
    backgroundColor: '#667EEA',
  },
  bookmarkText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '600',
  },
  bookmarkedText: {
    color: '#fff',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCover: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#2a2a4a',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  compactAuthor: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  compactStatText: {
    color: '#FFD700',
    fontSize: 11,
  },
  compactChapters: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
});

export default NovelInfo;