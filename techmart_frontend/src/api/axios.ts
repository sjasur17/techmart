import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { API_V1_BASE_URL, buildApiUrl } from './config';

export const apiClient = axios.create({
  baseURL: API_V1_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let browser set multipart boundary for file uploads.
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop if refresh fails
    if (error.response?.status === 401 && originalRequest.url === '/auth/refresh/') {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(buildApiUrl('/auth/refresh/'), {
          refresh: refreshToken,
        });

        useAuthStore.getState().setToken(data.access);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);
