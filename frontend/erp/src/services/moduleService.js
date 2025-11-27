import api from './api';

export const moduleService = {
  getAvailableModules: async () => {
    try {
      const response = await api.get('/organizations/main-org/available-modules/');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  },

  getOrganizationModules: async (orgId) => {
    const response = await api.get(`/organizations/${orgId}/modules/`);
    return response.data;
  }
};