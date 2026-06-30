import React, {useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {novelAdBlockScript} from '../../../../InkNest-Externals/Screens/Webview/NovelAdBlock';
import {NovelHostName} from '../../../../Utils/APIs';

export const NOVEL_WEBVIEW_ORIGIN_WHITELIST = [
  'http://*',
  'https://*',
  'about:*',
  'data:*',
];

export const shouldAllowNovelWebViewRequest = request => {
  const requestUrl = request?.url;

  if (!requestUrl || typeof requestUrl !== 'string') {
    return false;
  }

  return (
    requestUrl.startsWith('http://') ||
    requestUrl.startsWith('https://') ||
    requestUrl.startsWith('about:') ||
    requestUrl.startsWith('data:')
  );
};

const escapeHtml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildNovelReaderHtmlDocument = ({
  title,
  content,
  paragraphs,
  theme = 'dark',
}) => {
  const paragraphList =
    Array.isArray(paragraphs) && paragraphs.length > 0
      ? paragraphs
      : String(content || '')
          .split(/\n\s*\n/)
          .map(paragraph => paragraph.trim())
          .filter(Boolean);

  const colors =
    theme === 'light'
      ? {
          background: '#ffffff',
          text: '#1a1a1a',
          muted: '#4b5563',
        }
      : theme === 'sepia'
      ? {
          background: '#f4ecd8',
          text: '#5c4b37',
          muted: '#7a6650',
        }
      : {
          background: '#0a0a14',
          text: '#e0e0e0',
          muted: '#a8adc7',
        };

  const htmlParagraphs = paragraphList
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      :root {
        color-scheme: ${theme === 'light' ? 'light' : 'dark'};
      }
      html, body {
        margin: 0;
        padding: 0;
        background: ${colors.background};
        color: ${colors.text};
        font-family: Georgia, serif;
      }
      body {
        padding: 24px 20px 120px;
        line-height: 1.8;
        font-size: 20px;
      }
      h1 {
        margin: 0 0 24px;
        font-size: 28px;
        line-height: 1.25;
        text-align: center;
        color: ${colors.text};
      }
      p {
        margin: 0 0 22px;
        color: ${colors.text};
      }
      .empty {
        color: ${colors.muted};
      }
    </style>
  </head>
  <body>
    ${title ? `<h1>${escapeHtml(title)}</h1>` : ''}
    ${
      htmlParagraphs ||
      `<p class="empty">${escapeHtml('No chapter content available.')}</p>`
    }
  </body>
</html>`;
};

export const updateQueryParam = (url, key, value) => {
  const [withoutHash, hash = ''] = url.split('#');
  const [pathname, queryString = ''] = withoutHash.split('?');

  const entries = queryString
    .split('&')
    .filter(Boolean)
    .map(pair => {
      const [rawParamKey, ...rest] = pair.split('=');
      return [rawParamKey, rest.join('=')];
    })
    .filter(([paramKey]) => paramKey !== key);

  if (value !== null && value !== undefined && value !== '') {
    entries.push([key, encodeURIComponent(value)]);
  }

  const nextQuery = entries
    .map(([paramKey, paramValue]) =>
      paramValue ? `${paramKey}=${paramValue}` : paramKey,
    )
    .join('&');

  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash ? `#${hash}` : ''}`;
};

export const buildNovelReaderUrl = ({
  chapterLink,
  hostKey = 'novelfire',
  service,
}) => {
  if (!chapterLink) {
    return null;
  }

  const baseUrl =
    NovelHostName[hostKey] || NovelHostName.novelfire || 'https://novelfire.net';
  const resolvedUrl =
    chapterLink.startsWith('http://') || chapterLink.startsWith('https://')
      ? chapterLink
      : chapterLink.startsWith('/')
      ? `${baseUrl}${chapterLink}`
      : `${baseUrl}/${chapterLink}`;

  if (!service || !resolvedUrl.includes('wtr-lab.com')) {
    return resolvedUrl;
  }

  if (service === 'ai') {
    return updateQueryParam(resolvedUrl, 'service', null);
  }

  return updateQueryParam(resolvedUrl, 'service', service);
};

/**
 * WebReader Component
 * Displays chapter content in WebView mode with aggressive ad-blocking
 */
export function WebReader({
  chapterLink,
  theme = 'dark',
  hostKey = 'novelfire',
  service,
  htmlTitle,
  htmlContent,
  htmlParagraphs,
  onScroll,
  onLoadStart,
  onLoadEnd,
}) {
  const webViewRef = useRef(null);
  const isHtmlSource =
    Boolean(htmlContent) ||
    (Array.isArray(htmlParagraphs) && htmlParagraphs.length > 0);
  const shouldUseRawWTRLabWebView =
    !isHtmlSource && hostKey === 'wtrlab' && service !== 'ai';

  // Construct full URL from relative path
  const fullUrl = useMemo(() => {
    return buildNovelReaderUrl({chapterLink, hostKey, service});
  }, [chapterLink, hostKey, service]);
  const htmlDocument = useMemo(() => {
    if (!isHtmlSource) {
      return null;
    }

    return buildNovelReaderHtmlDocument({
      title: htmlTitle,
      content: htmlContent,
      paragraphs: htmlParagraphs,
      theme,
    });
  }, [htmlContent, htmlParagraphs, htmlTitle, isHtmlSource, theme]);

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
        source={isHtmlSource ? {html: htmlDocument} : {uri: fullUrl}}
        style={styles.webView}
        originWhitelist={NOVEL_WEBVIEW_ORIGIN_WHITELIST}
        onShouldStartLoadWithRequest={
          isHtmlSource ? undefined : shouldAllowNovelWebViewRequest
        }
        injectedJavaScript={
          isHtmlSource || shouldUseRawWTRLabWebView
            ? undefined
            : injectedJavaScript()
        }
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
        thirdPartyCookiesEnabled={hostKey === 'wtrlab'}
        sharedCookiesEnabled={hostKey === 'wtrlab'}
        setSupportMultipleWindows={hostKey === 'wtrlab'}
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
