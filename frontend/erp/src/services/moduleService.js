// src/services/moduleService.js
import api from './api';

export const moduleService = {
  getAvailableModules: async (userRole = '') => {
    try {
      // Always use the public endpoint for display in modal
      // This endpoint is accessible to main-org admins and returns module codes + names
      const endpoint = '/organizations/main-org/available-modules/';
      
      console.log('Fetching modules from:', endpoint);
      
      const response = await api.get(endpoint);
      
      console.log('Modules API response:', response.data);

      // Your backend returns: { success: true, data: [...] }
      // So we return the actual array of modules
      const modules = response.data?.data || response.data || [];
      
      console.log('Final modules for modal:', modules);
      return modules;

    } catch (error) {
      console.error('Error fetching modules:', error);
      
      // Never break the UI — return empty array
      return [];
    }
  },

  // Keep this for future use (e.g. sub-org dashboard)
  getOrganizationModules: async (orgId) => {
    try {
      const response = await api.get(`/organizations/${orgId}/modules/`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching org modules:', error);
      return [];
    }
  }
};