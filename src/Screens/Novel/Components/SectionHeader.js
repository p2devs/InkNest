import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * SectionHeader Component
 * Displays a section title with optional "See All" button
 */
export function SectionHeader({title, onSeeAllPress, style}) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAllPress && (
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={onSeeAllPress}
          activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#667EEA" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * SectionHeaderWithCount Component
 * Displays a section title with item count
 */
export function SectionHeaderWithCount({title, count, onSeeAllPress, style}) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.count}>({count})</Text>
        )}
      </View>
      {onSeeAllPress && (
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={onSeeAllPress}
          activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#667EEA" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SectionHeader;