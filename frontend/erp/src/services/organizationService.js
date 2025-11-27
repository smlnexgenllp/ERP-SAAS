// src/services/organizationService.js

import api from './api';

export const organizationService = {
  getSubOrganizations: async () => {
    try {
      const response = await api.get('/organizations/main-org/sub-organizations/');
      // Assuming successful Django response structure { success: true, data: [...] }
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sub-organizations:', error);
      
      // CRITICAL: Re-throw 401/403/500 so the component can handle global state/logout
      if (error.response?.status >= 400) {
        // Throw the original error object or a derived error for the caller to handle
        throw error; 
      }
      // For all other network issues, you can return a default array if appropriate
      return [];
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/organizations/main-org/dashboard/');
      // Assuming successful Django response structure { success: true, data: { main_organization: {...} } }
      return response.data.data?.main_organization || {
        totalSubOrgs: 0,
        activeModules: 0,
        totalUsers: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // CRITICAL: Re-throw 401/403/500
      if (error.response?.status >= 400) {
        throw error;
      }
      
      return {
        totalSubOrgs: 0,
        activeModules: 0,
        totalUsers: 0
      };
    }
  },
  createSubOrganization: async (data) => {
    try {
      const response = await api.post('/organizations/sub-organizations/create/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating sub-organization:', error);
      if (error.response?.data) {
        throw new Error(error.response.data.error || 'Failed to create sub-organization');
      }
      throw error;
    }
  },

  // NOTE: You will need a method for fetching available modules too
  getAvailableModules: async () => {
    try {
      const response = await api.get('/organizations/main-org/available-modules/');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching available modules:', error);
      if (error.response?.status >= 400) {
        throw error;
      }
      return [];
    }
  },
};