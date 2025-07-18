import {Alert} from 'react-native';
import { isMacOS } from './PlatformUtils';

// Conditional imports for Firebase
let analytics = {
  logEvent: () => {},
};
let crashlytics = {
  log: () => {},
  setAttribute: () => {},
  setUserId: () => {},
  recordError: () => {},
};

if (!isMacOS) {
  try {
    analytics = require('@react-native-firebase/analytics').default;
    crashlytics = require('@react-native-firebase/crashlytics').default;
  } catch (error) {
    console.log('Firebase modules not available on this platform');
  }
}

/**
 * Function to handle scroll mode change with options for temporary use or saving as default
 * 
 * @param {boolean} currentIsVerticalValue - The current boolean value of vertical scrolling (true for vertical, false for horizontal)
 * @param {Function} setIsVerticalScroll - State setter for the component's vertical scroll state
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} setScrollPreferenceAction - The action creator to update scroll preference in Redux
 * @param {Function} closeModal - Optional function to close a modal if this is being called from a modal
 * @param {string} screenName - The name of the screen/component for analytics
 * @param {string} userId - Optional user ID for crashlytics (like comicBookLink)
 */
export const handleScrollModeChange = (
  currentIsVerticalValue,
  setIsVerticalScroll,
  dispatch,
  setScrollPreferenceAction,
  closeModal = null,
  screenName = 'Comic',
  userId = null,
) => {
  const newScrollMode = !currentIsVerticalValue;
  const newScrollModeText = newScrollMode ? 'vertical' : 'horizontal';
  
  Alert.alert(
    'Change Scroll Mode',
    `Change to ${newScrollModeText} scrolling for this comic?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'This time only',
        onPress: () => {
          setIsVerticalScroll(newScrollMode);
          if (closeModal) closeModal();
          
          analytics.logEvent(`toggle_vertical_scroll_temporary`, {
            screen: screenName,
            isVerticalScroll: newScrollMode,
          });
          
          crashlytics().log('Comic Scroll Mode Changed (Temporary)');
          if (userId) {
            crashlytics().setAttribute('scroll_mode', newScrollModeText);
            crashlytics().setUserId(userId);
          }
        },
      },
      {
        text: 'Save as default',
        onPress: () => {
          setIsVerticalScroll(newScrollMode);
          dispatch(setScrollPreferenceAction(newScrollMode ? 'vertical' : 'horizontal'));
          if (closeModal) closeModal();
          
          analytics.logEvent(`toggle_vertical_scroll_default`, {
            screen: screenName,
            isVerticalScroll: newScrollMode,
          });
          
          crashlytics().log('Comic Scroll Mode Changed (Default)');
          if (userId) {
            crashlytics().setAttribute('scroll_mode', newScrollModeText);
            crashlytics().setUserId(userId);
          }
        },
      },
    ],
  );
};