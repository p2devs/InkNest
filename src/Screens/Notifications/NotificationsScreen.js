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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

import {NAVIGATION} from '../../Constants';
import {
  markNotificationAsRead,
  markSourceStatusNotificationRead,
  removeSourceStatusNotification,
} from '../../Redux/Reducers';
import {SafeAreaView} from 'react-native-safe-area-context';
import {fetchComicDetails} from '../../Redux/Actions/GlobalActions';
import {
  SOURCE_STATUS,
  formatLastChecked,
} from '../../Utils/sourceStatus';

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

const SourceStatusCard = ({item, onDismiss}) => {
  const getStatusConfig = () => {
    switch (item.status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return {
          icon: 'shield-alert',
          color: '#FF9500',
          bgColor: 'rgba(255, 149, 0, 0.15)',
          borderColor: 'rgba(255, 149, 0, 0.4)',
          title: 'Cloudflare Protection',
          description: `${item.sourceName} is blocking requests due to cloudflare bot protection.`,
        };
      case SOURCE_STATUS.SERVER_DOWN:
        return {
          icon: 'server-off',
          color: '#FF3B30',
          bgColor: 'rgba(255, 59, 48, 0.15)',
          borderColor: 'rgba(255, 59, 48, 0.4)',
          title: 'Server Down',
          description: `${item.sourceName} server is not responding.`,
        };
      default:
        return {
          icon: 'alert-circle',
          color: '#8E8E93',
          bgColor: 'rgba(142, 142, 147, 0.15)',
          borderColor: 'rgba(142, 142, 147, 0.4)',
          title: 'Source Error',
          description: `${item.sourceName} is experiencing issues.`,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      style={[
        styles.sourceStatusCard,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        !item.read && styles.sourceStatusCardUnread,
      ]}>
      <View style={styles.sourceStatusHeader}>
        <View style={styles.sourceStatusIconContainer}>
          <MaterialCommunityIcons
            name={config.icon}
            size={24}
            color={config.color}
          />
        </View>
        <View style={styles.sourceStatusTitleGroup}>
          <Text style={[styles.sourceStatusTitle, {color: config.color}]}>
            {config.title}
          </Text>
          <Text style={styles.sourceStatusSourceName}>{item.sourceName}</Text>
        </View>
        {!item.read ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={() => onDismiss(item.id)}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sourceStatusDescription}>{config.description}</Text>

      <View style={styles.sourceStatusFooter}>
        <View style={styles.sourceStatusMeta}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text style={styles.sourceStatusMetaText}>
            {formatLastChecked(item.timestamp)}
          </Text>
        </View>
        {item.statusCode && (
          <View style={styles.sourceStatusMeta}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={13}
              color={config.color}
            />
            <Text style={[styles.sourceStatusMetaText, {color: config.color}]}>
              Error {item.statusCode}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

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
  const sourceStatusNotifications = useSelector(
    state => state.data.sourceStatusNotifications || [],
  );
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
        type: 'community',
      };
    });
  }, [dataByUrl, notifications]);

  // Combine regular notifications with source status notifications
  const allNotifications = useMemo(() => {
    const sourceNotifications = sourceStatusNotifications.map(item => ({
      ...item,
      type: 'source_status',
    }));

    // Sort by timestamp (newest first)
    const combined = [...enhancedNotifications, ...sourceNotifications];
    combined.sort((a, b) => (b.timestamp || b.receivedAt) - (a.timestamp || a.receivedAt));

    return combined;
  }, [enhancedNotifications, sourceStatusNotifications]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter(item => !item.read).length;
  }, [allNotifications]);

  const sourceStatusUnreadCount = useMemo(() => {
    return sourceStatusNotifications.filter(item => !item.read).length;
  }, [sourceStatusNotifications]);

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

    if (
      (data.link || data.comicLink || data.detailLink) &&
      (data.title || data.comicTitle)
    ) {
      dispatch(
        fetchComicDetails(data.link || data.comicLink || data.detailLink, true),
      );
      return {
        name: NAVIGATION.comicDetails,
        params: {
          link: data.link || data.comicLink || data.detailLink,
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
    allNotifications.forEach(notification => {
      if (!notification.read) {
        if (notification.type === 'source_status') {
          dispatch(markSourceStatusNotificationRead(notification.id));
        } else {
          dispatch(markNotificationAsRead(notification.id));
        }
      }
    });
  }, [dispatch, allNotifications]);

  const handleDismissSourceStatus = useCallback(
    notificationId => {
      dispatch(removeSourceStatusNotification(notificationId));
    },
    [dispatch],
  );

  const renderItem = useCallback(
    ({item}) => {
      if (item.type === 'source_status') {
        return (
          <SourceStatusCard
            item={item}
            onDismiss={handleDismissSourceStatus}
          />
        );
      }
      return (
        <NotificationCard
          item={item}
          comicMeta={item.comicMeta}
          onPress={() => handlePress(item)}
        />
      );
    },
    [handlePress, handleDismissSourceStatus],
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={allNotifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View
              style={[
                styles.headerRow,
                {flex: 1, justifyContent: 'space-between'},
              ]}>
              <View>
                <Text style={styles.headerTitle}>Inbox</Text>
                <Text style={styles.headerSubtitle}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </Text>
                {sourceStatusUnreadCount > 0 && (
                  <Text style={styles.sourceStatusHint}>
                    {sourceStatusUnreadCount} source issue{sourceStatusUnreadCount > 1 ? 's' : ''} need attention
                  </Text>
                )}
              </View>
              <View style={styles.headerRow}>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    color: 'rgba(255, 255, 255, 1)',
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
  // Source status styles
  sourceStatusHint: {
    color: '#FF9500',
    fontSize: 11,
    marginTop: 4,
  },
  sourceStatusCard: {
    borderRadius: 14,
    padding: wp('4%'),
    marginHorizontal: wp('6%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  sourceStatusCardUnread: {
    borderWidth: 2,
  },
  sourceStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  sourceStatusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceStatusTitleGroup: {
    flex: 1,
  },
  sourceStatusTitle: {
    fontSize: hp('1.8%'),
    fontWeight: '700',
  },
  sourceStatusSourceName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: hp('1.5%'),
    marginTop: 2,
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  sourceStatusDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: hp('1.7%'),
    lineHeight: hp('2.4%'),
    marginBottom: hp('1.2%'),
  },
  sourceStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceStatusMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceStatusMetaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: hp('1.4%'),
  },
});
