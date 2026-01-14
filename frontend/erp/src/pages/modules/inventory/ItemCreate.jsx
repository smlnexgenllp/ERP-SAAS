import React, { useEffect, useState } from "react";
import { FiBox, FiSave, FiUsers, FiTag, FiDollarSign } from "react-icons/fi";
import { fetchVendors, createItem } from "../../../services/modules/inventoryService";

const ItemCreate = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "raw",
    uom: "",
    standard_price: "",
    vendors: [],
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const res = await fetchVendors();
      setVendors(res.data || []);
    } catch (error) {
      console.error("Failed to load vendors", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVendorSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, opt => Number(opt.value));
    setFormData({ ...formData, vendors: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createItem(formData);
      setMessage("Item created successfully");
      setMessageType("success");
      setFormData({
        name: "",
        code: "",
        category: "raw",
        uom: "",
        standard_price: "",
        vendors: [],
      });
    } catch (error) {
      setMessage("Failed to create item");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-300 flex items-center gap-3">
          <FiBox /> Create Inventory Item
        </h1>
        <p className="text-cyan-400 text-sm">
          Inventory Management • Item Master
        </p>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-6 p-4 rounded border ${
            messageType === "success"
              ? "border-green-700 text-green-300"
              : "border-red-700 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 max-w-4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Name */}
          <Input
            label="Item Name"
            icon={<FiBox />}
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {/* Item Code */}
          <Input
            label="Item Code"
            icon={<FiTag />}
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
          />

          {/* Category */}
          <div>
            <label className="text-cyan-400 text-sm mb-1 block">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-200 outline-none focus:border-cyan-400"
            >
              <option value="raw">Raw Material</option>
              <option value="consumable">Consumable</option>
              <option value="finished">Finished Goods</option>
            </select>
          </div>

          {/* UOM */}
          <Input
            label="Unit of Measure"
            name="uom"
            placeholder="kg, pcs, liters"
            value={formData.uom}
            onChange={handleChange}
            required
          />

          {/* Standard Price */}
          <Input
            label="Standard Price"
            icon={<FiDollarSign />}
            name="standard_price"
            type="number"
            value={formData.standard_price}
            onChange={handleChange}
          />
        </div>

        {/* Vendors */}
        <div className="mt-6">
          <label className="text-cyan-400 text-sm mb-2 block flex items-center gap-2">
            <FiUsers /> Vendors
          </label>
          <select
            multiple
            onChange={handleVendorSelect}
            className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-200 h-36 focus:border-cyan-400"
          >
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition"
          >
            <FiSave /> {loading ? "Saving..." : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------- REUSABLE INPUT ---------- */
const Input = ({ label, icon, ...props }) => (
  <div>
    <label className="text-cyan-400 text-sm mb-1 block flex items-center gap-2">
      {icon} {label}
    </label>
    <input
      {...props}
      className="w-full bg-gray-900 border border-cyan-800 rounded px-3 py-2 text-cyan-200 outline-none focus:border-cyan-400"
    />
  </div>
);

export default ItemCreate;
