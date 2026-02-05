import React, {memo} from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';

import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DescriptionView from '../../../../Components/UIComp/DescriptionView';
import {goBack} from '../../../../Navigation/NavigationService';
import {updateData} from '../../../../Redux/Reducers';
import {fetchComicDetails} from '../../../../Redux/Actions/GlobalActions';
import HeaderMenu from './HeaderMenu';

const HeaderComponent = memo(
  ({
    image,
    title,
    link,
    tabBar,
    onTabBar,
    notificationBell,
    onRequestLoginPrompt,
  }) => {
    const dispatch = useDispatch();
    const ComicDetail = useSelector(state => state.data.dataByUrl[link]);
    const bellBusy = notificationBell?.loading || notificationBell?.syncing;
    const bellDisabled = bellBusy || !notificationBell?.canToggle;
    const shouldRenderBell = !!notificationBell;

    // Format meta info into a single line with dot separators
    const formatMetaInfo = () => {
      const parts = [];
      
      if (ComicDetail?.releaseDate) {
        parts.push(ComicDetail.releaseDate);
      }
      
      if (Array.isArray(ComicDetail?.genres) && ComicDetail.genres.length > 0) {
        parts.push(ComicDetail.genres.slice(0, 2).join(', '));
      } else if (Array.isArray(ComicDetail?.tags) && ComicDetail.tags.length > 0) {
        parts.push(ComicDetail.tags.slice(0, 2).join(', '));
      }
      
      if (ComicDetail?.publisher) {
        parts.push(ComicDetail.publisher);
      }
      
      if (ComicDetail?.status) {
        parts.push(ComicDetail.status);
      }
      
      if (ComicDetail?.author || ComicDetail?.categories) {
        parts.push(`By - ${ComicDetail?.author || ComicDetail?.categories}`);
      }
      
      return parts.join(' · ');
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Curved background with blur */}
        <View style={styles.backgroundContainer}>
          <Image
            style={styles.backgroundImage}
            resizeMode="cover"
            source={{
              uri: ComicDetail?.imgSrc ?? image,
            }}
            blurRadius={40}
          />
          {/* Gradient overlay for better text readability */}
          <LinearGradient
            colors={['rgba(20, 20, 42, 0.3)', '#14142a']}
            style={styles.gradientOverlay}
          />
          {/* Curved bottom edge */}
          <View style={styles.curveContainer}>
            <View style={styles.curve} />
          </View>
        </View>

        <View style={styles.headerContainer}>
          {/* Custom header layout with equal width sections for perfect centering */}
          <View style={styles.customHeader}>
            {/* Left section - Back button */}
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => {
                  goBack();
                }}
                style={styles.iconButton}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color="#fff"
                  style={{opacity: 0.9}}
                />
              </TouchableOpacity>
            </View>

            {/* Center section - Title */}
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Comic Details</Text>
            </View>

            {/* Right section - Menu */}
            <View style={styles.headerRight}>
              <HeaderMenu
                notificationBell={notificationBell}
                onBookmark={() => {
                  dispatch(
                    updateData({
                      url: link,
                      data: {Bookmark: !ComicDetail?.Bookmark},
                    }),
                  );
                }}
                onRefresh={() => dispatch(fetchComicDetails(link, true))}
                isBookmarked={ComicDetail?.Bookmark}
                bellBusy={bellBusy}
                bellDisabled={bellDisabled}
                onRequestLoginPrompt={onRequestLoginPrompt}
              />
            </View>
          </View>

          {/* Horizontal Layout: Cover Image Left, Details Right */}
          <View style={styles.contentSection}>
            {/* Left - Cover Image */}
            <View style={styles.coverContainer}>
              <Image
                style={styles.coverImage}
                resizeMode="cover"
                source={{
                  uri: ComicDetail?.imgSrc ?? image,
                }}
              />
              {/* Shine effect overlay */}
              <View style={styles.shineOverlay} />
            </View>

            {/* Right - Comic Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.comicTitle} numberOfLines={2}>
                {ComicDetail?.title ?? title}
              </Text>

              {/* Meta Info */}
              <Text style={styles.metaText} numberOfLines={2}>
                {formatMetaInfo()}
              </Text>

              {/* Genre Tags */}
              {Array.isArray(ComicDetail?.genres) && ComicDetail.genres.length > 0 && (
                <View style={styles.genreContainer}>
                  {ComicDetail.genres.slice(0, 2).map((genre, idx) => (
                    <View key={idx} style={styles.genrePill}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Description - Below the horizontal layout */}
          {ComicDetail?.summary ? (
            <View style={styles.descriptionContainer}>
              <DescriptionView vol={ComicDetail?.summary} />
            </View>
          ) : null}

          {/* Tab Bar */}
          <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
              {tabBar.map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onTabBar(index);
                  }}
                  style={[styles.tabItem, tab.active && styles.tabItemActive]}>
                  <Text
                    style={[
                      styles.tabText,
                      tab.active && styles.tabTextActive,
                    ]}>
                    {tab.name}
                  </Text>
                  {tab.active && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#14142a',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: heightPercentageToDP('30%'),
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  curveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  curve: {
    width: '120%',
    height: 80,
    backgroundColor: '#14142a',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    position: 'absolute',
    bottom: 0,
    left: '-10%',
  },
  headerContainer: {
    position: 'relative',
    zIndex: 1,
  },
  customHeader: {
    width: '100%',
    height: heightPercentageToDP('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New horizontal layout styles
  contentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 16,
  },
  coverContainer: {
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  coverImage: {
    width: widthPercentageToDP('22%'),
    height: heightPercentageToDP('16%'),
    borderRadius: 8,
  },
  shineOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  comicTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 22,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 8,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  genrePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  tabBarContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#14142a',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: 'rgba(50, 104, 222, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabTextActive: {
    color: '#3268de',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#3268de',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
