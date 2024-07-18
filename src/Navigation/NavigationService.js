import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.push(name, params);
  }
}

export function replace(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.replace(name, params);
  }
}

export function resetRoot(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name, params }],
    });
  }
}