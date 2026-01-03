import api from "../../../../services/api";

// =================== EMPLOYEES ===================
export const fetchEmployees = () => api.get("/hr/employees/");
export const fetchMyProfile = () => api.get("/hr/employees/me/");

// =================== EMPLOYEE DOCUMENTS ===================
export const fetchMyDocuments = () => api.get("/hr/employee-documents/");
export const uploadMyDocument = (formData) =>
  api.post("/hr/employee-documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteDocument = (docId) => 
  api.delete(`/hr/employee-documents/${docId}/`);
// =================== INVITES ===================
export const acceptInvite = (token, payload) =>
  api.post(`/hr/employees/accept-invite/${token}/`, payload);

// =================== ORG TREE ===================
export const getOrgTree = () => api.get("/hr/org-tree/");
export const getPublicOrgTree = () => api.get("/hr/public-org-tree/");

// =================== DEPARTMENTS & DESIGNATIONS ===================
export const fetchDepartments = () => api.get("/hr/departments/");
export const fetchDesignations = () => api.get("/hr/designations/");

// =================== LEAVE REQUESTS (Employee) ===================
export const fetchLeaveHistory = async () => {
  const res = await api.get("/hr/leave-requests/");
  return res.data.results || res.data; // <-- fix for paginated/non-paginated response
};


// =================== PERMISSION REQUESTS ===================
export const fetchPermissionHistory = async () => {
  const res = await api.get("/hr/permission/");  // make sure endpoint matches DRF router
  return res.data.results || res.data;           // handle paginated/non-paginated responses
};


// =================== MANAGERS ===================
export const fetchManagers = () =>api.get("/hr/leave-requests/possible-managers/");
export const getAllLeaves = () => api.get("/hr/leave-requests/");

// APPROVE leave
export const approveLeave = (id, response_note = "") =>
  api.post(`/hr/leave-requests/${id}/approve/`, { response_note });

// REJECT leave
export const rejectLeave = (id, response_note = "") =>
  api.post(`/hr/leave-requests/${id}/reject/`, { response_note });


// ---------------- PERMISSIONS ----------------

// GET all permission requests
export const getAllPermissions = () => api.get("/hr/permission/");

// APPROVE permission
export const approvePermission = (id, response_note = "") =>
  api.post(`/hr/permission/${id}/approve/`, { response_note });

// REJECT permission
export const rejectPermission = (id, response_note = "") =>
  api.post(`/hr/permission/${id}/reject/`, { response_note });


// =================== MANAGER LEAVE MANAGEMENT ===================
export const getManagerLeaves = () => api.get("/hr/manager/leave-requests/");

// src/pages/modules/hr/api/hrApi.js
export const fetchTrainingVideos = () =>
  api.get("/organizations/training-videos/");

// DELETE a specific training video (Used by the dashboard/manager component)
export const deleteTrainingVideo = (videoId) =>
   api.delete(`/organizations/training-videos/${videoId}/`);

export const uploadTrainingVideo = (formData) =>
  api.post("/organizations/training-videos/upload/", formData, {
  headers: { "Content-Type": "multipart/form-data" },
  });

  export const fetchTrainingCompletions = async () => {
  return api.get("organizations/training-completed/status"); 
};

export const fetchReimbursements = async () => {
  return api.get("/hr/reimbursements/");
};

export const submitReimbursementRequest = async (data) => {
  return api.post("/hr/reimbursements/", data);
};
export const markVideoWatched = (videoId) =>
  api.post("/organizations/training-video-watched/", { video_id: videoId });

export const fetchMyTrainingProgress = () =>
  api.get("/organizations/my-training-progress/");

export const approveReimbursement = async (id) => {
  return api.post(`/hr/reimbursements/${id}/approve/`);
};

// Reject reimbursement
export const rejectReimbursement = async (id) => {
  return api.post(`/hr/reimbursements/${id}/reject/`);
};
