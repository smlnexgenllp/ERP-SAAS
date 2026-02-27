import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/crm/",
  withCredentials: true,
});

export const callLogService = {
  getAll: () => API.get("call-logs/"),
  create: (data) => API.post("call-logs/", data),
  update: (id, data) => API.put(`call-logs/${id}/`, data),
  delete: (id) => API.delete(`call-logs/${id}/`),
};