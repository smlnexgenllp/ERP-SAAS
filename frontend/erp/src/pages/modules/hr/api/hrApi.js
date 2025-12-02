// src/pages/modules/hr/api/hrApi.js
import api from '../../../../services/api';

export const hrApi = {
  // ================= Organization Tree =================
  getOrgTree: () => api.get("hr/org-tree/"),
  getPublicOrgTree: () => api.get("hr/public-org-tree/"),  // Added this
  getDepartmentTree: () => api.get("hr/org-tree/departments/"),
  getEmployeeDetails: (employeeId) =>
    api.get(`hr/employees/${employeeId}/detail/`),

  // ================= Employee Management =================
  getEmployees: (params) => api.get("hr/employees/", { params }),
  createEmployee: (data) => api.post("hr/employees/", data),
  updateEmployee: (id, data) => api.put(`hr/employees/${id}/`, data),
  deleteEmployee: (id) => api.delete(`hr/employees/${id}/`),

  // ================= Department Management =================
  getDepartments: (params) => api.get("hr/departments/", { params }),
  createDepartment: (data) => api.post("hr/departments/", data),
  updateDepartment: (id, data) => api.put(`hr/departments/${id}/`, data),
  deleteDepartment: (id) => api.delete(`hr/departments/${id}/`),

  // ================= Designation Management =================
  getDesignations: (params) => api.get("hr/designations/", { params }),
  createDesignation: (data) => api.post("hr/designations/", data),
  updateDesignation: (id, data) => api.put(`hr/designations/${id}/`, data),
  deleteDesignation: (id) => api.delete(`hr/designations/${id}/`),

  // ================= LEGACY (Backward Compatibility) =================
  fetchEmployees: () => api.get("hr/users/"),
  fetchEmployeeDocs: () => api.get("hr/documents/"),
};

// Old function exports (backward compatibility)
export const fetchOrgTree = hrApi.getOrgTree;
export const fetchEmployees = hrApi.getEmployees;

export default hrApi;