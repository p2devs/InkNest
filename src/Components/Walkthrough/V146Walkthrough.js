import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  WelcomeSvg,
  MangaTabSvg,
  UnifiedSearchSvg,
  MangaBookmarksSvg,
  ReadingProgressSvg,
  GetStartedSvg,
} from './V146WalkthroughSvgs';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const WALKTHROUGH_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to InkNest 1.4.6',
    description:
      'We have exciting new features! InkNest now supports Manga alongside Comics.',
    SvgComponent: WelcomeSvg,
  },
  {
    id: 'manga-tab',
    title: 'Manga Tab in Library',
    description:
      'Switch between Comics and Manga tabs in your Library to browse your collection.',
    SvgComponent: MangaTabSvg,
  },
  {
    id: 'unified-search',
    title: 'Unified Search',
    description:
      'Search for comics AND manga from one place. Results are organized by source tabs.',
    SvgComponent: UnifiedSearchSvg,
  },
  {
    id: 'manga-bookmarks',
    title: 'Manga Bookmarks',
    description:
      'Save your favorite manga. Access them from Bookmarks with separate tabs for both content types.',
    SvgComponent: MangaBookmarksSvg,
  },
  {
    id: 'reading-progress',
    title: 'Reading Progress',
    description:
      'Continue where you left off! Your manga reading progress is saved automatically.',
    SvgComponent: ReadingProgressSvg,
  },
  {
    id: 'get-started',
    title: 'Ready to Explore?',
    description:
      'Dive into the world of manga and comics. Happy reading!',
    SvgComponent: GetStartedSvg,
  },
];

const V146Walkthrough = ({visible, onClose, onComplete}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose?.();
  };

  const step = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === WALKTHROUGH_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <View style={styles.stepIndicator}>
              {WALKTHROUGH_STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                    index < currentStep && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
            <View style={styles.svgContainer}>
              {step.SvgComponent && (
                <step.SvgComponent size={step.svgProps?.size || 180} />
              )}
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </Animated.View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <TouchableOpacity
              onPress={handlePrevious}
              style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
              disabled={isFirstStep}>
              <Ionicons
                name="chevron-back"
                size={20}
                color={isFirstStep ? '#444' : '#fff'}
              />
              <Text
                style={[
                  styles.navButtonText,
                  isFirstStep && styles.navButtonTextDisabled,
                ]}>
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.navButtonPrimary]}>
              <Text style={styles.navButtonTextPrimary}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons
                name={isLastStep ? 'checkmark' : 'chevron-forward'}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  dotCompleted: {
    backgroundColor: '#00C853',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  svgContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
    flex: 1,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#444',
  },
  navButtonTextPrimary: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default V146Walkthrough;