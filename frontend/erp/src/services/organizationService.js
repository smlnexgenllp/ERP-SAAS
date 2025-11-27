import api from './api';

export const organizationService = {
  getSubOrganizations: async () => {
    try {
      const response = await api.get('/organizations/main-org/sub-organizations/');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sub-organizations:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      return [];
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/organizations/main-org/dashboard/');
      return response.data.data?.main_organization || {
        totalSubOrgs: 0,
        activeModules: 0,
        totalUsers: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      return {
        totalSubOrgs: 0,
        activeModules: 0,
        totalUsers: 0
      };
    }
  },

  // ... other methods
};