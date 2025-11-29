import api from './api'; // Import is now correct relative to its new location

const TOKEN_ACCESS = 'access_token';
const TOKEN_REFRESH = 'refresh_token';

export const authService = {
  // Utility to store tokens
  _setTokens: (access, refresh) => {
    localStorage.setItem(TOKEN_ACCESS, access);
    localStorage.setItem(TOKEN_REFRESH, refresh);
  },

  login: async (credentials) => {
    // Assuming the backend returns { access: '...', refresh: '...', user: {...} }
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh } = response.data;
    
    // Store tokens on successful login
    if (access && refresh) {
        authService._setTokens(access, refresh);
    }
    
    return response.data;
  },

  logout: async () => {
    // Clear tokens locally
    localStorage.removeItem(TOKEN_ACCESS);
    localStorage.removeItem(TOKEN_REFRESH);
    // Optionally call a backend logout endpoint if needed
  },

  getCurrentUser: async () => {
    const accessToken = localStorage.getItem(TOKEN_ACCESS);
    if (!accessToken) {
      return null;
    }
    // API interceptor in api.js handles attaching the token
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // This function is now primarily used by the API interceptor in api.js
  refreshToken: async (refresh) => {
    if (!refresh) {
      throw new Error('No refresh token available.');
    }
    const response = await api.post('/auth/token/refresh/', { refresh });
    const { access } = response.data;
    
    // Update access token
    localStorage.setItem(TOKEN_ACCESS, access);
    
    return access;
  },

  register: async (userData) => {
    // Assuming the backend returns { access: '...', refresh: '...', user: {...} }
    const response = await api.post('/auth/register/', userData);
    const { access, refresh } = response.data;

    // Store tokens on successful registration
    if (access && refresh) {
        authService._setTokens(access, refresh);
    }

    return response.data;
  }
};