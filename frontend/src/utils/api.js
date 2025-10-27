import axios from 'axios';

export function withRetry(fn, { retries = 2, delayMs = 500 } = {}) {
  return async (...args) => {
    let attempt = 0;
    let lastErr;
    while (attempt <= retries) {
      try {
        return await fn(...args);
      } catch (err) {
        lastErr = err;
        if (attempt === retries) break;
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
        attempt += 1;
      }
    }
    throw lastErr;
  };
}

export const api = axios.create({
  baseURL: '/',
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API error:', {
      url: err.config?.url,
      status: err.response?.status,
      data: err.response?.data
    });
    return Promise.reject(err);
  }
);


