/**
 * WebView navigate-and-read proxy.
 *
 * readcomicsonline.ru challenges plain HTTP replays (native client → 403) AND
 * even in-page fetch() to its HTML pages (a JS fetch can't execute Cloudflare's
 * JS challenge). Only a real page NAVIGATION solves the challenge. So we drive a
 * persistent hidden WebView: navigate it to each requested URL, let the browser
 * auto-solve (its cookie jar already holds cf_clearance from the initial load),
 * then read the rendered HTML (documentElement.outerHTML) back over postMessage.
 *
 * Requests are serialized (one navigation at a time). GET reloads/navigates;
 * POST (advanced-search) submits a hidden form so it navigates too. Reads are
 * driven by load-end events, so we never read a stale same-path page.
 *
 * Images are NOT proxied — they're on the open cdn.readcomicsonline.ru.
 */

let webRef = null;
let busy = false;
let current = null;
const queue = [];

export const setProxyRef = ref => {
  webRef = ref;
  if (ref) {
    pump();
  }
};

// "Ready" == mounted: navigation solves the challenge per-request, so we don't
// gate on a cleared cookie the way native cookie-replay had to.
export const isProxyReady = () => Boolean(webRef);
export const getCurrentUrl = () => current?.url || null;
export const hasPending = () => Boolean(current);

const normPath = u => {
  try {
    const m = String(u).match(/^https?:\/\/[^/]+(\/[^?#]*)?/i);
    let p = (m && m[1]) || '/';
    if (p.length > 1 && p.endsWith('/')) {
      p = p.slice(0, -1);
    }
    return p.toLowerCase();
  } catch (e) {
    return '/';
  }
};

const escapeAttr = v =>
  String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const parseForm = body => {
  const out = [];
  String(body || '')
    .split('&')
    .filter(Boolean)
    .forEach(pair => {
      const i = pair.indexOf('=');
      const k = decodeURIComponent(pair.slice(0, i));
      const v = decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
      out.push(`<input type="hidden" name="${escapeAttr(k)}" value="${escapeAttr(v)}">`);
    });
  return out.join('');
};

/** Queue a request; resolves to {status, data:htmlString}. */
export const webviewRequest = (url, {method = 'GET', body = null} = {}) =>
  new Promise((resolve, reject) => {
    queue.push({url, method: String(method).toUpperCase(), body, resolve, reject});
    pump();
  });

const pump = () => {
  if (busy || !webRef || queue.length === 0) {
    return;
  }
  busy = true;
  current = queue.shift();
  current.timer = setTimeout(() => settle(null, 'CF proxy timeout'), 30000);

  const {url, method, body} = current;
  if (method === 'POST') {
    const inputs = parseForm(body);
    webRef.injectJavaScript(`(function(){
      try {
        var f=document.createElement('form');
        f.method='POST'; f.action=${JSON.stringify(url)};
        f.innerHTML=${JSON.stringify(inputs)};
        document.body.appendChild(f); f.submit();
      } catch(e) {}
    })(); true;`);
  } else {
    // Always force a load so onLoadEnd fires (a same-URL href assignment is a
    // no-op in the browser, which would strand the read).
    webRef.injectJavaScript(`(function(){
      try {
        if (location.href === ${JSON.stringify(url)}) { location.reload(); }
        else { location.href = ${JSON.stringify(url)}; }
      } catch(e) {}
    })(); true;`);
  }
};

const CHALLENGE_JS = `(!!(window._cf_chl_opt) || document.title === 'Just a moment...' ||
  !!document.querySelector('#challenge-form, #cf-challenge-running, script[src*="challenge-platform"]'))`;

/**
 * A page finished loading. If it's the page we're waiting for and not a
 * challenge, read its HTML back. Called on every onLoadEnd; the challenge guard
 * makes it wait through the auto-solve reload.
 */
export const notifyLoadEnd = () => {
  if (!current || !webRef) {
    return;
  }
  webRef.injectJavaScript(`(function(){
    try {
      if (${CHALLENGE_JS}) { return; }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        __cfpage: true, url: location.href, html: document.documentElement.outerHTML
      }));
    } catch(e) {}
  })(); true;`);
};

/** Deliver read HTML for the active request (ignored if it's for a stale page). */
export const deliverPage = (url, html) => {
  if (!current) {
    return;
  }
  if (normPath(url) !== normPath(current.url)) {
    return; // a still-loading page reported early; wait for the right one
  }
  settle(html, null);
};

const settle = (html, error) => {
  if (!current) {
    return;
  }
  clearTimeout(current.timer);
  const c = current;
  current = null;
  busy = false;
  if (error) {
    c.reject(new Error(error));
  } else {
    c.resolve({status: 200, data: html});
  }
  pump();
};

/**
 * Reload the proxy WebView from the origin. Called after the user completes a
 * manual verification so the proxy re-reads the origin with the fresh
 * cf_clearance cookie and drops any stuck challenge state.
 */
export const reloadProxy = () => {
  failAllPending('CF proxy reloading');
  if (webRef) {
    try {
      webRef.reload();
    } catch (e) {
      // best-effort
    }
  }
};

/** Reject all in-flight/queued requests (e.g. proxy unmounting). */
export const failAllPending = reason => {
  if (current) {
    clearTimeout(current.timer);
    current.reject(new Error(reason || 'CF proxy reset'));
    current = null;
  }
  while (queue.length) {
    queue.shift().reject(new Error(reason || 'CF proxy reset'));
  }
  busy = false;
};
