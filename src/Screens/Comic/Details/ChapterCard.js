import React, {memo, useState} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {useFeatureFlag} from 'configcat-react';
import {getVersion} from 'react-native-device-info';
import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {BannerAdSize} from 'react-native-google-mobile-ads';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  widthPercentageToDP,
  heightPercentageToDP,
} from 'react-native-responsive-screen';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {navigate} from '../../../Navigation/NavigationService';
import {NAVIGATION} from '../../../Constants';
import AdBanner from '../../../InkNest-Externals/Ads/BannerAds';
import {fetchComicBook} from '../../../Redux/Actions/GlobalActions';
import {
  downloadComicBook,
  showRewardedAd,
} from '../../../InkNest-Externals/Redux/Actions/Download';

const ChapterCard = ({item, index, isBookmark, detailPageLink, isFirst}) => {
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
    crashlytics().log('ChapterCard clicked');
    await analytics().logEvent('newUI_open_comic_book', {
      link: item?.link?.toString(),
      title: item?.title?.toString(),
    });

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
        comicBook: {...data, ...item},
        setLoadingStatus,
        onProgress: (downloaded, total) => setProgress({downloaded, total}),
      }),
    );
  };

  // Calculate reading progress
  const readingProgress = ComicBook?.lastReadPage
    ? ((ComicBook.lastReadPage + 1) / (ComicBook.images?.length || 1)) * 100
    : 0;
  const hasStartedReading = ComicBook?.lastReadPage >= 0;
  const totalPages = ComicBook?.images?.length || 0;
  const currentPage = (ComicBook?.lastReadPage || 0) + 1;

  if (isBookmark && !numbersBookmarks) return null;

  if (item.type === 'ad') return <AdBanner size={BannerAdSize.BANNER} />;

  return (
    <TouchableOpacity
      key={index}
      style={[styles.container, isFirst && styles.firstCard]}
      onPress={handleClick}
      activeOpacity={0.8}>
      <View style={styles.contentWrapper}>
        {/* Left side - Chapter info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {item?.title}
          </Text>

          <View style={styles.metaRow}>
            {item?.date ? (
              <Text style={styles.dateText}>{item?.date}</Text>
            ) : null}

            {hasStartedReading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, {width: `${readingProgress}%`}]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentPage}/{totalPages}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.actionsContainer}>
          {/* Bookmark indicator */}
          {isBookmark && numbersBookmarks > 0 && (
            <View style={styles.bookmarkBadge}>
              <FontAwesome6
                name="book-bookmark"
                size={12}
                color="#FFD700"
              />
              <Text style={styles.bookmarkCount}>{numbersBookmarks}</Text>
            </View>
          )}

          {/* Download/Offline button */}
          {loadingStatus ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3268de" />
              <Text style={styles.progressNumbers}>
                {progress.downloaded}/{progress.total}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isComicDownload && styles.actionButtonDownloaded,
              ]}
              onPress={() => {
                if (isComicDownload) {
                  crashlytics().log('ChapterCard offline clicked');
                  analytics().logEvent('newUI_open_offline_comic', {
                    link: item?.link?.toString(),
                    title: item?.title?.toString(),
                  });
                  navigate(NAVIGATION.offlineComic);
                } else {
                  LoadingComic();
                  showRewardedAd();
                }
              }}
              activeOpacity={0.7}>
              {isComicDownload ? (
                <MaterialIcons name="offline-pin" size={20} color="#4CAF50" />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={18}
                  color="rgba(255,255,255,0.7)"
                />
              )}
            </TouchableOpacity>
          )}

          {/* Chevron for navigation hint */}
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.3)"
            style={styles.chevron}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  firstCard: {
    marginTop: 8,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 64,
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#eaebea',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBar: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3268de',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookmarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  bookmarkCount: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDownloaded: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  progressNumbers: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
  },
});

export default memo(ChapterCard);
