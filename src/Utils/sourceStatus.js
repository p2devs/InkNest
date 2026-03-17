/**
 * Source Status Tracking Utilities
 *
 * Tracks the health status of content sources (comics, anime, manga)
 * and provides notifications for 403 (Cloudflare protection) and 500+ (server down) errors.
 */

import {mmkvStorage} from '../Redux/Storage/Storage';

export const SOURCE_STATUS_STORAGE_KEY = 'INKNEST_SOURCE_STATUS';

// Status types
export const SOURCE_STATUS = {
  WORKING: 'working',
  CLOUDFLARE_PROTECTED: 'cloudflare_protected', // 403
  SERVER_DOWN: 'server_down', // 500+
  UNKNOWN: 'unknown',
};

// Error codes
export const ERROR_CODES = {
  FORBIDDEN: 403,
  SERVER_ERROR_THRESHOLD: 500,
};

// Source type labels for display
export const SOURCE_LABELS = {
  // Comic sources
  readcomicsonline: 'Read Comics Online',
  comichubfree: 'Comic Hub Free',
  readallcomics: 'Read All Comics',
  comicbookplus: 'Comic Book Plus',
  azcomic: 'AZ Comic',
  // Anime sources
  gogoanimes: 'GoGo Animes',
  s3taku: 'S3 Taku',
  // Manga sources
  mangakatana: 'Manga Katana',
};

// Content type for sources
export const SOURCE_CONTENT_TYPE = {
  readcomicsonline: 'comic',
  comichubfree: 'comic',
  readallcomics: 'comic',
  comicbookplus: 'comic',
  azcomic: 'comic',
  gogoanimes: 'anime',
  s3taku: 'anime',
  mangakatana: 'manga',
};

/**
 * Get display label for a source key
 */
export const getSourceLabel = sourceKey => {
  return SOURCE_LABELS[sourceKey] || sourceKey;
};

/**
 * Get content type for a source key
 */
export const getSourceContentType = sourceKey => {
  return SOURCE_CONTENT_TYPE[sourceKey] || 'unknown';
};

/**
 * Determine source status from HTTP status code
 */
export const getStatusFromCode = statusCode => {
  if (!statusCode) {
    return SOURCE_STATUS.UNKNOWN;
  }

  if (statusCode === ERROR_CODES.FORBIDDEN) {
    return SOURCE_STATUS.CLOUDFLARE_PROTECTED;
  }

  if (statusCode >= ERROR_CODES.SERVER_ERROR_THRESHOLD) {
    return SOURCE_STATUS.SERVER_DOWN;
  }

  return SOURCE_STATUS.WORKING;
};

/**
 * Get user-friendly status message
 */
export const getStatusMessage = (status, sourceKey) => {
  const sourceName = getSourceLabel(sourceKey);

  switch (status) {
    case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
      return `${sourceName} is protected by Cloudflare bot detection. The source may be temporarily unavailable.`;
    case SOURCE_STATUS.SERVER_DOWN:
      return `${sourceName} server is currently down. Please try again later or switch to another source.`;
    case SOURCE_STATUS.WORKING:
      return `${sourceName} is working normally.`;
    default:
      return `Unable to determine ${sourceName} status.`;
  }
};

/**
 * Get short status message for notifications
 */
export const getShortStatusMessage = (status, sourceKey) => {
  const sourceName = getSourceLabel(sourceKey);

  switch (status) {
    case SOURCE_STATUS.CLOUDFLARE_PROTECTED:
      return `${sourceName}: Cloudflare protection active (403)`;
    case SOURCE_STATUS.SERVER_DOWN:
      return `${sourceName}: Server is down`;
    default:
      return `${sourceName}: Status unknown`;
  }
};

/**
 * Load stored source statuses from MMKV
 */
export const loadSourceStatuses = () => {
  try {
    const raw = mmkvStorage.getString(SOURCE_STATUS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading source statuses:', error);
    return {};
  }
};

/**
 * Persist source statuses to MMKV
 */
export const persistSourceStatuses = statuses => {
  try {
    mmkvStorage.set(SOURCE_STATUS_STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error('Error persisting source statuses:', error);
  }
};

/**
 * Update status for a single source
 */
export const updateSourceStatus = (sourceKey, status, statusCode = null) => {
  const statuses = loadSourceStatuses();
  const now = Date.now();

  statuses[sourceKey] = {
    status,
    statusCode,
    lastChecked: now,
    lastError: status !== SOURCE_STATUS.WORKING ? now : statuses[sourceKey]?.lastError || null,
    lastWorking: status === SOURCE_STATUS.WORKING ? now : statuses[sourceKey]?.lastWorking || null,
  };

  persistSourceStatuses(statuses);
  return statuses;
};

/**
 * Record a successful request for a source
 */
export const recordSourceSuccess = sourceKey => {
  return updateSourceStatus(sourceKey, SOURCE_STATUS.WORKING, null);
};

/**
 * Record an error for a source
 */
export const recordSourceError = (sourceKey, statusCode) => {
  const status = getStatusFromCode(statusCode);
  return updateSourceStatus(sourceKey, status, statusCode);
};

/**
 * Get status for a single source
 */
export const getSourceStatus = sourceKey => {
  const statuses = loadSourceStatuses();
  return statuses[sourceKey] || {
    status: SOURCE_STATUS.UNKNOWN,
    statusCode: null,
    lastChecked: null,
    lastError: null,
    lastWorking: null,
  };
};

/**
 * Get all source statuses
 */
export const getAllSourceStatuses = () => {
  return loadSourceStatuses();
};

/**
 * Clear all source statuses
 */
export const clearSourceStatuses = () => {
  persistSourceStatuses({});
};

/**
 * Format last checked time for display
 */
export const formatLastChecked = timestamp => {
  if (!timestamp) {
    return 'Never';
  }

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${days}d ago`;
};

/**
 * Check if a source should show a notification
 * Returns true if the source has an error status that should be notified
 */
export const shouldShowNotification = (sourceKey, currentStatus) => {
  const stored = getSourceStatus(sourceKey);

  // If no previous record, don't notify
  if (!stored.lastChecked) {
    return false;
  }

  // If current status is working, don't notify
  if (currentStatus === SOURCE_STATUS.WORKING) {
    return false;
  }

  // If status changed from working to error, notify
  if (stored.status === SOURCE_STATUS.WORKING) {
    return true;
  }

  // If error persists for more than 1 hour, notify again
  if (stored.lastError) {
    const oneHourAgo = Date.now() - 3600000;
    return stored.lastError > oneHourAgo;
  }

  return false;
};

/**
 * Get sources with errors for notification summary
 */
export const getSourcesWithErrors = () => {
  const statuses = loadSourceStatuses();
  const errors = {};

  Object.entries(statuses).forEach(([sourceKey, data]) => {
    if (
      data.status === SOURCE_STATUS.CLOUDFLARE_PROTECTED ||
      data.status === SOURCE_STATUS.SERVER_DOWN
    ) {
      errors[sourceKey] = data;
    }
  });

  return errors;
};

/**
 * Get working sources by content type
 */
export const getWorkingSourcesByType = contentType => {
  const statuses = loadSourceStatuses();
  const working = [];

  Object.entries(statuses).forEach(([sourceKey, data]) => {
    if (
      data.status === SOURCE_STATUS.WORKING &&
      SOURCE_CONTENT_TYPE[sourceKey] === contentType
    ) {
      working.push(sourceKey);
    }
  });

  return working;
};
