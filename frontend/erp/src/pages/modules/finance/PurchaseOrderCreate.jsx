import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiX } from "react-icons/fi";
import api from "../../../services/api";

export default function PurchaseOrderCreate() {
  const [loading, setLoading] = useState(false);
  const [itemsList, setItemsList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    vendor: "",
    department: "",
    tax_percentage: 0,
    items: [],
  });

  const [errors, setErrors] = useState({});

  // ── Data Fetching ──────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, vendorsRes, deptRes] = await Promise.all([
          api.get("/inventory/items/"),
          api.get("/finance/vendors/"),
          api.get("/hr/departments/"),
        ]);

        setItemsList(itemsRes.data);
        setVendors(vendorsRes.data.filter((v) => v.is_approved === true));
        setDepartments(deptRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    fetchData();
  }, []);

  // ── Form Handlers ──────────────────────────────────────────────
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { item: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const newItems = [...prev.items];

      if (field === "item") {
        const itemId = Number(value);
        const selected = itemsList.find((it) => it.id === itemId);
        newItems[index] = {
          ...newItems[index],
          item: itemId,
          unit_price: selected?.standard_price ?? 0,
        };
      } else {
        newItems[index][field] = 
          (field === "quantity" || field === "unit_price")
            ? Number(value) || 0
            : value;
      }

      return { ...prev, items: newItems };
    });
  };

  const handleTaxChange = (e) => {
    let val = e.target.value === "" ? 0 : Number(e.target.value);
    val = Math.max(0, Math.min(100, val));
    setForm((prev) => ({ ...prev, tax_percentage: val }));
  };

  // ── Calculations ───────────────────────────────────────────────
  const getItemTotal = (item) => (item.quantity * item.unit_price) || 0;

  const subtotal = form.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const taxAmount = (subtotal * form.tax_percentage) / 100;
  const grandTotal = subtotal + taxAmount;

  // ── Validation & Submit ────────────────────────────────────────
  const validateForm = () => {
  const newErrors = {};

  if (!form.department) newErrors.department = "Department is required";
  if (!form.vendor) newErrors.vendor = "Vendor is required";
  if (form.items.length === 0) newErrors.items = "Add at least one item";

  form.items.forEach((item, idx) => {
    if (!item.item || item.item === "" || isNaN(Number(item.item))) {
      newErrors[`item_${idx}`] = "Select a valid item";
    }
    if (!item.quantity || item.quantity <= 0) {
      newErrors[`quantity_${idx}`] = "Quantity must be > 0";
    }
    if (!item.unit_price || item.unit_price < 0) {
      newErrors[`unit_price_${idx}`] = "Unit price cannot be negative";
    }
  });

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        vendor: form.vendor,
        department: form.department,
        tax_percentage: form.tax_percentage,
        items: form.items.map(item => ({
          item: item.item,
          ordered_qty: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      await api.post("/inventory/purchase-orders/", payload);
      
      alert("Purchase Order created successfully!");
      setForm({ vendor: "", department: "", tax_percentage: 0, items: [] });
      setErrors({});
    } catch (err) {
      console.error("PO creation error:", err?.response?.data || err);
      alert("Failed to create Purchase Order. Please check the form.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-cyan-300 mb-10">
          Create Purchase Order
        </h1>

        {/* Main Card */}
        <div className="bg-gray-900/90 border border-cyan-900/60 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-cyan-900/50">
            <h2 className="text-xl md:text-2xl font-semibold text-cyan-300 flex items-center gap-3">
              <FiPlus className="text-cyan-400" /> New Purchase Order
            </h2>
          </div>

          <div className="p-6 md:p-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div>
                <label className="block text-sm text-cyan-400/90 font-medium mb-2">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-all ${
                    errors.department ? 'border-red-500' : 'border-gray-700'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-400">{errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-cyan-400/90 font-medium mb-2">
                  Vendor <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-all ${
                    errors.vendor ? 'border-red-500' : 'border-gray-700'
                  }`}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.vendor && (
                  <p className="mt-1 text-sm text-red-400">{errors.vendor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-cyan-400/90 font-medium mb-2">
                  Tax Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.tax_percentage}
                  onChange={handleTaxChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-right text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-cyan-300">Order Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 bg-cyan-700 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <FiPlus /> Add Item
                </button>
              </div>

              {errors.items && (
                <p className="mb-4 text-red-400 text-sm">{errors.items}</p>
              )}

              <div className="overflow-x-auto rounded-lg border border-cyan-900/40">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-800/70">
                    <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 text-left font-medium">Item</th>
                      <th className="px-6 py-4 text-center font-medium w-28">Quantity</th>
                      <th className="px-6 py-4 text-right font-medium w-40">Unit Price</th>
                      <th className="px-6 py-4 text-right font-medium w-40">Total</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <select
                            value={item.item}
                            onChange={(e) => updateItem(idx, "item", e.target.value)}
                            className={`w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-cyan-50 focus:outline-none focus:border-cyan-600 ${
                              errors[`item_${idx}`] ? 'border-red-500' : 'border-gray-700'
                            }`}
                          >
                            <option value="">Select item...</option>
                            {itemsList.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} ({it.code})
                              </option>
                            ))}
                          </select>
                          {errors[`item_${idx}`] && (
                            <p className="mt-1 text-xs text-red-400">{errors[`item_${idx}`]}</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-center text-cyan-50 focus:outline-none focus:border-cyan-600 ${
                              errors[`quantity_${idx}`] ? 'border-red-500' : 'border-gray-700'
                            }`}
                          />
                          {errors[`quantity_${idx}`] && (
                            <p className="mt-1 text-xs text-red-400">{errors[`quantity_${idx}`]}</p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-right text-cyan-50 focus:outline-none focus:border-cyan-600"
                          />
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-cyan-200">
                          ₹ {getItemTotal(item).toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Remove item"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {form.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500 italic">
                          No items added yet. Click "Add Item" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {form.items.length > 0 && (
                    <tfoot className="bg-gray-800/60">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-cyan-200">
                          Subtotal
                        </td>
                        <td className="px-6 py-4 text-right text-cyan-200">
                          ₹ {subtotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-cyan-200">
                          Tax ({form.tax_percentage}%)
                        </td>
                        <td className="px-6 py-4 text-right text-cyan-200">
                          ₹ {taxAmount.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="border-t border-cyan-800">
                        <td colSpan={3} className="px-6 py-5 text-right text-lg font-semibold text-cyan-100">
                          Grand Total
                        </td>
                        <td className="px-6 py-5 text-right text-xl font-bold text-cyan-300">
                          ₹ {grandTotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-10">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Discard changes and go back?")) {
                    window.history.back();
                  }
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-cyan-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiX /> Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !form.vendor || !form.department || form.items.length === 0}
                className={`px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-green-900/30 ${
                  loading || !form.vendor || !form.department || form.items.length === 0
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {loading ? "Creating..." : (
                  <>
                    <FiSave /> Create Purchase Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}