import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Globals for token refresh logic
let isRefreshing = false;
let failedQueue = [];

// Helper function to process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper function to get CSRF token (kept from original file)
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// === REQUEST INTERCEPTOR ===
api.interceptors.request.use(
  (config) => {
    // 1. Attach CSRF Token (for session-based security)
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    // 2. Attach Access Token (for token-based authentication)
    const accessToken = localStorage.getItem('access_token');
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// === RESPONSE INTERCEPTOR (401/403 Handling) ===
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 403 Forbidden (Permission issue, original logic)
    if (error.response?.status === 403) {
      console.error('Access forbidden. Redirecting to login.');
      // You should probably check if the user is authenticated first
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (Token expiry issue)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark request as retry attempt
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');

      // If no refresh token exists, redirect to login
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 1. If a refresh is already in progress, queue the failed request
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // Retry the request with the new token
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // 2. If no refresh is in progress, start the refresh process
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          const response = await api.post('/auth/token/refresh/', { refresh: refreshToken });
          const newAccessToken = response.data?.access;
          
          if (!newAccessToken) {
            throw new Error("Refresh failed: No new access token.");
          }

          // Update local storage and set new token in header
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          
          // Process all queued requests with the new token
          processQueue(null, newAccessToken);
          
          // Resolve the original request with the new token
          resolve(api(originalRequest));

        } catch (refreshError) {
          // If refresh token fails (e.g., 401 on refresh endpoint)
          console.error('Refresh token failed. Logging out.', refreshError);
          processQueue(refreshError, null);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    // Default error rejection
    return Promise.reject(error);
  }
);

export default api;