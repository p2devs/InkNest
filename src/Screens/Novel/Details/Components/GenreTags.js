import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

/**
 * GenreTags Component
 * Displays genre tags for a novel
 */
export function GenreTags({genres, onGenrePress, style, maxVisible = 5}) {
  if (!genres || genres.length === 0) return null;

  const visibleGenres = genres.slice(0, maxVisible);
  const remainingCount = genres.length - maxVisible;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {visibleGenres.map((genre, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tag}
            onPress={() => onGenrePress?.(genre)}
            activeOpacity={0.7}>
            <Text style={styles.tagText}>{genre}</Text>
          </TouchableOpacity>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.tag, styles.moreTag]}>
            <Text style={styles.tagText}>+{remainingCount}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * GenreGrid Component
 * Displays all genres in a grid layout
 */
export function GenreGrid({genres, onGenrePress, style, numColumns = 3}) {
  if (!genres || genres.length === 0) return null;

  const rows = [];
  for (let i = 0; i < genres.length; i += numColumns) {
    rows.push(genres.slice(i, i + numColumns));
  }

  return (
    <View style={[styles.gridContainer, style]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((genre, colIndex) => (
            <TouchableOpacity
              key={colIndex}
              style={styles.gridTag}
              onPress={() => onGenrePress?.(genre)}
              activeOpacity={0.7}>
              <Text style={styles.gridTagText}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * GenreList Component
 * Displays all available genres for filtering
 */
export function GenreList({genres, selectedGenres, onGenreToggle, style}) {
  if (!genres || genres.length === 0) return null;

  return (
    <View style={[styles.listContainer, style]}>
      {genres.map((genre, index) => {
        const isSelected = selectedGenres?.includes(genre);
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.listTag,
              isSelected && styles.selectedTag,
            ]}
            onPress={() => onGenreToggle?.(genre)}
            activeOpacity={0.7}>
            <Text style={[
              styles.listTagText,
              isSelected && styles.selectedTagText,
            ]}>
              {genre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#667EEA',
    fontSize: 12,
    fontWeight: '500',
  },
  moreTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gridContainer: {
    paddingHorizontal: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  gridTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  gridTagText: {
    color: '#667EEA',
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  listTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedTag: {
    backgroundColor: '#667EEA',
  },
  listTagText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  selectedTagText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default GenreTags;