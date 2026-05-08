// src/pages/PurchaseOrderCreate.jsx
import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2, FiSave, FiX, FiArrowLeft } from "react-icons/fi";
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
      if (!item.item) newErrors[`item_${idx}`] = "Select a valid item";
      if (!item.quantity || item.quantity <= 0) newErrors[`quantity_${idx}`] = "Quantity must be > 0";
      if (item.unit_price < 0) newErrors[`unit_price_${idx}`] = "Unit price cannot be negative";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        vendor: Number(form.vendor),
        department: form.department,
        tax_percentage: Number(form.tax_percentage) || 0,
        items: form.items.map(item => ({
          item: Number(item.item),
          ordered_qty: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      await api.post("/inventory/purchase-orders/", payload);
      
      alert("Purchase Order created successfully!");
      
      // Reset form
      setForm({
        vendor: "",
        department: "",
        tax_percentage: 0,
        items: [],
      });
      setErrors({});
    } catch (err) {
      console.error("PO creation error:", err?.response?.data || err);
      const errorMsg = err.response?.data?.detail || "Failed to create Purchase Order";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (window.confirm("Discard changes and go back?")) {
      window.history.back();
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Create Purchase Order
                </h1>
                <p className="text-zinc-500">Add new purchase order with items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          
          <div className="px-8 py-6 border-b border-zinc-100">
            <h2 className="text-2xl font-semibold text-zinc-900">New Purchase Order</h2>
          </div>

          <div className="p-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={`w-full bg-white border rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 ${
                    errors.department ? 'border-red-500' : 'border-zinc-200'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className={`w-full bg-white border rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 ${
                    errors.vendor ? 'border-red-500' : 'border-zinc-200'
                  }`}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                {errors.vendor && <p className="mt-1 text-sm text-red-500">{errors.vendor}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Tax Percentage (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.tax_percentage}
                  onChange={handleTaxChange}
                  className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-right focus:outline-none focus:border-zinc-400"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-semibold text-zinc-900">Order Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl transition"
                >
                  <FiPlus /> Add Item
                </button>
              </div>

              {errors.items && <p className="mb-4 text-red-500">{errors.items}</p>}

              <div className="border border-zinc-200 rounded-3xl overflow-hidden">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-5 text-left font-semibold text-zinc-600">Item</th>
                      <th className="px-6 py-5 text-center font-semibold text-zinc-600 w-28">Quantity</th>
                      <th className="px-6 py-5 text-right font-semibold text-zinc-600 w-40">Unit Price</th>
                      <th className="px-6 py-5 text-right font-semibold text-zinc-600 w-40">Total</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="px-6 py-5">
                          <select
                            value={item.item}
                            onChange={(e) => updateItem(idx, "item", e.target.value)}
                            className={`w-full border rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 ${
                              errors[`item_${idx}`] ? 'border-red-500' : 'border-zinc-200'
                            }`}
                          >
                            <option value="">Select item...</option>
                            {itemsList.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} ({it.code})
                              </option>
                            ))}
                          </select>
                          {errors[`item_${idx}`] && <p className="mt-1 text-xs text-red-500">{errors[`item_${idx}`]}</p>}
                        </td>

                        <td className="px-6 py-5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                            className={`w-full border rounded-2xl px-5 py-3 text-center focus:outline-none focus:border-zinc-400 ${
                              errors[`quantity_${idx}`] ? 'border-red-500' : 'border-zinc-200'
                            }`}
                          />
                        </td>

                        <td className="px-6 py-5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                            className="w-full border border-zinc-200 rounded-2xl px-5 py-3 text-right focus:outline-none focus:border-zinc-400"
                          />
                        </td>

                        <td className="px-6 py-5 text-right font-semibold text-zinc-900">
                          ₹ {getItemTotal(item).toFixed(2)}
                        </td>

                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-600 transition p-2"
                          >
                            <FiTrash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {form.items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-zinc-500">
                          No items added yet. Click "Add Item" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {form.items.length > 0 && (
                    <tfoot className="bg-zinc-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-5 text-right text-zinc-600">Subtotal</td>
                        <td className="px-6 py-5 text-right font-medium">₹ {subtotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-6 py-5 text-right text-zinc-600">
                          Tax ({form.tax_percentage}%)
                        </td>
                        <td className="px-6 py-5 text-right font-medium">₹ {taxAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t border-zinc-200">
                        <td colSpan={3} className="px-6 py-6 text-right text-lg font-semibold">Grand Total</td>
                        <td className="px-6 py-6 text-right text-2xl font-bold text-zinc-900">
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
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleGoBack}
                className="px-8 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-2xl flex items-center gap-2 text-zinc-700"
              >
                <FiX /> Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || !form.vendor || !form.department || form.items.length === 0}
                className={`px-10 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                  loading || !form.vendor || !form.department || form.items.length === 0
                    ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
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