// Define navigation routes with their parameter types
export const NAVIGATION = {
  home: 'Home' as const,
  // Add more routes here as needed
  // profile: 'Profile' as const,
  // settings: 'Settings' as const,
} as const;

// Extract route names as a union type
export type NavigationRoutes = typeof NAVIGATION[keyof typeof NAVIGATION];

// Define parameter types for each route
export type NavigationParams = {
  [NAVIGATION.home]: undefined;
  // Add parameter types for other routes
  // [NAVIGATION.profile]: { userId: string };
  // [NAVIGATION.settings]: undefined;
};

// Generate RootParamList from the navigation constants
export type RootParamList = {
  [K in NavigationRoutes]: K extends keyof NavigationParams ? NavigationParams[K] : undefined;
};
