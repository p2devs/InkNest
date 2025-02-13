import React, {memo, useState} from 'react';
import {TouchableOpacity, Text, View, ActivityIndicator} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {BannerAdSize} from 'react-native-google-mobile-ads';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import Entypo from 'react-native-vector-icons/Entypo';

import {navigate} from '../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../Constants';
import AdBanner from '../../../InkNest-Externals/Ads/BannerAds';
import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import {
  downloadComicBook,
  showRewardedAd,
} from '../../../InkNest-Externals/Redux/Actions/Download';

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

  const numbersBookmarks = ComicBook?.BookmarkPages?.length;
  const [LoadingStatus, setLoadStatus] = useState(false);
  const [progress, setProgress] = useState({downloaded: 0, total: 0});
  const dispatch = useDispatch();

  const handleClick = async () => {
    crashlytics().log('ChapterCard clicked');
    await analytics().logEvent('newUI_open_comic_book', {
      link: item?.link?.toString(),
      title: item?.title?.toString(),
    });
    navigate(NAVIGATION.comicBook, {
      comicBookLink: item?.link,
    });
  };

  const LoadingComic = async () => {
    if (LoadingStatus) return;
    setLoadStatus(true);
    setProgress({downloaded: 0, total: 0});
    crashlytics().log('ChapterCard download clicked');
    await analytics().logEvent('newUI_download_comic', {
      link: item?.link?.toString(),
      title: item?.title?.toString(),
    });
    if (!ComicBook?.images) {
      let data = await dispatch(fetchComicBook(item.link, null, true));
      DownloadedComic(data.data);
      return;
    }
    DownloadedComic(ComicBook);
  };

  const DownloadedComic = async data => {
    crashlytics().log('ChapterCard download started');
    await analytics().logEvent('newUI_download_started', {
      link: detailPageLink?.toString(),
      title: item?.title?.toString(),
    });
    dispatch(
      downloadComicBook({
        comicDetails: {
          link: detailPageLink,
          title: ComicDetail?.title,
          imgSrc: ComicDetail?.imgSrc,
        },
        comicBook: {...data, link: item.link},
        setLoadStatus,
        onProgress: (downloaded, total) => setProgress({downloaded, total}),
      }),
    );
  };

  if (isBookmark && !numbersBookmarks) return null;

  if (item.type === 'ad') return <AdBanner size={BannerAdSize.BANNER} />;
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
              LoadingStatus && progress
                ? widthPercentageToDP('30%')
                : widthPercentageToDP('50%'),
          }}>
          {item?.title}
        </Text>
        {item?.date ? (
          <Text
            style={{
              fontSize: 14,
              color: '#4b4b5f',
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
      {LoadingStatus ? (
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
            showRewardedAd();
          }}
        />
      ) : (
        <MaterialIcons
          name="offline-pin"
          size={24}
          color="green"
          onPress={() => {
            crashlytics().log('ChapterCard offline clicked');
            analytics().logEvent('newUI_open_offline_comic', {
              link: item?.link?.toString(),
              title: item?.title?.toString(),
            });
            navigate(NAVIGATION.offlineComic);
          }}
        />
      )}
    </TouchableOpacity>
  );
};

export default memo(ChapterCard);
