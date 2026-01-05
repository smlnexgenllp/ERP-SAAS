// src/services/moduleService.js
import api from "./api";

export const moduleService = {
  getAvailableModules: async (userRole = "") => {
    try {
      // Decide endpoint based on role
      const endpoint = userRole.toLowerCase().includes("sub")
        ? "/organizations/main-org/sub-org-modules/" // sub-org endpoint
        : "/organizations/main-org/available-modules/"; // main-org endpoint

      console.log("Fetching modules from:", endpoint);

      const response = await api.get(endpoint);

      console.log("Modules API response:", response.data);

      // Backend returns: { success: true, data: [...] }
      const modules = response.data?.data || response.data || [];

      console.log("Final modules for user:", modules);
      return modules;
    } catch (error) {
      console.error("Error fetching modules:", error);
      return [];
    }
  },

  getOrganizationModules: async (orgId) => {
    try {
      const response = await api.get(`/organizations/${orgId}/modules/`);
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error("Error fetching org modules:", error);
      return [];
    }
  },

// src/services/moduleService.js
getSubOrgUserModules: async () => {
  try {
    const response = await api.get("/organizations/suborg-user/modules/");
    return response.data?.modules || [];
  } catch (error) {
    console.error("Error fetching sub-org user modules:", error);
    return [];
  }
},
};
