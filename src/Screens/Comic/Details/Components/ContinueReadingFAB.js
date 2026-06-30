import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Animated, {FadeInUp, FadeOutDown} from 'react-native-reanimated';

const ContinueReadingFAB = ({
  visible,
  chapterTitle,
  progress,
  onPress,
  currentPage,
  totalPages,
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.9}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>Continue Reading</Text>
            <Text style={styles.chapterTitle} numberOfLines={1}>
              {chapterTitle}
            </Text>
            {currentPage > 0 && totalPages > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, {width: `${progress}%`}]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentPage}/{totalPages}
                </Text>
              </View>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: heightPercentageToDP('2%'),
    left: widthPercentageToDP('4%'),
    right: widthPercentageToDP('4%'),
    zIndex: 100,
  },
  button: {
    backgroundColor: '#3268de',
    borderRadius: 16,
    shadowColor: '#3268de',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});

export default ContinueReadingFAB;
