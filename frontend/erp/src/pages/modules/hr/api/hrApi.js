
import api from '../../../../services/api' 
// import axios from 'axios';
export const fetchEmployees = () => api.get('/hr/users/');
export const fetchEmployeeDocs = () => api.get('/hr/documents/');

export const inviteEmployee = (email, role) => {
  return api.post('/hr/invite/', { email, role });
};
export const acceptInvite = (token, payload) => api.post(`/hr/invite/accept/${token}/`, payload);
export const uploadMyDocument = (formData) => api.post('/hr/employee/upload/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const fetchMyDocuments = () => api.get('/hr/employee/my-documents/');
export const fetchOrgTree = () => api.get('/hr/org-tree/');

export const getOrgTree = () => api.get("hr/org-tree/");
export const getPublicOrgTree = () => api.get("hr/public-org-tree/");  // Added this
export const getDepartmentTree = () => api.get("hr/org-tree/departments/");
export const getEmployeeDetails = (employeeId) =>api.get(`hr/employees/${employeeId}/detail/`);
