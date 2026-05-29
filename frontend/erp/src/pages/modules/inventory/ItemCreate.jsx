import React, { useEffect, useState, useRef } from "react";
import { FiBox, FiSave, FiPlus, FiTrash2, FiArrowLeft } from "react-icons/fi";
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
        components: []
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

  const handleGoBack = () => window.history.back();

  return (
    <div className="min-h-screen bg-zinc-100 py-10">
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 transition"
          >
            <FiArrowLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <FiBox className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Create New Item</h1>
              <p className="text-zinc-500">Add item with Bill of Materials support</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-3 ${
            messageType === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            <Input label="Item Name *" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Welded Frame" />
            <Input label="Item Code *" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. FRAME-WLD-001" />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-zinc-400 outline-none">
                <option value="raw">Raw Material</option>
                <option value="consumable">Consumable</option>
                <option value="finished">Finished Goods</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Item Type *</label>
              <select name="item_type" value={formData.item_type} onChange={handleChange} className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-zinc-400 outline-none">
                <option value="purchase">Purchase Item</option>
                <option value="production">Production Item (Has Dependent Items)</option>
              </select>
            </div>

            {/* UOM Dropdown */}
            <div className="relative" ref={uomRef}>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Unit of Measure *</label>
              <button 
                type="button" 
                onClick={() => setUomOpen(!uomOpen)} 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-left flex justify-between items-center focus:border-zinc-400"
              >
                <span className="text-zinc-800">{formData.uom || "Select UOM..."}</span>
                <span>{uomOpen ? "▲" : "▼"}</span>
              </button>

              {uomOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-64 overflow-auto py-2">
                  {COMMON_UOMS.map(u => (
                    <div 
                      key={u} 
                      onClick={() => toggleUom(u)} 
                      className="px-5 py-3 hover:bg-zinc-100 cursor-pointer text-zinc-700"
                    >
                      {u}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input 
              label="Standard Price (₹)" 
              name="standard_price" 
              type="number" 
              step="0.01" 
              value={formData.standard_price} 
              onChange={handleChange} 
              placeholder="0.00" 
            />
          </div>

          {/* Vendors Section */}
          <div className="mt-12 relative" ref={vendorRef}>
            <label className="block text-sm font-medium text-zinc-700 mb-3">Vendors (Optional)</label>
            <button 
              type="button" 
              onClick={() => setVendorOpen(!vendorOpen)} 
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-left flex justify-between"
            >
              <span>{formData.vendors.length === 0 ? "Select vendors..." : `${formData.vendors.length} selected`}</span>
              <span>{vendorOpen ? "▲" : "▼"}</span>
            </button>

            {vendorOpen && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-72 overflow-auto py-2">
                {vendors.map(v => (
                  <label key={v.id} className="flex items-center px-5 py-3 hover:bg-zinc-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.vendors.includes(v.id)} 
                      onChange={() => toggleVendor(v.id)} 
                      className="mr-3 accent-zinc-800" 
                    />
                    <span className="text-zinc-800">{v.name} {v.code && `(${v.code})`}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Dependent Items (BOM) */}
          {formData.item_type === "production" && (
            <div className="mt-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-zinc-900">Bill of Materials (Dependent Items)</h3>
                <button 
                  type="button" 
                  onClick={addComponent} 
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white px-6 py-3 rounded-2xl text-sm font-medium transition"
                >
                  <FiPlus /> Add Dependent Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.components.map((comp, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                    <div className="md:col-span-7">
                      <label className="text-sm text-zinc-600 mb-2 block">Select Dependent Item</label>
                      <select
                        value={comp.child_item}
                        onChange={(e) => handleComponentChange(index, "child_item", e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5"
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
                      <label className="text-sm text-zinc-600 mb-2 block">Quantity Required</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={comp.quantity}
                        onChange={(e) => handleComponentChange(index, "quantity", e.target.value)}
                        placeholder="e.g. 4.5"
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                      <button 
                        type="button" 
                        onClick={() => removeComponent(index)} 
                        className="text-red-500 hover:text-red-600 p-2 transition"
                      >
                        <FiTrash2 size={24} />
                      </button>
                    </div>
                  </div>
                ))}

                {formData.components.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-zinc-200 rounded-3xl text-zinc-500">
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
                loading 
                  ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" 
                  : "bg-zinc-900 hover:bg-black text-white"
              }`}
            >
              <FiSave size={24} />
              {loading ? "Creating Item..." : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable Input Component
const Input = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-zinc-700 mb-2">{label}</label>
    <input 
      {...props} 
      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-zinc-400 outline-none" 
    />
  </div>
);

export default ItemCreate;