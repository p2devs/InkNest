// axiosInstance.js
import axios from 'axios';
import perf from '@react-native-firebase/perf';
// Create an Axios instance
const APICaller = axios.create();

// Request Interceptor
APICaller.interceptors.request.use(
  async config => {
    // Start a Firebase Performance trace
    const httpMetric = perf().newHttpMetric(
      config.url,
      config.method.toUpperCase(),
    );
    config.metadata = {httpMetric};

    await httpMetric.start();

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
    const {httpMetric} = response.config.metadata;

    console.log(response, 'response', httpMetric);
    

    httpMetric.setHttpResponseCode(response.status);
    httpMetric.setResponseContentType(response.headers['content-type']);

    await httpMetric.stop();
    return response;
  },
  async error => {
    if (
      error.config &&
      error.config.metadata &&
      error.config.metadata.httpMetric
    ) {

      console.log(error, 'error');
      

      const {httpMetric} = error.config.metadata;

      httpMetric.setHttpResponseCode(
        error.response ? error.response.status : 0,
      );
      httpMetric.setResponseContentType(
        error.response ? error.response.headers['content-type'] : '',
      );

      await httpMetric.stop();
    }
    return Promise.reject(error);
  },
);

export default APICaller;
