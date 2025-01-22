import React, {useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';

import {WebView} from 'react-native-webview';

import {SafeAreaView} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import {NAVIGATION} from '../../../Constants';
import {useSelector} from 'react-redux';
import {getComicsHome} from '../APIs/Home';
import HistoryCard from './Components/HistoryCard';
import Card from '../Components/Card';
import {AppendAd} from '../../../Components/Ads/AppendAd';

export function Home({navigation}) {
  const webViewRef = useRef(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);

  // Updated injected JavaScript with HTML capture
  const injectedJS = `
    (function() {
      function checkBridge() {
        if (!window.ReactNativeWebView) {
          setTimeout(checkBridge, 100);
          return;
        }
        
        let lastUrl = location.href;
        
        const observer = new MutationObserver(() => {
          // Detect CAPTCHA challenge
          if(document.querySelector('#challenge-form')) {
            window.ReactNativeWebView.postMessage('captcha_required');
          }
          
          // Detect URL change after verification
          if(location.href !== lastUrl) {
            lastUrl = location.href;
            window.ReactNativeWebView.postMessage('url_changed:' + location.href);
          }
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        // Add load listener
        window.addEventListener('load', () => {
          window.ReactNativeWebView.postMessage('page_loaded');
        });
        
        true;
      }
      checkBridge();
    })();
  `;

  const captureHTML = () => {
    webViewRef.current.injectJavaScript(`
      window.ReactNativeWebView.postMessage('html_content:' + document.documentElement.outerHTML);
      true;
    `);
  };

  const flatListRef = useRef(null);
  const [comicsData, setComicsData] = useState({});
  const [loading, setLoading] = useState(false);
  const History = useSelector(state => state.data.history);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isVerified ? (
        <>
          <WebView
            ref={webViewRef}
            source={{uri: 'https://readallcomics.com'}}
            injectedJavaScript={injectedJS}
            onMessage={event => {
              const message = event.nativeEvent.data;
              // console.log('Received message:', message);

              if (message === 'captcha_required') {
                console.log('CAPTCHA verification needed!');
                setCaptchaRequired(true); // Show WebView
                setIsVerified(false);
              } else if (message === 'page_loaded') {
                console.log('Page fully loaded');
                captureHTML();
              } else if (message.startsWith('html_content:')) {
                const html = message.replace('html_content:', '');
                const isCaptchaPage =
                  html.includes('id="challenge-form"') ||
                  html.includes('<title>Just a moment...</title>');

                if (isCaptchaPage) {
                  console.log('CAPTCHA page detected');
                  setCaptchaRequired(true); // Keep WebView visible
                  setIsVerified(false);
                } else {
                  console.log('Valid content received');
                  setCaptchaRequired(false); // Hide WebView
                  setHtmlContent(html);
                  setIsVerified(true);
                  getComicsHome(setComicsData, setLoading, html);
                }
              }
            }}
            onNavigationStateChange={navState => {
              if (navState.loading === false && isVerified) {
                captureHTML();
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.log('WebView error:', nativeEvent);
            }}
            style={{
              flex: captchaRequired ? 1 : 0,
            }}
          />
          <View style={{padding: 20}}>
            {captchaRequired ? (
              <Text style={styles.captchaMessage}>
                🔒 Please complete the CAPTCHA verification to continue. Once
                resolved, we'll automatically load the content.
              </Text>
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  Verification Status:{' '}
                  {isVerified ? 'Verified ✅' : 'Pending ❌'}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  HTML Content Length: {htmlContent.length} characters
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  CAPTCHA Required: {captchaRequired ? 'Yes' : 'No'}
                </Text>
              </>
            )}
          </View>
        </>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.rectangle}
            onPress={() => {
              crashlytics().log('Home Search button clicked');
              navigation.navigate(NAVIGATION.search);
            }}>
            <AntDesign name="search1" size={20} color="#fff" />
            <Text style={styles.searchPeopleBy}>Search here</Text>
          </TouchableOpacity>
          {!Object.values(History).length ? null : (
            <View style={styles.gameDetailsParent}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#fff',
                    textAlign: 'left',
                    opacity: 0.9,
                  }}>
                  Continue Reading
                </Text>
              </View>

              <FlatList
                data={Object.values(History).sort(
                  (a, b) => b.lastOpenAt - a.lastOpenAt,
                )}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => (
                  <HistoryCard item={item} index={index} key={index} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            Object.keys(comicsData).map((key, index) => (
              <View key={index} style={styles.gameDetailsParent}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#fff',
                      textAlign: 'left',
                      opacity: 0.9,
                    }}>
                    {comicsData?.[key]?.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      crashlytics().log('See All (Home) button clicked');
                      analytics().logEvent('see_all_button_clicked', {
                        key: key?.toString(),
                        title: comicsData?.[key]?.title?.toString(),
                        data: comicsData?.[key]?.data?.toString(),
                        lastPage: comicsData?.[key]?.lastPage?.toString(),
                        hostName: comicsData?.[key]?.hostName?.toString(),
                      });
                      navigation.navigate(NAVIGATION.seeAll, {
                        key,
                        title: comicsData?.[key]?.title,
                        data: comicsData?.[key]?.data,
                        lastPage: comicsData?.[key]?.lastPage,
                        hostName: comicsData?.[key]?.hostName,
                      });
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#2767f2',
                        textAlign: 'right',
                      }}>
                      See All
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* // append an type ad in this add and this should be in every 4th index */}
                <FlatList
                  data={AppendAd(comicsData?.[key]?.data)}
                  keyExtractor={(item, index) => index.toString()}
                  ref={flatListRef}
                  renderItem={({item, index}) => (
                    <Card
                      item={item}
                      index={index}
                      onPress={() => {
                        crashlytics().log('Comic Details button clicked');
                        analytics().logEvent('comic_details_button_clicked', {
                          link: item?.link?.toString(),
                          title: item?.title?.toString(),
                          isComicBookLink: key === 'readallcomics',
                        });
                        navigation.navigate(NAVIGATION.comicDetails, {
                          ...item,
                          isComicBookLink: key === 'readallcomics',
                        });
                      }}
                    />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  rectangle: {
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    height: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  searchPeopleBy: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'left',
    opacity: 0.3,
  },
  gameDetailsParent: {
    marginBottom: 24,
  },
  captchaMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
});
