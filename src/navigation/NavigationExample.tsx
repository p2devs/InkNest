import React from 'react';
import { View, Button } from 'react-native';

// Import both approaches
import { useTypedNavigation } from './navigationServices';
import * as NavigationService from './navigationServices';

export function NavigationExample() {
  // Method 1: Using useNavigation hook (RECOMMENDED FOR COMPONENTS)
  const navigation = useTypedNavigation();

  const handleUseNavigationApproach = () => {
    // Direct access to all methods - cleaner and more straightforward
    navigation.navigate('Home');
    navigation.push('Home');
    navigation.replace('Home');
    navigation.pop();
    navigation.popToTop();
    navigation.goBack();
  };

  const handleGlobalServiceApproach = () => {
    // Using global navigation service
    NavigationService.navigate('Home');
    NavigationService.push('Home');
    NavigationService.replace('Home');
    NavigationService.pop();
    NavigationService.popToTop();
    NavigationService.goBack();
  };

  return (
    <View>
      <Button
        title="Use Navigation Hook (Recommended for Components)"
        onPress={handleUseNavigationApproach}
      />
      <Button
        title="Use Global Service (For Services/Utilities)"
        onPress={handleGlobalServiceApproach}
      />
    </View>
  );
}

// =============================================================================
// COMPARISON:
// =============================================================================

// ✅ useNavigation Hook Approach (for React components):
// - navigation.push('Home')           // Direct method
// - navigation.replace('Home')        // Direct method
// - navigation.pop()                  // Direct method
// - Full TypeScript support

// ✅ Global Service Approach (for services/utilities):
// - NavigationService.push('Home')    // Uses dispatch + StackActions
// - NavigationService.replace('Home') // Uses dispatch + StackActions
// - NavigationService.pop()           // Uses dispatch + StackActions
// - Works outside React component tree
