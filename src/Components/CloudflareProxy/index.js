/**
 * CloudflareProxy — persistent, hidden WebView that holds a cleared
 * readcomicsonline.ru browser session. Page requests are executed by NAVIGATING
 * this WebView to the target URL and reading back the rendered HTML (see
 * webviewProxy). Because it's a real browser (matching TLS fingerprint +
 * same-origin cf_clearance cookie), Cloudflare auto-solves each navigation —
 * unlike a native okhttp/NSURLSession replay or an in-page fetch(), both 403'd.
 *
 * Mounted once near the app root. If a challenge lingers and can't auto-solve,
 * it asks the user to verify; when it clears it bumps the nonce so screens
 * refetch whatever failed.
 */
import React, {useCallback, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {useDispatch} from 'react-redux';

import {CF_ORIGIN, CF_PRIMARY_HOST} from '../../Utils/cloudflareClearance';
import {cloudflareVerified, requestCloudflareVerify} from '../../Redux/Reducers';
import {
  setProxyRef,
  notifyLoadEnd,
  deliverPage,
  failAllPending,
} from '../../Utils/webviewProxy';

// Continuously reports whether a Cloudflare challenge is on screen, so we can
// tell if the session is stuck (needs a manual solve) vs auto-solving.
const STATE_REPORTER = `(function(){
  function report(){
    try {
      var isChallenge = !!(window._cf_chl_opt) ||
        document.title === 'Just a moment...' ||
        !!document.querySelector('#challenge-form, #cf-challenge-running, script[src*="challenge-platform"]');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'cfproxystate', isChallenge: isChallenge, title: document.title || ''
      }));
    } catch (e) {}
  }
  report();
  if (!window.__cfProxyReporter) { window.__cfProxyReporter = setInterval(report, 2000); }
})(); true;`;

export default function CloudflareProxy() {
  const ref = useRef(null);
  const dispatch = useDispatch();
  const wasChallengedRef = useRef(false);
  const stuckTimerRef = useRef(null);

  const clearStuckTimer = () => {
    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }
  };

  useEffect(() => {
    setProxyRef(ref.current);
    return () => {
      setProxyRef(null);
      failAllPending('CF proxy unmounted');
      clearStuckTimer();
    };
  }, []);

  const onMessage = useCallback(
    event => {
      let data;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch (e) {
        return;
      }
      // HTML read back for an in-flight navigate-and-read request.
      if (data.__cfpage) {
        deliverPage(data.url, data.html);
        return;
      }
      if (data.type !== 'cfproxystate') {
        return;
      }
      if (data.isChallenge) {
        // Arm a one-shot "still stuck?" timer. If the challenge can't auto-solve
        // within the window, ask the user to complete it manually.
        wasChallengedRef.current = true;
        if (!stuckTimerRef.current) {
          stuckTimerRef.current = setTimeout(() => {
            stuckTimerRef.current = null;
            dispatch(
              requestCloudflareVerify({
                host: CF_PRIMARY_HOST,
                sourceKey: 'readcomicsonline',
                sourceName: 'Read Comics Online',
              }),
            );
          }, 12000);
        }
      } else {
        clearStuckTimer();
        // Recovered from a challenge (auto- or user-solved) → nudge screens to
        // refetch whatever failed while it was blocked.
        if (wasChallengedRef.current) {
          wasChallengedRef.current = false;
          dispatch(cloudflareVerified());
        }
      }
    },
    [dispatch],
  );

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={ref}
        source={{uri: CF_ORIGIN}}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        cacheEnabled
        injectedJavaScript={STATE_REPORTER}
        onMessage={onMessage}
        onLoadEnd={() => {
          ref.current?.injectJavaScript(STATE_REPORTER);
          notifyLoadEnd();
        }}
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        style={styles.web}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Kept mounted but effectively invisible / non-interactive.
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    top: -1000,
    left: -1000,
    opacity: 0,
  },
  web: {width: 1, height: 1},
});
