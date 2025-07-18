// axiosInstance.js
import axios from 'axios';
import {isMacOS} from '../../Utils/PlatformUtils';

let perf;
try {
  if (!isMacOS) {
    perf = require('@react-native-firebase/perf').default;
  }
} catch (error) {
  console.log('Firebase performance not available on this platform');
}

// Create an Axios instance
const APICaller = axios.create();

// Request Interceptor
APICaller.interceptors.request.use(
  async config => {
    // Start a Firebase Performance trace only if available
    if (!isMacOS && perf) {
      try {
        const httpMetric = perf().newHttpMetric(
          config.url,
          config.method.toUpperCase(),
        );
        config.metadata = {httpMetric};
        await httpMetric.start();
      } catch (error) {
        console.log('Firebase performance tracking failed:', error);
      }
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response Interceptor
APICaller.interceptors.response.use(
  async response => {
    // Stop the trace when the response is received
    if (!isMacOS && response.config.metadata && response.config.metadata.httpMetric) {
      try {
        const {httpMetric} = response.config.metadata;
        httpMetric.setHttpResponseCode(response.status);
        httpMetric.setResponseContentType(response.headers['content-type']);
        await httpMetric.stop();
      } catch (error) {
        console.log('Firebase performance tracking failed:', error);
      }
    }
    return response;
  },
  async error => {
    if (
      !isMacOS &&
      error.config &&
      error.config.metadata &&
      error.config.metadata.httpMetric
    ) {
      try {
        console.log(error, 'error');
        
        const {httpMetric} = error.config.metadata;

        httpMetric.setHttpResponseCode(
          error.response ? error.response.status : 0,
        );
        httpMetric.setResponseContentType(
          error.response ? error.response.headers['content-type'] : '',
        );

        await httpMetric.stop();
      } catch (perfError) {
        console.log('Firebase performance tracking failed:', perfError);
      }
    }
    return Promise.reject(error);
  },
);

export default APICaller;
