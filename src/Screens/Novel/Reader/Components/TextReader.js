import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

/**
 * TextReader Component
 * Displays chapter content in plain text mode with customizable styling
 */
export function TextReader({
  content,
  title,
  fontSize = 18,
  lineHeight = 1.6,
  fontFamily = 'serif',
  theme = 'dark',
  onPress,
}) {
  const getThemeStyles = () => {
    switch (theme) {
      case 'light':
        return {color: '#1a1a1a'};
      case 'sepia':
        return {color: '#5c4b37'};
      default:
        return {color: '#e0e0e0'};
    }
  };

  const themeStyles = getThemeStyles();

  const getFontFamily = () => {
    switch (fontFamily) {
      case 'sans-serif':
        return 'System';
      case 'monospace':
        return 'Courier';
      default:
        return 'Georgia';
    }
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress}>
      {title && (
        <Text style={[
          styles.title,
          {color: themeStyles.color, fontSize: fontSize + 4},
        ]}>
          {title}
        </Text>
      )}
      <Text style={[
        styles.content,
        {
          color: themeStyles.color,
          fontSize,
          lineHeight: fontSize * lineHeight,
          fontFamily: getFontFamily(),
        },
      ]}>
        {content}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  content: {
    textAlign: 'justify',
  },
});

export default TextReader;