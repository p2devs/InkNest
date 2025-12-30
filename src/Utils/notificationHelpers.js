import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_STORAGE_KEY = 'INKNEST_COMMUNITY_NOTIFICATIONS';
const MAX_NOTIFICATIONS = 50;

export const tryParseJSON = value => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
};

export const buildNotificationPayload = (remoteMessage, autoRead = false) => {
  if (!remoteMessage) {
    return null;
  }

  const now = Date.now();
  const rawData = remoteMessage.data || {};
  const normalizedData = Object.keys(rawData).reduce((acc, key) => {
    acc[key] = tryParseJSON(rawData[key]);
    return acc;
  }, {});

  return {
    id: remoteMessage.messageId || normalizedData.notificationId || `${now}`,
    title:
      remoteMessage.notification?.title ||
      normalizedData.title ||
      'New notification',
    body: remoteMessage.notification?.body || normalizedData.body || '',
    data: normalizedData,
    receivedAt: now,
    read: autoRead,
  };
};

const toArray = value => (Array.isArray(value) ? value : []);

export const loadStoredNotifications = async () => {
  const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw);
  return toArray(parsed);
};

export const consumeStoredNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    const parsed = JSON.parse(raw);
    return toArray(parsed);
  } catch (error) {
    return [];
  }
};

export const persistNotificationList = async list => {
  console.log('List:', list);
  await AsyncStorage.setItem(
    NOTIFICATION_STORAGE_KEY,
    JSON.stringify(toArray(list)),
  );
};

export const mergeNotificationLists = (incomingPayload, baseList = []) => {
  if (!incomingPayload?.id) {
    return toArray(baseList);
  }
  return [
    incomingPayload,
    ...toArray(baseList).filter(item => item.id !== incomingPayload.id),
  ].slice(0, MAX_NOTIFICATIONS);
};

export const appendNotificationToStorage = async payload => {
  if (!payload?.id) {
    return [];
  }
  try {
    const stored = await loadStoredNotifications();
    console.log('Stored:', stored);
    const merged = mergeNotificationLists(payload, stored);
    console.log('Merged:', merged);
    await persistNotificationList(merged);
    return merged;
  } catch (error) {
    await persistNotificationList([payload]);
    return [payload];
  }
};
