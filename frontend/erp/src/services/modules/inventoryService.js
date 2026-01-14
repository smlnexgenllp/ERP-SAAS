import api from "../../../../erp/src/services/api";

export const fetchVendors = () => {
  return api.get("finance/vendors/");
};

export const createItem = (data) => {
  return api.post("/items/", data);
};
