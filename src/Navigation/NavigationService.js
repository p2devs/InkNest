import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigates to a specified screen if the navigation reference is ready.
 *
 * @param {string} name - The name of the screen to navigate to.
 * @param {Object} [params] - The parameters to pass to the screen.
 */
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
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
 * @param {string} name - The name of the screen to navigate to.
 * @param {Object} [params] - Optional parameters to pass to the screen.
 */
export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.push(name, params);
  }
}

/**
 * Replaces the current route with a new one.
 *
 * @param {string} name - The name of the new route.
 * @param {Object} [params] - The parameters to pass to the new route.
 */
export function replace(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.replace(name, params);
  }
}

/**
 * Resets the navigation state to the root with the specified route name and parameters.
 *
 * @param {string} name - The name of the route to navigate to.
 * @param {Object} params - The parameters to pass to the route.
 */
export function resetRoot(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{name, params}],
    });
  }
}
