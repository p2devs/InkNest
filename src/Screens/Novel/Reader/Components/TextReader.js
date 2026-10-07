import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {getChapterParagraphs} from '../../Narration/chapterText';

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
  // Narration: highlighted paragraph, its scroll offsets, and listen-from-here.
  activeParagraph = -1,
  onParagraphLayout,
  onParagraphLongPress,
}) {
  const paragraphs = getChapterParagraphs(content);
  const listTop = useRef(0);

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
      <View
        onLayout={event => {
          listTop.current = event.nativeEvent.layout.y;
        }}>
        {(paragraphs.length > 0 ? paragraphs : [String(content || '')]).map(
          (paragraph, index) => (
            <Text
              key={`${index}-${paragraph.slice(0, 24)}`}
              onLayout={
                onParagraphLayout &&
                (event =>
                  onParagraphLayout(
                    index,
                    listTop.current + event.nativeEvent.layout.y,
                  ))
              }
              onLongPress={
                onParagraphLongPress && (() => onParagraphLongPress(index))
              }
              accessibilityHint={
                onParagraphLongPress
                  ? 'Long press to select this paragraph for listening'
                  : undefined
              }
              style={[
                styles.content,
                {
                  color: themeStyles.color,
                  fontSize,
                  lineHeight: fontSize * lineHeight,
                  fontFamily: getFontFamily(),
                },
                index < paragraphs.length - 1 && styles.paragraphSpacing,
                index === activeParagraph && styles.activeParagraph,
              ]}>
              {paragraph}
            </Text>
          ),
        )}
      </View>
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
    textAlign: 'left',
  },
  paragraphSpacing: {
    marginBottom: 20,
  },
  activeParagraph: {
    backgroundColor: 'rgba(102, 126, 234, 0.18)',
    borderRadius: 4,
  },
});

export default TextReader;
