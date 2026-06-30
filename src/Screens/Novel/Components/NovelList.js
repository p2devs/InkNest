import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {NovelCard} from './NovelCard';
import {SectionHeader} from './SectionHeader';

const {width} = Dimensions.get('window');

/**
 * Generate a safe key from a novel item
 * Uses index as part of key to ensure uniqueness when same novel appears in multiple sections
 */
const getNovelKey = (item, index) => {
  if (item.link) {
    // Extract the slug from the URL and sanitize it
    const slug = item.link.split('/book/')[1] || item.link;
    const sanitized = slug.replace(/[^a-zA-Z0-9]/g, '-');
    // Include index to ensure uniqueness when same novel appears in multiple sections
    return `novel-${sanitized}-${index}`;
  }
  return `novel-${index}`;
};

/**
 * NovelList Component
 * Displays a horizontal scrollable list of novels
 */
export function NovelList({
  title,
  novels,
  onItemPress,
  onSeeAllPress,
  showSeeAll = true,
  style,
}) {
  if (!novels || novels.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <SectionHeader
        title={title}
        onSeeAllPress={showSeeAll ? onSeeAllPress : undefined}
      />
      <FlatList
        data={novels}
        keyExtractor={getNovelKey}
        renderItem={({item}) => (
          <NovelCard
            novel={item}
            onPress={onItemPress}
            style={styles.card}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

/**
 * NovelGrid Component
 * Displays a grid of novels
 */
export function NovelGrid({
  novels,
  onItemPress,
  numColumns = 3,
  style,
}) {
  if (!novels || novels.length === 0) return null;

  const renderItem = ({item}) => (
    <NovelCard
      novel={item}
      onPress={onItemPress}
      style={{
        width: (width - 48 - (numColumns - 1) * 12) / numColumns,
      }}
    />
  );

  return (
    <FlatList
      data={novels}
      keyExtractor={getNovelKey}
      renderItem={renderItem}
      numColumns={numColumns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.gridContent, style]}
      columnWrapperStyle={styles.gridRow}
    />
  );
}

/**
 * NovelSectionList Component
 * Displays multiple sections of novels
 * Uses map instead of FlatList to avoid nested VirtualizedList warning
 */
export function NovelSectionList({
  sections,
  onItemPress,
  onSeeAllPress,
  style,
}) {
  if (!sections || sections.length === 0) return null;

  return (
    <View style={style}>
      {sections.map((section, index) => (
        <NovelList
          key={`section-${index}-${section.name}`}
          title={section.name}
          novels={section.novels}
          onItemPress={onItemPress}
          onSeeAllPress={() => onSeeAllPress?.(section.name, section.novels)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    marginRight: 12,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});

export default NovelList;