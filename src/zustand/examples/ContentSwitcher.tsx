import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useContentNavigation } from '../index';

/**
 * Example component showing how to use the navigation store
 * This can be used as a tab switcher or navigation selector
 */
export const ContentSwitcher: React.FC = () => {
  const {
    selectedContentType,
    currentLabel,
    isComicSelected,
    isMangaSelected,
    selectComic,
    selectManga,
  } = useContentNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Content Type: {currentLabel}</Text>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            isComicSelected && styles.activeButton
          ]}
          onPress={selectComic}
        >
          <Text style={[
            styles.buttonText,
            isComicSelected && styles.activeButtonText
          ]}>
            Comic
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            isMangaSelected && styles.activeButton
          ]}
          onPress={selectManga}
        >
          <Text style={[
            styles.buttonText,
            isMangaSelected && styles.activeButtonText
          ]}>
            Manga
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.debugText}>
        Selected Type ID: {selectedContentType}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  activeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});
