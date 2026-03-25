import api from "../../../../erp/src/services/api";

// ====================== VENDORS ======================
export const fetchVendors = () => {
  return api.get("finance/vendors/");
};

// ====================== ITEMS ======================
export const fetchItems = () => {
  return api.get("/inventory/items/");
};

export const createItem = (data) => {
  return api.post("/inventory/items/", data);
};

// Optional: Get single item with BOM details (useful later)
export const getItemById = (id) => {
  return api.get(`/inventory/items/${id}/`);
};

// Optional: Update item (if you add edit functionality later)
export const updateItem = (id, data) => {
  return api.put(`/inventory/items/${id}/`, data);
};

// Optional: Delete item
export const deleteItem = (id) => {
  return api.delete(`/inventory/items/${id}/`);
};

export default {
  fetchVendors,
  fetchItems,
  createItem,
  getItemById,
  updateItem,
  deleteItem,
};