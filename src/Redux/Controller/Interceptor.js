// axiosInstance.js
import axios from 'axios';
import perf from '@react-native-firebase/perf';
import {isCloudflareProtectedUrl} from '../../Utils/cloudflareClearance';
import {isProxyReady, webviewRequest} from '../../Utils/webviewProxy';

// Create an Axios instance
// Without a timeout a hung request keeps the global loading flag on forever,
// leaving the details screens stuck on their loading overlay.
const APICaller = axios.create({timeout: 30000});

const CHALLENGE_RE = /just a moment|challenge-platform|_cf_chl_opt|attention required/i;
const nativeAdapter = axios.getAdapter(axios.defaults.adapter);

/**
 * Custom adapter: readcomicsonline.ru page requests are served by NAVIGATING the
 * persistent Cloudflare proxy WebView to the URL and reading back the rendered
 * HTML — a real browser Cloudflare auto-solves, whereas replaying cf_clearance
 * through the native HTTP client (or an in-page fetch) gets 403'd. Everything
 * else uses the normal adapter.
 */
APICaller.defaults.adapter = async config => {
  const url = config.url || '';
  if (isCloudflareProtectedUrl(url)) {
    if (!isProxyReady()) {
      // Proxy not mounted yet → fail fast; the screen retries once it's up.
      const err = new Error('Cloudflare verification pending');
      err.response = {status: 503, data: '', headers: {}, config};
      throw err;
    }
    const method = (config.method || 'get').toUpperCase();
    const res = await webviewRequest(url, {method, body: config.data});
    const body = typeof res.data === 'string' ? res.data : '';
    if (!body || CHALLENGE_RE.test(body.slice(0, 1500))) {
      // Navigation returned a challenge/empty page (stuck) → surface as an error
      // so the screen shows Retry; the proxy will prompt for a manual solve.
      const err = new Error('Cloudflare challenge');
      err.response = {status: 403, data: body, headers: {}, config};
      throw err;
    }
    return {
      data: res.data,
      status: 200,
      statusText: 'OK',
      headers: {'content-type': 'text/html'},
      config,
      request: {proxy: true},
    };
  }
  return nativeAdapter(config);
};

// Request Interceptor — Firebase Performance trace.
APICaller.interceptors.request.use(
  async config => {
    const httpMetric = perf().newHttpMetric(
      config.url,
      (config.method || 'get').toUpperCase(),
    );
    config.metadata = {httpMetric};
    await httpMetric.start();
    return config;
  },
  error => Promise.reject(error),
);

// Response Interceptor — stop the trace.
APICaller.interceptors.response.use(
  async response => {
    const {httpMetric} = response.config?.metadata || {};
    if (httpMetric) {
      httpMetric.setHttpResponseCode(response.status);
      httpMetric.setResponseContentType(response.headers?.['content-type']);
      await httpMetric.stop();
    }
    return response;
  },
  async error => {
    if (error.config?.metadata?.httpMetric) {
      const {httpMetric} = error.config.metadata;
      httpMetric.setHttpResponseCode(error.response ? error.response.status : 0);
      httpMetric.setResponseContentType(
        error.response ? error.response.headers?.['content-type'] : '',
      );
      await httpMetric.stop();
    }
    return Promise.reject(error);
  },
);

export default APICaller;
