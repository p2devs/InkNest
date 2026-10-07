/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// Keep the smoke test offline: startup update checks must not reach GitHub.
jest.mock('../src/Redux/Controller/Interceptor', () => {
  const offline = () => Promise.reject(new Error('offline'));
  return {
    __esModule: true,
    default: { get: offline, post: offline, request: offline },
  };
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
