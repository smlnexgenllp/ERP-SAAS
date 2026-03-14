import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/production/",
});

// Add token automatically
API.interceptors.request.use((config) => {

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

export default API;


// API calls

export const getProductionPlans = () =>
  API.get("production-plans/");

export const getPlannedOrders = () =>
  API.get("planned-orders/");

export const getManufacturingOrders = () =>
  API.get("manufacturing-orders/");

export const runMRP = (id) =>
  API.post(`run-mrp/${id}/`);

export const convertToMO = (id) =>
  API.post(`convert-mo/${id}/`);

export const startProduction = (id,data) =>
  API.post(`manufacturing-orders/start/${id}/`,data);

export const completeProduction = (id,data) =>
  API.post(`manufacturing-orders/complete/${id}/`,data);