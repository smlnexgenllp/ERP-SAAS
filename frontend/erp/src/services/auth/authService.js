import api from '../api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  refreshToken: async () => {
    const refresh = localStorage.getItem('refresh_token');
    const response = await api.post('/auth/token/refresh/', { refresh });
    const { access } = response.data;
    localStorage.setItem('access_token', access);
    return access;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  }
};