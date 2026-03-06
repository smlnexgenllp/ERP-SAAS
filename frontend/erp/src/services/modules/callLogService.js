import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/crm/`,
  withCredentials: true,
});

export const callLogService = {
  getAll: () => API.get("call-logs/"),
  create: (data) => API.post("call-logs/", data),
  update: (id, data) => API.put(`call-logs/${id}/`, data),
  delete: (id) => API.delete(`call-logs/${id}/`),
};