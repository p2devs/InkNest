import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootParamList } from '../constants/navigation';

// Type for stack navigation prop
export type RootStackNavigationProp = StackNavigationProp<RootParamList>;

export const navigationRef = createNavigationContainerRef<RootParamList>();

/**
 * Hook to get typed navigation object for use in components
 * This provides direct access to push, replace, pop, etc. without dispatch
 */
export function useTypedNavigation() {
  return useNavigation<RootStackNavigationProp>();
}

// =============================================================================
// GLOBAL NAVIGATION FUNCTIONS (for use outside React components)
// Use these in services, utilities, Redux actions, etc.
// =============================================================================

/**
 * Navigates to a specified screen if the navigation reference is ready.
 */
export function navigate<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    // Type assertion for params since all current routes have undefined params
    (navigationRef.navigate as any)(name, params);
  }
}

/**
 * Navigates back to the previous screen if the navigation stack can go back and the navigation reference is ready.
 */
export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Pushes a new screen onto the navigation stack.
 *
 * @param {keyof RootParamList} name - The name of the screen to navigate to.
 * @param {RootParamList[keyof RootParamList]} [params] - Optional parameters to pass to the screen.
 */
export function push<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params));
  }
}

/**
 * Replaces the current route with a new one.
 *
 * @param {keyof RootParamList} name - The name of the new route.
 * @param {RootParamList[keyof RootParamList]} [params] - The parameters to pass to the new route.
 */
export function replace<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params));
  }
}

/**
 * Resets the navigation state to the root with the specified route name and parameters.
 */
export function resetRoot<RouteName extends keyof RootParamList>(
  name: RouteName,
  params?: RootParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name, params }],
    });
  }
}

/**
 * Pops a given number of screens from the navigation stack.
 *
 * @param {number} [count=1] - The number of screens to pop. Defaults to 1.
 */
export function pop(count: number = 1) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.pop(count));
  }
}

/**
 * Pops all screens from the navigation stack except the first one.
 */
export function popToTop() {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.popToTop());
  }
}
