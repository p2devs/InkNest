// axiosInstance.js
import axios from 'axios';
import perf from '@react-native-firebase/perf';
// Create an Axios instance
// Without a timeout a hung request keeps the global loading flag on forever,
// leaving the details screens stuck on their loading overlay.
const APICaller = axios.create({timeout: 30000});

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
