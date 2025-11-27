import api from './api';

export const moduleService = {
  getAvailableModules: async (userRole = '') => {
    try {
      // Use different endpoint for sub-organizations
      const endpoint = userRole === 'sub_org_admin' 
        ? '/organizations/main-org/sub-org-modules/'
        : '/organizations/main-org/available-modules/';
      
      console.log('🔄 Fetching modules from:', endpoint);
      
      const response = await api.get(endpoint);
      
      console.log('📦 Modules API response:', response.data);
      
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching modules:', error);
      return [];
    }
  },

  getOrganizationModules: async (orgId) => {
    const response = await api.get(`/organizations/${orgId}/modules/`);
    return response.data;
  }
};