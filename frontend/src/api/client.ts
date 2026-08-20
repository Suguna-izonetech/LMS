import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kite_token') || sessionStorage.getItem('kite_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop during login or refresh calls
    if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('kite_refresh_token') || sessionStorage.getItem('kite_refresh_token');
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: storedRefreshToken || '' },
          { withCredentials: true }
        );

        const { access_token, refresh_token } = response.data;
        if (sessionStorage.getItem('kite_token')) {
          sessionStorage.setItem('kite_token', access_token);
          sessionStorage.setItem('kite_refresh_token', refresh_token);
        } else {
          localStorage.setItem('kite_token', access_token);
          localStorage.setItem('kite_refresh_token', refresh_token);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear session info and redirect to login
        localStorage.removeItem('kite_token');
        localStorage.removeItem('kite_refresh_token');
        localStorage.removeItem('kite_user');
        window.location.hash = '#/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
