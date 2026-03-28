import React, { useEffect, useState, useRef } from "react";
import { FiBox, FiSave, FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi"; // Added FiArrowLeft
import { fetchVendors, fetchItems, createItem } from "../../../services/modules/inventoryService";

const COMMON_UOMS = [
  "kg", "g", "ton", "pcs", "nos", "box", "ltr", "ml", "m", "cm",
  "sqm", "set", "pair", "roll", "bundle", "carton", "pack", "unit",
  "dozen", "sheet", "liter", "meter", "ea", "ft", "in"
];

const ItemCreate = () => {
  const [vendors, setVendors] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "raw",
    item_type: "purchase",
    uom: "",
    standard_price: "",
    vendors: [],
    components: [],
  });

  const [uomOpen, setUomOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);

  const uomRef = useRef(null);
  const vendorRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (uomRef.current && !uomRef.current.contains(e.target)) setUomOpen(false);
      if (vendorRef.current && !vendorRef.current.contains(e.target)) setVendorOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    setFetchingData(true);
    try {
      const [vendorsRes, itemsRes] = await Promise.all([
        fetchVendors(),
        fetchItems()
      ]);
      setVendors(vendorsRes.data || []);
      setAllItems(itemsRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setMessage("Failed to load vendors or items");
      setMessageType("error");
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleVendor = (id) => {
    setFormData(prev => ({
      ...prev,
      vendors: prev.vendors.includes(id)
        ? prev.vendors.filter(v => v !== id)
        : [...prev.vendors, id]
    }));
  };

  const toggleUom = (value) => {
    setFormData(prev => ({ ...prev, uom: value }));
    setUomOpen(false);
  };

  const addComponent = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { child_item: "", quantity: "" }]
    }));
  };

  const removeComponent = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleComponentChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.components];
      updated[index][field] = value;
      return { ...prev, components: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) return setMessageAndType("Item name is required", "error");
    if (!formData.code.trim()) return setMessageAndType("Item code is required", "error");
    if (!formData.uom) return setMessageAndType("Unit of Measure is required", "error");

    if (formData.item_type === "production" && formData.components.length === 0) {
      return setMessageAndType("Production item must have at least one dependent item", "error");
    }

    setLoading(true);
    setMessage("");

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      category: formData.category,
      item_type: formData.item_type,
      uom: formData.uom,
      standard_price: formData.standard_price ? Number(formData.standard_price) : 0,
      vendors: formData.vendors,
      components: formData.components
        .filter(c => c.child_item && c.quantity)
        .map(c => ({
          child_item: Number(c.child_item),
          quantity: String(c.quantity)
        }))
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
        item_type: "purchase",
        uom: "",
        standard_price: "",
        vendors: [],
        components: [],
      });
    } catch (error) {
      const errMsg = error.response?.data?.detail || 
                     error.response?.data?.non_field_errors?.[0] || 
                     "Failed to create item";
      setMessage(errMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const setMessageAndType = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  // Back button handler
  const handleGoBack = () => {
    window.history.back();           // Simple browser back
    // Alternative: If using React Router v6
    // navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 md:p-10">
      
      {/* Back Button + Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 border border-cyan-800 rounded-xl text-cyan-300 transition-all hover:text-cyan-200"
        >
          <FiArrowLeft size={22} />
          <span className="font-medium">Back</span>
        </button>

        <div>
          <h1 className="text-4xl font-bold text-cyan-300 flex items-center gap-3">
            <FiBox className="text-cyan-400" /> Create New Item
          </h1>
          <p className="text-cyan-500 mt-1">Add new item with Bill of Materials support</p>
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border ${messageType === "success" ? "bg-green-950 border-green-700 text-green-300" : "bg-red-950 border-red-700 text-red-300"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900/70 border border-cyan-900/50 rounded-2xl p-8 max-w-5xl mx-auto">
        {/* ... rest of your form remains exactly the same ... */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Item Name *" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Welded Frame" />
          <Input label="Item Code *" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. FRAME-WLD-001" />

          <div>
            <label className="block text-cyan-400 text-sm mb-2">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-200">
              <option value="raw">Raw Material</option>
              <option value="consumable">Consumable</option>
              <option value="finished">Finished Goods</option>
            </select>
          </div>

          <div>
            <label className="block text-cyan-400 text-sm mb-2">Item Type *</label>
            <select name="item_type" value={formData.item_type} onChange={handleChange} className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-200">
              <option value="purchase">Purchase Item</option>
              <option value="production">Production Item (Has Dependent Items)</option>
            </select>
          </div>

          {/* UOM Dropdown */}
          <div className="relative" ref={uomRef}>
            <label className="block text-cyan-400 text-sm mb-2">Unit of Measure *</label>
            <button type="button" onClick={() => setUomOpen(!uomOpen)} className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-3 text-left text-cyan-200 flex justify-between items-center">
              <span>{formData.uom || "Select UOM..."}</span>
              <span>{uomOpen ? "▲" : "▼"}</span>
            </button>
            {uomOpen && (
              <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-cyan-700 rounded-lg shadow-xl max-h-64 overflow-auto">
                {COMMON_UOMS.map(u => (
                  <div key={u} onClick={() => toggleUom(u)} className="px-4 py-3 hover:bg-gray-700 cursor-pointer">
                    {u}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Input label="Standard Price" name="standard_price" type="number" step="0.01" value={formData.standard_price} onChange={handleChange} placeholder="0.00" />
        </div>

        {/* Vendors Section - unchanged */}
        <div className="mt-8 relative" ref={vendorRef}>
          <label className="block text-cyan-400 text-sm mb-2">Vendors (Optional)</label>
          <button type="button" onClick={() => setVendorOpen(!vendorOpen)} className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-3 text-left flex justify-between">
            <span>{formData.vendors.length === 0 ? "Select vendors..." : `${formData.vendors.length} selected`}</span>
            <span>{vendorOpen ? "▲" : "▼"}</span>
          </button>
          {vendorOpen && (
            <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-cyan-700 rounded-lg shadow-xl max-h-72 overflow-auto">
              {vendors.map(v => (
                <label key={v.id} className="flex items-center px-4 py-3 hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" checked={formData.vendors.includes(v.id)} onChange={() => toggleVendor(v.id)} className="mr-3" />
                  {v.name} {v.code && `(${v.code})`}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Dependent Items Section - unchanged */}
        {formData.item_type === "production" && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-cyan-400">Dependent Items (Bill of Materials)</h3>
              <button type="button" onClick={addComponent} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-5 py-2 rounded-lg text-sm">
                <FiPlus /> Add Dependent Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.components.map((comp, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-800 p-5 rounded-xl border border-cyan-900">
                  <div className="md:col-span-7">
                    <label className="text-sm text-cyan-500 mb-1 block">Select Dependent Item</label>
                    <select
                      value={comp.child_item}
                      onChange={(e) => handleComponentChange(index, "child_item", e.target.value)}
                      className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-200"
                    >
                      <option value="">-- Select Item --</option>
                      {allItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.code}) - {item.uom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <label className="text-sm text-cyan-500 mb-1 block">Quantity Required</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={comp.quantity}
                      onChange={(e) => handleComponentChange(index, "quantity", e.target.value)}
                      placeholder="e.g. 4.5"
                      className="w-full bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-200"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-center">
                    <button type="button" onClick={() => removeComponent(index)} className="text-red-400 hover:text-red-500 p-2">
                      <FiTrash2 size={24} />
                    </button>
                  </div>
                </div>
              ))}

              {formData.components.length === 0 && (
                <div className="text-center py-12 border border-dashed border-cyan-800 rounded-xl text-cyan-500">
                  No dependent items added yet.<br />Click "Add Dependent Item" to start building BOM.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-12 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-12 py-4 rounded-2xl font-semibold flex items-center gap-3 text-lg transition-all ${
              loading ? "bg-gray-700 text-gray-400" : "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
            }`}
          >
            <FiSave size={24} />
            {loading ? "Creating..." : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Reusable Input Component (unchanged)
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-cyan-400 text-sm mb-2">{label}</label>
    <input {...props} className="w-full bg-gray-800 border border-cyan-800 rounded-lg px-4 py-3 text-cyan-200 focus:border-cyan-500 outline-none" />
  </div>
);

export default ItemCreate;