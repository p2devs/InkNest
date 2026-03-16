import React, {useRef, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {novelAdBlockScript} from '../../../../InkNest-Externals/Screens/Webview/NovelAdBlock';

/**
 * WebReader Component
 * Displays chapter content in WebView mode with aggressive ad-blocking
 */
export function WebReader({
  chapterLink,
  theme = 'dark',
  onScroll,
  onLoadStart,
  onLoadEnd,
}) {
  const webViewRef = useRef(null);

  const getThemeCSS = useCallback(() => {
    switch (theme) {
      case 'light':
        return `
          body {
            background-color: #ffffff !important;
            color: #1a1a1a !important;
          }
        `;
      case 'sepia':
        return `
          body {
            background-color: #f4ecd8 !important;
            color: #5c4b37 !important;
          }
        `;
      default:
        return `
          body {
            background-color: #0a0a14 !important;
            color: #e0e0e0 !important;
          }
        `;
    }
  }, [theme]);

  const injectedJavaScript = useCallback(() => {
    return novelAdBlockScript(getThemeCSS());
  }, [getThemeCSS]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        onLoadEnd?.();
      } else if (data.type === 'adBlockLog') {
        // Optional: log ad blocking activity for debugging
        console.log('[AdBlock]', data.message);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [onLoadEnd]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{uri: chapterLink}}
        style={styles.webView}
        originWhitelist={['*']}
        injectedJavaScript={injectedJavaScript()}
        onMessage={handleMessage}
        onLoadStart={() => onLoadStart?.()}
        onLoadEnd={() => onLoadEnd?.()}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667EEA" />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        cacheEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
});

export default WebReader;