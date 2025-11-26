import React, {createContext, useContext, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {useColorScheme} from 'react-native';
import {lightColors, darkColors} from './colors';

/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * Theme context that provides the current theme colors and mode information.
 */
const ThemeContext = createContext({
  colors: darkColors,
  isDark: true,
  themeMode: 'system',
});

/**
 * ThemeProvider component that wraps the application and provides theme context.
 * It reads the theme preference from Redux store and the system color scheme
 * to determine the current theme.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The provider component wrapping children
 */
export function ThemeProvider({children}) {
  const systemColorScheme = useColorScheme();
  const themeMode = useSelector(state => state.data.themeMode) || 'system';

  const {colors, isDark} = useMemo(() => {
    let isDarkTheme;

    if (themeMode === 'system') {
      isDarkTheme = systemColorScheme === 'dark';
    } else {
      isDarkTheme = themeMode === 'dark';
    }

    return {
      colors: isDarkTheme ? darkColors : lightColors,
      isDark: isDarkTheme,
    };
  }, [themeMode, systemColorScheme]);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      themeMode,
    }),
    [colors, isDark, themeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Custom hook to access the current theme context.
 * Must be used within a ThemeProvider.
 *
 * @returns {{ colors: typeof darkColors, isDark: boolean, themeMode: string }}
 *   The current theme colors, dark mode flag, and theme mode setting
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export {lightColors, darkColors};
