import {useSelector, useDispatch} from 'react-redux';
import {useCallback, useEffect, useState} from 'react';
import {
  markSourceStatusNotificationRead,
  removeSourceStatusNotification,
  clearSourceStatusNotifications,
} from '../Redux/Reducers';
import {
  getSourceStatus,
  getAllSourceStatuses,
  SOURCE_STATUS,
  formatLastChecked,
  getSourceLabel,
} from '../Utils/sourceStatus';

/**
 * Custom hook to access and manage source status notifications
 */
export const useSourceStatusNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    state => state.data.sourceStatusNotifications || [],
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasNotifications = notifications.length > 0;

  const markAsRead = useCallback(
    notificationId => {
      dispatch(markSourceStatusNotificationRead(notificationId));
    },
    [dispatch],
  );

  const dismiss = useCallback(
    notificationId => {
      dispatch(removeSourceStatusNotification(notificationId));
    },
    [dispatch],
  );

  const clearAll = useCallback(() => {
    dispatch(clearSourceStatusNotifications());
  }, [dispatch]);

  return {
    notifications,
    unreadCount,
    hasNotifications,
    markAsRead,
    dismiss,
    clearAll,
  };
};

/**
 * Custom hook to check the status of a specific source
 */
export const useSourceStatus = sourceKey => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (sourceKey) {
      const sourceStatus = getSourceStatus(sourceKey);
      setStatus(sourceStatus);
    }
  }, [sourceKey]);

  const isWorking = status?.status === SOURCE_STATUS.WORKING;
  const isCloudflareProtected =
    status?.status === SOURCE_STATUS.CLOUDFLARE_PROTECTED;
  const isDown = status?.status === SOURCE_STATUS.SERVER_DOWN;
  const hasError = isCloudflareProtected || isDown;

  return {
    status,
    isWorking,
    isCloudflareProtected,
    isDown,
    hasError,
    lastChecked: status?.lastChecked ? formatLastChecked(status.lastChecked) : 'Never',
    sourceName: getSourceLabel(sourceKey),
  };
};

/**
 * Custom hook to get all source statuses
 */
export const useAllSourceStatuses = () => {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const allStatuses = getAllSourceStatuses();
    setStatuses(allStatuses);
  }, []);

  const workingSources = Object.entries(statuses)
    .filter(([_, data]) => data.status === SOURCE_STATUS.WORKING)
    .map(([key]) => key);

  const errorSources = Object.entries(statuses)
    .filter(
      ([_, data]) =>
        data.status === SOURCE_STATUS.CLOUDFLARE_PROTECTED ||
        data.status === SOURCE_STATUS.SERVER_DOWN,
    )
    .map(([key, data]) => ({
      key,
      ...data,
      name: getSourceLabel(key),
    }));

  return {
    statuses,
    workingSources,
    errorSources,
    hasErrors: errorSources.length > 0,
  };
};

/**
 * Custom hook to show source status toast notifications
 */
export const useSourceStatusToast = () => {
  const [toast, setToast] = useState(null);
  const notifications = useSelector(
    state => state.data.sourceStatusNotifications || [],
  );

  useEffect(() => {
    // Show toast for new unread notifications
    const latestUnread = notifications.find(n => !n.read);
    if (latestUnread && latestUnread.timestamp > Date.now() - 5000) {
      setToast({
        sourceKey: latestUnread.sourceKey,
        sourceName: latestUnread.sourceName,
        status: latestUnread.status,
        statusCode: latestUnread.statusCode,
      });

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    hideToast,
  };
};

export default useSourceStatusNotifications;