/**
 * CloudflareVerify screen
 *
 * Shows readcomicsonline.ru in a WebView so the user can pass the Cloudflare
 * Managed Challenge. Once the real page loads we capture the earned clearance
 * (cf_clearance cookie on Android / shared cookie store on iOS) and hand control
 * back so the failed request can be retried transparently.
 */
import React, {useCallback, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {useDispatch} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {CF_ORIGIN, captureClearance} from '../../Utils/cloudflareClearance';
import {reloadProxy} from '../../Utils/webviewProxy';
import {cloudflareVerified, dismissCloudflareVerify} from '../../Redux/Reducers';

// Reports whether a Cloudflare challenge is on screen. Polls continuously
// (guarded so re-injection doesn't stack intervals) because on iOS/WKWebView the
// Turnstile often solves in-place with no navigation event and can take >8s — a
// fixed set of timeouts would miss the "solved" transition and hang the screen.
const STATE_REPORTER = `(function(){
  function report(){
    try {
      var isChallenge = !!(window._cf_chl_opt) ||
        document.title === 'Just a moment...' ||
        !!document.querySelector('#challenge-form, #cf-challenge-running, script[src*="challenge-platform"]');
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'state', title: document.title || '', isChallenge: isChallenge,
        ua: navigator.userAgent, url: location.href
      }));
    } catch (e) {}
  }
  report();
  if (!window.__cfReporter) {
    window.__cfReporter = setInterval(report, 1500);
  }
})(); true;`;

export default function CloudflareVerify({navigation}) {
  const dispatch = useDispatch();
  const webRef = useRef(null);
  const capturingRef = useRef(false);
  const capturedUaRef = useRef(null);
  const sawChallengeRef = useRef(false);
  const [status, setStatus] = useState('loading'); // loading | challenge | verifying | done

  const finish = useCallback(async () => {
    if (capturingRef.current) {
      return;
    }
    capturingRef.current = true;
    setStatus('verifying');
    try {
      await captureClearance(capturedUaRef.current);
    } catch (e) {
      // even if capture fails, iOS may have auto-shared the cookie
    }
    setStatus('done');
    // Reload the hidden proxy so it re-solves with the now-cleared shared
    // session, then hand control back.
    reloadProxy();
    setTimeout(() => {
      dispatch(cloudflareVerified());
      navigation.goBack();
    }, 1200);
  }, [dispatch, navigation]);

  const onMessage = useCallback(
    event => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type !== 'state') {
          return;
        }
        if (data.ua) {
          capturedUaRef.current = data.ua;
        }
        if (data.isChallenge) {
          sawChallengeRef.current = true;
          setStatus('challenge');
        } else if (!capturingRef.current) {
          // Solved when a previously-seen challenge is now gone, or the real
          // site title appears (handles invisible/auto challenges). The real
          // page title is "Read Comics Online" (with spaces).
          const titleLooksReal = /comics?\s*online/i.test(data.title || '');
          if (sawChallengeRef.current || titleLooksReal) {
            finish();
          }
        }
      } catch (e) {}
    },
    [finish],
  );

  const cancel = useCallback(() => {
    dispatch(dismissCloudflareVerify());
    navigation.goBack();
  }, [dispatch, navigation]);

  const STATUS_INFO = {
    loading: {
      step: 1,
      text: 'Loading Read Comics Online…',
      hint: 'Opening the site in a secure view',
      busy: true,
    },
    challenge: {
      step: 2,
      text: 'Complete the Cloudflare check below',
      hint: 'Tap the checkbox if one appears — it often passes on its own',
      busy: false,
    },
    verifying: {
      step: 3,
      text: 'Extracting clearance token…',
      hint: 'Saving your verified session',
      busy: true,
    },
    done: {
      step: 4,
      text: '✅ Verified — loading your comics…',
      hint: 'Returning to the app',
      busy: false,
    },
  };
  const info = STATUS_INFO[status] || STATUS_INFO.loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={cancel} style={styles.headerBtn} hitSlop={8}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Verify Read Comics Online
        </Text>
        <TouchableOpacity onPress={finish} style={styles.headerBtn} hitSlop={8}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          {info.busy ? (
            <ActivityIndicator
              size="small"
              color="#FF9500"
              style={{marginRight: 8}}
            />
          ) : (
            <Text style={styles.statusStep}>{info.step}/4</Text>
          )}
          <Text style={styles.statusText}>{info.text}</Text>
        </View>
        <Text style={styles.statusHint}>{info.hint}</Text>
      </View>

      <WebView
        ref={webRef}
        source={{uri: CF_ORIGIN}}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        cacheEnabled
        style={styles.web}
        injectedJavaScript={STATE_REPORTER}
        onMessage={onMessage}
        onLoadEnd={() => webRef.current?.injectJavaScript(STATE_REPORTER)}
        onNavigationStateChange={() =>
          webRef.current?.injectJavaScript(STATE_REPORTER)
        }
        setSupportMultipleWindows={false}
        javaScriptCanOpenWindowsAutomatically={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webLoading}>
            <ActivityIndicator size="large" color="#FF9500" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#14142A'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerBtn: {minWidth: 52, justifyContent: 'center'},
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  doneText: {color: '#4CAF50', fontSize: 16, fontWeight: '700', textAlign: 'right'},
  statusBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  statusRow: {flexDirection: 'row', alignItems: 'center'},
  statusStep: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8,
  },
  statusText: {color: '#fff', fontSize: 14, fontWeight: '600', flex: 1},
  statusHint: {color: '#8890ab', fontSize: 12, marginTop: 3},
  web: {flex: 1, backgroundColor: '#000'},
  webLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
});
