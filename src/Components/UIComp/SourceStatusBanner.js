import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SOURCE_STATUS, formatLastChecked} from '../../Utils/sourceStatus';

/**
 * Inline banner component to show source status errors
 * Use this for immediate feedback when a source returns 403 or 500+
 */
const SourceStatusBanner = ({
  sourceKey,
  sourceName,
  status,
  statusCode,
  lastChecked,
  onDismiss,
  onSwitchSource,
  showActions = true,
}) => {
  if (!status || status === SOURCE_STATUS.WORKING) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return {
          icon: 'shield-alert',
          color: '#FF9500',
          backgroundColor: 'rgba(255, 149, 0, 0.15)',
          title: 'Cloudflare Protection',
          message: `${sourceName || sourceKey} is blocking requests due to cloudflare bot protection.`,
        };
      case SOURCE_STATUS.SERVER_DOWN:
        return {
          icon: 'server-off',
          color: '#FF3B30',
          backgroundColor: 'rgba(255, 59, 48, 0.15)',
          title: 'Server Down',
          message: `${sourceName || sourceKey} server is not responding.`,
        };
      default:
        return {
          icon: 'alert-circle',
          color: '#8E8E93',
          backgroundColor: 'rgba(142, 142, 147, 0.15)',
          title: 'Source Error',
          message: `${sourceName || sourceKey} is experiencing issues.`,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, {backgroundColor: config.backgroundColor}]}>
      <View style={styles.iconContainer}>
        <Icon name={config.icon} size={24} color={config.color} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, {color: config.color}]}>
            {config.title}
          </Text>
          {statusCode && (
            <Text style={styles.errorCode}>({statusCode})</Text>
          )}
        </View>
        <Text style={styles.message}>{config.message}</Text>
        {lastChecked && (
          <Text style={styles.lastChecked}>
            Last checked: {formatLastChecked(lastChecked)}
          </Text>
        )}
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          {onSwitchSource && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={onSwitchSource}>
              <Icon name="swap-horizontal" size={20} color="#0A84FF" />
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Icon name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Compact version for use in headers or smaller spaces
 */
export const SourceStatusBadge = ({status, onPress}) => {
  if (!status || status === SOURCE_STATUS.WORKING) {
    return null;
  }

  const getColor = () => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return '#FF9500';
      case SOURCE_STATUS.SERVER_DOWN:
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.badgeContainer, {borderColor: getColor()}]}
      onPress={onPress}>
      <Icon name="alert-circle" size={14} color={getColor()} />
      <Text style={[styles.badgeText, {color: getColor()}]}>
        {status === SOURCE_STATUS.CLOUDFLARE_PROTECTED ? '403' : 'Down'}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Toast-style notification for source errors
 */
export const SourceStatusToast = ({
  visible,
  sourceName,
  status,
  onDismiss,
  autoHide = true,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (visible && autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoHide, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  const getMessage = () => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return `${sourceName}: Cloudflare protection active (403)`;
      case SOURCE_STATUS.SERVER_DOWN:
        return `${sourceName}: Server is down`;
      default:
        return `${sourceName}: Error`;
    }
  };

  const getColor = () => {
    switch (status) {
      case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
        return '#FF9500';
      case SOURCE_STATUS.SERVER_DOWN:
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <View style={[styles.toastContainer, {borderLeftColor: getColor()}]}>
      <Icon
        name={status === SOURCE_STATUS.CLOUDFLARE_PROTECTED ? 'shield-alert' : 'server-off'}
        size={20}
        color={getColor()}
      />
      <Text style={styles.toastMessage}>{getMessage()}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.toastDismiss}>
          <Icon name="close" size={16} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorCode: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6,
  },
  message: {
    fontSize: 13,
    color: '#ABABAB',
    lineHeight: 18,
  },
  lastChecked: {
    fontSize: 11,
    color: '#636366',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  switchButton: {
    padding: 8,
    marginRight: 4,
  },
  dismissButton: {
    padding: 8,
  },
  // Badge styles
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Toast styles
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  toastDismiss: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SourceStatusBanner;