import React, {useEffect, useRef, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

import {
  fetchComicBook,
  fetchComicDetails,
} from '../../../Redux/Actions/GlobalActions';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import WebView from 'react-native-webview';

export function ComicDetails({route}) {
  const {link, image, title, isComicBookLink} = route.params;
  const webviewRef = useRef(null);
  const [PageLink, setPageLink] = useState(isComicBookLink ? null : link);
  const [tabBar, setTabBar] = useState([
    {name: 'Chapters', active: true},
    {name: 'Bookmarks', active: false},
  ]);

  const [sort, setSort] = useState(false);

  const dispatch = useDispatch();

  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);

  const reverseChapterList = () => {
    const chapterList = ComicDetail?.issues ?? ComicDetail?.chapters;
    if (!chapterList) return [];
    if (!sort) return [...chapterList];
    return [...chapterList].reverse();
  };

  useEffect(() => {
    if (isComicBookLink && !PageLink) {
      dispatch(fetchComicBook(link, setPageLink));
    } else {
      dispatch(fetchComicDetails(PageLink));
    }
  }, [PageLink]);

  if (error) {
    if (error.includes('403')) {
      const injectedJS = `
          (function() {
              const logoElement = document.querySelector('a[title="Read All Comics Online"]');
            if (logoElement) {
              window.ReactNativeWebView.postMessage(document.documentElement.outerHTML);
            } else {
              let previousKey = '';
              const observer = new MutationObserver(() => {
                const key = document.querySelector('meta[name="key"]').getAttribute('content');
                if (key !== previousKey) {
                  previousKey = key;
                  window.ReactNativeWebView.postMessage('Key changed: ' + key);
                }
              });
              observer.observe(document, { attributes: true, childList: true, subtree: true });
            }
          })();
        `;

      const onMessage = async event => {
        const {data} = event.nativeEvent;
        const html = data;

        if (isComicBookLink && !PageLink) {
          dispatch(fetchComicBook(link, setPageLink, false, html));
        } else {
          dispatch(fetchComicDetails(PageLink, false, html));
        }
      };

      return (
        <WebView
          ref={webviewRef}
          source={{uri: PageLink ? PageLink : link}}
          injectedJavaScript={injectedJS}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.log('WebView error:', nativeEvent);
          }}
        />
      );
    }
    return <Error error={error} />;
  }

  return (
    <>
      <LoadingModal loading={loading} />
      <FlatList
        ListHeaderComponent={
          <HeaderComponent
            link={PageLink}
            image={image}
            title={title}
            tabBar={tabBar}
            onTabBar={index => {
              crashlytics().log('Comic Details Tab Clicked');
              analytics().logEvent('Comic_Details_Tab_Clicked', {
                TabName: tabBar[index].name?.toString(),
              });
              tabBar.map(tab => (tab.active = false));
              tabBar[index].active = true;
              setTabBar([...tabBar]);
            }}
            sort={sort}
            setSORT={() => {
              crashlytics().log('Comic Details Sort Clicked');
              analytics().logEvent('Comic_Details_Sort_Clicked');
              setSort(!sort);
            }}
          />
        }
        data={AppendAd(reverseChapterList())}
        style={styles.container}
        renderItem={({item, index}) => (
          <ChapterCard
            item={item}
            index={index}
            isBookmark={tabBar[1]?.active}
            detailPageLink={PageLink}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{height: heightPercentageToDP('5%')}} />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
});
