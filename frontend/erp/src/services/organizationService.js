import api from "./api";

export const organizationService = {
  getSubOrganizations: async () => {
    try {
      const response = await api.get(
        "/organizations/main-org/sub-organizations/"
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching sub-organizations:", error);
      if (error.response?.status === 403) {
        throw new Error("Access denied. Please check your permissions.");
      }
      return [];
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get("/core/dashboard-stats/");
      return (
        response.data.data?.main_organization || {
          totalSubOrgs: 0,
          activeModules: 0,
          totalUsers: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      if (error.response?.status === 403) {
        throw new Error("Access denied. Please check your permissions.");
      }
      return {
        totalSubOrgs: 0,
        activeModules: 0,
        totalUsers: 0,
      };
    }
  },
  createSubOrganization: async (data) => {
    try {
      const response = await api.post(
        "/organizations/sub-organizations/create/",
        data
      );
      return response.data;
    } catch (error) {
      console.error("🚨 AXIOS ERROR →", error);
      console.log("📌 BACKEND RAW ERROR →", error.response);
      console.log("📌 BACKEND ERROR DATA →", error.response?.data);
      console.log("📌 BACKEND ERROR MESSAGE →", error.response?.data?.error);

      // Return backend error so modal can show it
      throw new Error(
        error.response?.data?.error || "Failed to create sub-organization"
      );
    }
  },

  // ... other methods
};
