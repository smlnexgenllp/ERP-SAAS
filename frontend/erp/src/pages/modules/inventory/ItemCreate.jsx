import React, { useEffect, useState, useRef } from "react";
import { FiBox, FiSave, FiUsers, FiTag, FiDollarSign, FiList } from "react-icons/fi";
import { fetchVendors, createItem } from "../../../services/modules/inventoryService";

const COMMON_UOMS = [
  "kg", "g", "ton", "pcs", "nos", "box", "ltr", "ml", "m", "cm",
  "sqm", "set", "pair", "roll", "bundle", "carton", "pack", "unit",
  "dozen", "sheet", "liter", "meter", "kilometer", "ea", "ft", "in"
];

const ItemCreate = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingVendors, setFetchingVendors] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "raw",
    uom: [],                // array → will be joined to string
    standard_price: "",
    vendors: [],            // array of IDs
  });

  // Dropdown states
  const [uomOpen, setUomOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);

  const uomRef = useRef(null);
  const vendorRef = useRef(null);

  useEffect(() => {
    loadVendors();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (uomRef.current && !uomRef.current.contains(e.target)) setUomOpen(false);
      if (vendorRef.current && !vendorRef.current.contains(e.target)) setVendorOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadVendors = async () => {
    setFetchingVendors(true);
    try {
      const res = await fetchVendors();
      setVendors(res.data || []);
    } catch (err) {
      console.error("Failed to load vendors:", err);
      setMessage("Could not load vendors list");
      setMessageType("error");
    } finally {
      setFetchingVendors(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (field, value) => {
    setFormData((prev) => {
      const list = prev[field] || [];
      if (list.includes(value)) {
        return { ...prev, [field]: list.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...list, value] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.name.trim()) return setErrorMessage("Item name is required");
    if (!formData.code.trim()) return setErrorMessage("Item code is required");
    if (formData.uom.length === 0) return setErrorMessage("Select at least one UOM");

    setLoading(true);
    setMessage("");

    const payload = {
      ...formData,
      uom: formData.uom.join(", "),        // backend CharField
      vendors: formData.vendors,           // ManyToMany → list of IDs
      standard_price: formData.standard_price ? Number(formData.standard_price) : 0,
    };

    try {
      await createItem(payload);
      setMessage("Item created successfully!");
      setMessageType("success");

      // Reset form
      setFormData({
        name: "",
        code: "",
        category: "raw",
        uom: [],
        standard_price: "",
        vendors: [],
      });
    } catch (error) {
      const errDetail =
        error.response?.data?.non_field_errors?.[0] ||
        error.response?.data?.code?.[0] ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to create item. Check console.";
      setMessage(errDetail);
      setMessageType("error");
      console.error("Create item error:", error);
    } finally {
      setLoading(false);
    }
  };

  const setErrorMessage = (msg) => {
    setMessage(msg);
    setMessageType("error");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 md:p-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-cyan-300 flex items-center gap-3">
          <FiBox className="text-cyan-400" /> Create New Item
        </h1>
        <p className="text-cyan-500 mt-1">Add a new inventory item to your catalog</p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-8 p-4 rounded-xl border ${
            messageType === "success"
              ? "bg-green-950 border-green-700 text-green-300"
              : "bg-red-950 border-red-700 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900/70 border border-cyan-900/50 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          <Input label="Item Name *" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Stainless Steel Bolt" />

          <Input label="Item Code *" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. RM-BOLT-001" />

          <div>
            <label className="block text-cyan-400 text-sm mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-2.5 text-cyan-200 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="raw">Raw Material</option>
              <option value="consumable">Consumable</option>
              <option value="finished">Finished Goods</option>
            </select>
          </div>

          {/* UOM Checkbox Dropdown */}
          <div className="relative" ref={uomRef}>
            <label className="block text-cyan-400 text-sm mb-2">Unit of Measure *</label>
            <button
              type="button"
              onClick={() => setUomOpen(!uomOpen)}
              className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-2.5 text-left text-cyan-200 flex justify-between items-center focus:outline-none focus:border-cyan-500 transition"
            >
              <span className="truncate">
                {formData.uom.length === 0 ? "Select UOM..." : formData.uom.join(", ")}
              </span>
              <span>{uomOpen ? "▲" : "▼"}</span>
            </button>

            {uomOpen && (
              <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-cyan-700 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                {COMMON_UOMS.map((uom) => (
                  <label
                    key={uom}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-700/70 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.uom.includes(uom)}
                      onChange={() => toggleSelection("uom", uom)}
                      className="w-5 h-5 accent-cyan-500 mr-3 rounded"
                    />
                    <span className="text-cyan-200">{uom}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Standard Price"
            name="standard_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.standard_price}
            onChange={handleChange}
            placeholder="0.00"
            icon={<FiDollarSign />}
          />
        </div>

        {/* Vendors Checkbox Dropdown */}
        <div className="mt-8 relative" ref={vendorRef}>
          <label className="block text-cyan-400 text-sm mb-2">Vendors (multi-select)</label>
          <button
            type="button"
            onClick={() => setVendorOpen(!vendorOpen)}
            disabled={fetchingVendors}
            className={`w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-2.5 text-left text-cyan-200 flex justify-between items-center focus:outline-none focus:border-cyan-500 transition ${
              fetchingVendors ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <span className="truncate">
              {fetchingVendors
                ? "Loading vendors..."
                : formData.vendors.length === 0
                ? "Select vendors..."
                : `${formData.vendors.length} vendor${formData.vendors.length > 1 ? "s" : ""} selected`}
            </span>
            <span>{vendorOpen ? "▲" : "▼"}</span>
          </button>

          {vendorOpen && !fetchingVendors && (
            <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-cyan-700 rounded-lg shadow-2xl max-h-72 overflow-y-auto">
              {vendors.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400">No vendors found</div>
              ) : (
                vendors.map((vendor) => (
                  <label
                    key={vendor.id}
                    className="flex items-center px-4 py-2.5 hover:bg-gray-700/70 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.vendors.includes(vendor.id)}
                      onChange={() => toggleSelection("vendors", vendor.id)}
                      className="w-5 h-5 accent-cyan-500 mr-3 rounded"
                    />
                    <span className="text-cyan-200">
                      {vendor.name}
                      {vendor.code && <span className="text-cyan-500 ml-1">({vendor.code})</span>}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-10 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${
              loading
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white"
            }`}
          >
            <FiSave size={20} />
            {loading ? "Creating..." : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Reusable Input
const Input = ({ label, icon, ...props }) => (
  <div>
    <label className="block text-cyan-400 text-sm mb-2 flex items-center gap-2">
      {icon} {label}
    </label>
    <input
      {...props}
      className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-2.5 text-cyan-200 outline-none focus:border-cyan-500 transition"
    />
  </div>
);

export default ItemCreate;