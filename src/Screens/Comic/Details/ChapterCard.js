import React, {memo, useState} from 'react';
import {TouchableOpacity, Text, View, ActivityIndicator} from 'react-native';

import {useFeatureFlag} from 'configcat-react';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import Entypo from 'react-native-vector-icons/Entypo';
import {isMacOS} from '../../../Utils/PlatformUtils';

import {navigate} from '../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../Constants';
import AdBanner from '../../../InkNest-Externals/Ads/BannerAds';
import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import {
  downloadComicBook,
  showRewardedAd,
} from '../../../InkNest-Externals/Redux/Actions/Download';

// Conditional imports for non-macOS platforms
let getVersion, crashlytics, analytics, BannerAdSize;
if (!isMacOS) {
  try {
    getVersion = require('react-native-device-info').getVersion;
    crashlytics = require('@react-native-firebase/crashlytics').default;
    analytics = require('@react-native-firebase/analytics').default;
    BannerAdSize = require('react-native-google-mobile-ads').BannerAdSize;
  } catch (error) {
    console.log('Some modules not available on this platform:', error.message);
    getVersion = () => '1.0.0';
  }
} else {
  // Fallback functions for macOS
  getVersion = () => '1.0.0';
}

const ChapterCard = ({item, index, isBookmark, detailPageLink}) => {
  const ComicBook = useSelector(state => state.data.dataByUrl[item.link]);
  const ComicDetail = useSelector(
    state => state.data.dataByUrl[detailPageLink],
  );
  const isComicDownload = Boolean(
    useSelector(
      state =>
        state?.data?.DownloadComic?.[detailPageLink]?.comicBooks?.[item?.link],
    ),
  );

  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  const numbersBookmarks = ComicBook?.BookmarkPages?.length;
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [progress, setProgress] = useState({downloaded: 0, total: 0});
  const dispatch = useDispatch();

  const handleClick = async () => {
    if (!isMacOS && crashlytics) {
      crashlytics().log('ChapterCard clicked');
    }
    if (!isMacOS && analytics) {
      await analytics.logEvent('newUI_open_comic_book', {
        link: item?.link?.toString(),
        title: item?.title?.toString(),
      });
    }

    if (getVersion() === forIosValue && forIosLoading === false) {
      navigate(NAVIGATION.mockBooks, {
        comicBookLink: item?.link,
        pageJump: 0,
      });
      return;
    }

    navigate(NAVIGATION.comicBook, {
      comicBookLink: item?.link,
      pageJump:
        ComicBook?.lastReadPage + 1 > 1 ? ComicBook?.lastReadPage + 1 : 0,
      isDownloadComic: isComicDownload,
      DetailsPage: {
        link: detailPageLink,
        title: ComicDetail?.title,
        imgSrc: ComicDetail?.imgSrc,
      },
    });
  };

  const LoadingComic = async () => {
    if (loadingStatus) return;
    setLoadingStatus(true);
    setProgress({downloaded: 0, total: 0});
    if (!isMacOS && crashlytics) {
      crashlytics().log('ChapterCard download clicked');
    }
    if (!isMacOS && analytics) {
      await analytics.logEvent('newUI_download_comic', {
        link: item?.link?.toString(),
        title: item?.title?.toString(),
      });
    }
    if (!ComicBook?.images) {
      let data = await dispatch(fetchComicBook(item.link, null, true));
      DownloadedComic(data.data);
      return;
    }
    DownloadedComic(ComicBook);
  };

  const DownloadedComic = async data => {
    if (!isMacOS && crashlytics) {
      crashlytics().log('ChapterCard download started');
    }
    if (!isMacOS && analytics) {
      await analytics.logEvent('newUI_download_started', {
        link: detailPageLink?.toString(),
        title: item?.title?.toString(),
      });
    }
    dispatch(
      downloadComicBook({
        comicDetails: {
          link: detailPageLink,
          title: ComicDetail?.title,
          imgSrc: ComicDetail?.imgSrc,
        },
        comicBook: {...data, link: item.link},
        setLoadingStatus,
        onProgress: (downloaded, total) => setProgress({downloaded, total}),
      }),
    );
  };

  if (isBookmark && !numbersBookmarks) return null;

  if (item.type === 'ad') {
    // Only show ads on non-macOS platforms
    if (!isMacOS && BannerAdSize) {
      return <AdBanner size={BannerAdSize.BANNER} />;
    }
    return null;
  }
  
  return (
    <TouchableOpacity
      key={index}
      style={{
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        minHeight: 44,
        paddingHorizontal: 8,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginHorizontal: 16,
        justifyContent: 'space-between',
      }}
      onPress={handleClick}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        <Text
          style={{
            color: '#eaebea',
            fontSize: 14,
            maxWidth:
              loadingStatus && progress
                ? widthPercentageToDP('30%')
                : widthPercentageToDP('40%'),
          }}>
          {item?.title}
        </Text>
        {item?.date ? (
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.5)',
            }}>
            {` · `}
            {item?.date}
          </Text>
        ) : null}
        {ComicBook?.lastReadPage || isBookmark ? (
          <>
            <Text style={{color: 'steelblue'}}>
              {!isBookmark && ComicBook?.lastReadPage + 1 > 1
                ? ` · (${ComicBook?.lastReadPage + 1}/${
                    ComicBook?.images.length
                  })`
                : ''}

              {isBookmark && numbersBookmarks
                ? ` · (${ComicBook?.BookmarkPages.map(
                    item => item + 1,
                  ).toString()})`
                : ''}
            </Text>
          </>
        ) : null}
      </View>
      {loadingStatus ? (
        <View style={{alignItems: 'center'}}>
          <ActivityIndicator size="small" color="skyblue" />
          <Text style={{fontSize: 12, color: '#fff', marginTop: 4}}>
            {progress.downloaded} / {progress.total}
          </Text>
        </View>
      ) : !isComicDownload ? (
        <Entypo
          name="download"
          size={24}
          color={'#fff'}
          onPress={() => {
            LoadingComic();
            if (!isMacOS) {
              showRewardedAd();
            }
          }}
        />
      ) : (
        <MaterialIcons
          name="offline-pin"
          size={24}
          color="green"
          onPress={() => {
            if (!isMacOS && crashlytics) {
              crashlytics().log('ChapterCard offline clicked');
            }
            if (!isMacOS && analytics) {
              analytics.logEvent('newUI_open_offline_comic', {
                link: item?.link?.toString(),
                title: item?.title?.toString(),
              });
            }
            navigate(NAVIGATION.offlineComic);
          }}
        />
      )}
    </TouchableOpacity>
  );
};

export default memo(ChapterCard);