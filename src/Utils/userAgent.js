import {Platform} from 'react-native';

/**
 * Shared User-Agent string.
 *
 * IMPORTANT (Cloudflare): the `cf_clearance` cookie Cloudflare issues after a
 * challenge is solved is bound to IP + User-Agent (+ TLS fingerprint). Whatever
 * User-Agent the WebView uses to SOLVE the challenge MUST be the exact same
 * User-Agent later sent by axios and by <Image> requests, otherwise Cloudflare
 * rejects the clearance cookie and re-challenges.
 *
 * This constant is the single source of truth for that UA. The Cloudflare spike
 * screen prefers the WebView's *real* runtime navigator.userAgent (captured live)
 * so the test isolates the TLS/cookie-store variable; this value is the stable
 * fallback and the UA the production feature should pin everywhere.
 */
export const SHARED_USER_AGENT =
  Platform.OS === 'ios'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
