/**
 * Cloudflare clearance store + helpers.
 *
 * Some sources (currently readcomicsonline.ru) sit behind a Cloudflare
 * "Managed Challenge" that returns 403 to plain HTTP clients. The user solves
 * the challenge once in a WebView; afterwards we reuse that cleared session:
 *
 *   - Android: the WebView earns an HttpOnly `cf_clearance` cookie. We read it
 *     with CookieManager and replay it (+ a matching User-Agent) on axios and
 *     image requests. readcomicsonline.ru does NOT bind clearance to the TLS
 *     fingerprint, so replaying through okhttp works (verified on-device).
 *   - iOS: with `sharedCookiesEnabled`, WKWebView writes cf_clearance into the
 *     shared cookie store and NSURLSession auto-sends it. CookieManager can't
 *     read the HttpOnly cookie there, so we only pin the User-Agent and let the
 *     platform attach the cookie itself.
 *
 * The cookie is bound to the User-Agent, so the WebView, axios, and <Image>
 * MUST all use SHARED_USER_AGENT.
 */
import {Platform} from 'react-native';
import CookieManager from '@preeternal/react-native-cookie-manager';

import {mmkvStorage} from '../Redux/Storage/Storage';
import {SHARED_USER_AGENT} from './userAgent';

const STORAGE_KEY = 'INKNEST_CF_CLEARANCE';
// cf_clearance lives ~30 min; treat it as stale a little early to avoid races.
const CLEARANCE_TTL_MS = 25 * 60 * 1000;

// Hosts served behind an interactive Cloudflare challenge we can clear.
export const CF_PROTECTED_HOSTS = ['readcomicsonline.ru'];
export const CF_PRIMARY_HOST = 'readcomicsonline.ru';
export const CF_ORIGIN = 'https://readcomicsonline.ru';

/** True if the URL targets a Cloudflare-challenged host we manage clearance for. */
export const isCloudflareProtectedUrl = url =>
  typeof url === 'string' && CF_PROTECTED_HOSTS.some(host => url.includes(host));

const readStore = () => {
  try {
    const raw = mmkvStorage.getString(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const writeStore = data => {
  try {
    mmkvStorage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // best-effort persistence
  }
};

export const getClearanceRecord = (host = CF_PRIMARY_HOST) =>
  readStore()[host] || null;

/** Whether we hold a still-valid clearance for the host. */
export const hasFreshClearance = (host = CF_PRIMARY_HOST) => {
  const rec = getClearanceRecord(host);
  return Boolean(rec?.savedAt) && Date.now() - rec.savedAt < CLEARANCE_TTL_MS;
};

export const clearClearance = (host = CF_PRIMARY_HOST) => {
  const store = readStore();
  if (store[host]) {
    delete store[host];
    writeStore(store);
  }
};

/**
 * Read the cookies the WebView earned and persist the clearance.
 *
 * `ua` MUST be the WebView's real navigator.userAgent captured while solving —
 * cf_clearance is bound to it and Cloudflare distrusts a mismatched/spoofed UA,
 * so we replay the exact same UA rather than a pinned constant.
 *
 * Returns the stored record. Safe to call on both platforms.
 */
export const captureClearance = async (ua, host = CF_PRIMARY_HOST) => {
  const readFrom = async useWebKit => {
    try {
      return (await CookieManager.get(CF_ORIGIN, useWebKit)) || {};
    } catch (e) {
      return {};
    }
  };

  // Android has a single WebView cookie store. On iOS `cf_clearance` may live in
  // the WKWebView store AND/OR the shared NSHTTPCookieStorage (sharedCookiesEnabled
  // syncs between them) — read both and merge so we can inject it explicitly
  // rather than depending on NSURLSession auto-send timing after the WebView closes.
  const primary = await readFrom(Platform.OS === 'ios');
  const secondary = Platform.OS === 'ios' ? await readFrom(false) : {};
  const merged = {...secondary, ...primary};
  const cookieHeader = Object.entries(merged)
    .map(([name, cookie]) => `${name}=${cookie.value}`)
    .join('; ');

  // Only keep a cookie header if it actually carries the clearance token.
  const hasClearanceCookie = /(^|;\s*)cf_clearance=/.test(cookieHeader);
  const store = readStore();
  store[host] = {
    cookie: hasClearanceCookie ? cookieHeader : '',
    ua: ua || SHARED_USER_AGENT,
    savedAt: Date.now(),
    // iOS relies on the shared cookie store rather than an explicit header.
    auto: !hasClearanceCookie,
  };
  writeStore(store);
  return store[host];
};

/**
 * Headers to merge onto a request/image for a Cloudflare-protected URL.
 * Returns null for non-protected URLs so callers can skip untouched.
 */
export const getClearanceHeaders = url => {
  if (!isCloudflareProtectedUrl(url)) {
    return null;
  }
  const rec = getClearanceRecord();
  // Use the exact UA the clearance was solved with; fall back before any solve.
  const headers = {'User-Agent': rec?.ua || SHARED_USER_AGENT};
  if (rec?.cookie) {
    headers.Cookie = rec.cookie;
  }
  return headers;
};

/**
 * Convenience for image sources: returns a react-native Image `source` object
 * with clearance headers when the URI is protected, else a plain {uri}.
 */
export const withClearanceImageSource = uri => {
  const headers = getClearanceHeaders(uri);
  return headers ? {uri, headers} : {uri};
};
