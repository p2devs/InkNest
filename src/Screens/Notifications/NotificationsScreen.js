import React, {useCallback, useMemo} from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import {NAVIGATION} from '../../Constants';
import {markNotificationAsRead} from '../../Redux/Reducers';
import {SafeAreaView} from 'react-native-safe-area-context';

const formatTimestamp = ts => {
  if (!ts) {
    return '';
  }
  try {
    const date = new Date(ts);
    return date.toLocaleString();
  } catch (error) {
    return '';
  }
};

const formatRelativeTime = ts => {
  if (!ts) {
    return '';
  }
  const diffMs = Date.now() - ts;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const normalizeLink = link => (link ? link.split('?')[0] : '');

const NotificationCard = ({item, comicMeta, onPress}) => {
  const showComicMeta = Boolean(comicMeta?.title || comicMeta?.imgSrc);
  const coverImage =
    comicMeta?.imgSrc || comicMeta?.image || comicMeta?.coverImage;
  const categoryLabel =
    item?.data?.category || item?.data?.type || comicMeta?.title || 'Alert';

  return (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      activeOpacity={0.8}
      onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Text style={styles.titleText} numberOfLines={1}>
            {item.title || comicMeta?.title || 'Notification'}
          </Text>
          {!item.read ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.receivedAt)}</Text>
      </View>
      <Text style={styles.bodyText} numberOfLines={3}>
        {item.body || 'Open to view details'}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="pricetag-outline" size={13} color="#9FA8DA" />
          <Text style={styles.metaChipText} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={13} color="#9FA8DA" />
          <Text style={styles.metaChipText}>
            {formatRelativeTime(item.receivedAt)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          color="rgba(255,255,255,0.5)"
        />
      </View>
      {showComicMeta ? (
        <View style={styles.comicMetaContainer}>
          {coverImage ? (
            <Image source={{uri: coverImage}} style={styles.comicCover} />
          ) : (
            <View style={[styles.comicCover, styles.comicCoverPlaceholder]}>
              <Ionicons name="book-outline" size={20} color="#fff" />
            </View>
          )}
          <View style={styles.comicInfo}>
            <Text style={styles.comicTitle} numberOfLines={1}>
              {comicMeta?.title}
            </Text>
            {comicMeta?.author ? (
              <Text style={styles.comicSubTitle} numberOfLines={1}>
                {comicMeta.author}
              </Text>
            ) : null}
            {comicMeta?.status ? (
              <Text style={styles.comicSubTitle} numberOfLines={1}>
                {comicMeta.status}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const NotificationsScreen = ({navigation}) => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.data.notifications || []);
  const dataByUrl = useSelector(state => state.data.dataByUrl || {});

  const enhancedNotifications = useMemo(() => {
    return notifications.map(notification => {
      const primaryLink =
        notification?.data?.comicLink || notification?.data?.link || '';
      const normalizedLink = normalizeLink(primaryLink);
      const comicMeta =
        dataByUrl[primaryLink] ||
        dataByUrl[normalizedLink] ||
        dataByUrl[notification?.data?.detailsLink || ''] ||
        null;

      return {
        ...notification,
        comicMeta,
      };
    });
  }, [dataByUrl, notifications]);

  const unreadCount = useMemo(() => {
    return enhancedNotifications.filter(item => !item.read).length;
  }, [enhancedNotifications]);

  const handleNavigationForNotification = useCallback(item => {
    if (!item?.data) {
      return null;
    }

    const data = item.data;
    if (data.postId && data.comicLink) {
      return {
        name: NAVIGATION.PostDetail,
        params: {
          comicLink: data.comicLink,
          postId: data.postId,
          initialPost:
            typeof data.initialPost === 'string'
              ? (() => {
                  try {
                    return JSON.parse(data.initialPost);
                  } catch (error) {
                    return null;
                  }
                })()
              : data.initialPost || null,
        },
      };
    }

    if ((data.link || data.comicLink) && (data.title || data.comicTitle)) {
      return {
        name: NAVIGATION.comicDetails,
        params: {
          link: data.link || data.comicLink,
          title: data.title || data.comicTitle || item.title,
          image: data.image || data.coverImage || null,
        },
      };
    }

    if (data.screen) {
      return {
        name: data.screen,
        params:
          typeof data.params === 'string'
            ? (() => {
                try {
                  return JSON.parse(data.params);
                } catch (error) {
                  return {};
                }
              })()
            : data.params || {},
      };
    }

    return null;
  }, []);

  const handlePress = useCallback(
    item => {
      const target = handleNavigationForNotification(item);
      if (target) {
        try {
          navigation.navigate(target.name, target.params);
        } catch (error) {
          crashlytics().recordError(error);
        }
      }
      dispatch(markNotificationAsRead(item.id));
    },
    [dispatch, handleNavigationForNotification, navigation],
  );

  const handleMarkAllRead = useCallback(() => {
    enhancedNotifications.forEach(notification => {
      if (!notification.read) {
        dispatch(markNotificationAsRead(notification.id));
      }
    });
  }, [dispatch, enhancedNotifications]);

  const renderItem = useCallback(
    ({item}) => (
      <NotificationCard
        item={item}
        comicMeta={item.comicMeta}
        onPress={() => handlePress(item)}
      />
    ),
    [handlePress],
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={enhancedNotifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <View style={styles.navRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerEyebrow}>Inbox</Text>
            </View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Alerts</Text>
                <Text style={styles.headerSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </Text>
              </View>
              {unreadCount > 0 ? (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  style={styles.headerAction}
                  activeOpacity={0.9}>
                  <Text style={styles.headerActionText}>Mark all read</Text>
                </TouchableOpacity>
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color="#6BE0B1"
                />
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#6B666D"
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
              We'll keep this space updated whenever new alerts arrive.
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={false} tintColor="#fff" />}
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142A',
  },
  headerWrapper: {
    paddingHorizontal: wp('6%'),
    paddingBottom: hp('1.5%'),
    paddingTop: hp('2%'),
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  backButton: {
    marginRight: 12,
  },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontSize: hp('1.6%'),
    letterSpacing: 1.1,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: hp('0.5%'),
    fontSize: 12,
  },
  headerAction: {
    backgroundColor: 'rgba(119,137,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  headerActionText: {
    color: '#AFC4FF',
    fontSize: hp('1.6%'),
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: wp('4%'),
    marginHorizontal: wp('6%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  cardUnread: {
    borderColor: 'rgba(86,129,255,0.6)',
    backgroundColor: 'rgba(86,129,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: '700',
    flex: 1,
  },
  newBadge: {
    backgroundColor: 'rgba(111,150,255,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    color: '#90A8FF',
    fontSize: hp('1.2%'),
    fontWeight: '700',
  },
  timestamp: {
    fontSize: hp('1.5%'),
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 12,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: hp('1.8%'),
    lineHeight: hp('2.5%'),
    marginBottom: hp('1.2%'),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp('0.8%'),
    gap: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metaChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: hp('1.5%'),
    marginLeft: 6,
  },
  comicMetaContainer: {
    flexDirection: 'row',
    marginTop: hp('1.8%'),
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
  },
  comicCover: {
    width: wp('12%'),
    height: hp('9%'),
    borderRadius: 8,
    marginRight: 12,
  },
  comicCoverPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comicInfo: {
    flex: 1,
  },
  comicTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: hp('1.8%'),
    marginBottom: 4,
  },
  comicSubTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: hp('1.5%'),
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: wp('8%'),
  },
  emptyTitle: {
    color: '#fff',
    fontSize: hp('2.2%'),
    fontWeight: '600',
    marginTop: hp('2%'),
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: hp('1.8%'),
    marginTop: hp('1%'),
  },
});
