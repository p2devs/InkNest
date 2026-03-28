import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  markSourceStatusNotificationRead,
  removeSourceStatusNotification,
  clearSourceStatusNotifications,
} from '../../Redux/Reducers';
import {SOURCE_STATUS, formatLastChecked} from '../../Utils/sourceStatus';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Component to display source status notifications
 * Shows which sources have 403 (Cloudflare) or 500+ (server down) errors
 */
const SourceStatusNotification = ({onClose}) => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    state => state.data.sourceStatusNotifications || [],
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return null;
  }

  const handleMarkAsRead = notificationId => {
    dispatch(markSourceStatusNotificationRead(notificationId));
  };

  const handleDismiss = notificationId => {
    dispatch(removeSourceStatusNotification(notificationId));
  };

  const handleClearAll = () => {
    dispatch(clearSourceStatusNotifications());
    if (onClose) {
      onClose();
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return 'shield-alert';
      case SOURCE_STATUS.SERVER_DOWN:
        return 'server-off';
      default:
        return 'alert-circle';
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return '#FF9500'; // Orange for Cloudflare
      case SOURCE_STATUS.SERVER_DOWN:
        return '#FF3B30'; // Red for server down
      default:
        return '#8E8E93';
    }
  };

  const getStatusTitle = status => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return 'Cloudflare Protection Active';
      case SOURCE_STATUS.SERVER_DOWN:
        return 'Server Down';
      default:
        return 'Source Error';
    }
  };

  const getStatusDescription = (status, sourceName) => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return `${sourceName} is blocking requests due to cloudflare bot protection. Try switching to another source.`;
      case SOURCE_STATUS.SERVER_DOWN:
        return `${sourceName} server is not responding. The source may be temporarily unavailable.`;
      default:
        return `${sourceName} is experiencing issues.`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="alert-circle" size={20} color="#FF9500" />
          <Text style={styles.headerTitle}>Source Status</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {notifications.map(notification => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.read && styles.unreadItem,
            ]}
            onPress={() => handleMarkAsRead(notification.id)}
            activeOpacity={0.7}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: getStatusColor(notification.status) + '20'},
              ]}>
              <Icon
                name={getStatusIcon(notification.status)}
                size={24}
                color={getStatusColor(notification.status)}
              />
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.sourceName}>
                  {notification.sourceName || notification.sourceKey}
                </Text>
                <Text style={styles.statusText}>
                  {getStatusTitle(notification.status)}
                </Text>
              </View>

              <Text style={styles.description}>
                {getStatusDescription(
                  notification.status,
                  notification.sourceName || notification.sourceKey,
                )}
              </Text>

              <View style={styles.footer}>
                <Text style={styles.timestamp}>
                  Last checked: {formatLastChecked(notification.timestamp)}
                </Text>
                {notification.statusCode && (
                  <Text style={styles.errorCode}>
                    Error: {notification.statusCode}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismiss(notification.id)}>
              <Icon name="close" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#0A84FF',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    maxHeight: 320,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  unreadItem: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: '#ABABAB',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#636366',
  },
  errorCode: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default SourceStatusNotification;