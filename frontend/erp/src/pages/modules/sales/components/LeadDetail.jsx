// src/pages/sales/LeadDetail.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import {
  ArrowLeft,
  FileText,
  Calculator,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const [inventoryItems, setInventoryItems] = useState([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_company: "",
    validity_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [{ description: "", quantity: 1, unit_price: 0 }],
    notes: "",
  });

  // Fetch lead details once on mount
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/sale/qualified-leads/${id}/`);
        setLead(res.data);
      } catch (err) {
        console.error("Failed to load lead:", err);
        setError(
          err.response?.status === 404
            ? "This lead was not found or you don't have access to it."
            : "Failed to load lead details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  // Pre-fill form when lead data is available
  useEffect(() => {
    if (lead) {
      setFormData((prev) => ({
        ...prev,
        customer_name: lead.full_name || prev.customer_name || "Valued Customer",
        customer_email: lead.email || prev.customer_email || "",
        customer_company: lead.company || prev.customer_company || "",
      }));
    }
  }, [lead]);

  // Load inventory items when quotation form is opened
  useEffect(() => {
    if (showQuotationForm && inventoryItems.length === 0) {
      const fetchInventory = async () => {
        try {
          const res = await api.get("/inventory/items-for-quotation/");
          setInventoryItems(res.data || []);
        } catch (err) {
          console.error("Failed to load inventory:", err);
          setFormMessage("Could not load product list. Enter items manually.");
        }
      };
      fetchInventory();
    }
  }, [showQuotationForm, inventoryItems.length]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }, 0);
  }, [formData.items]);

  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const selectInventoryItem = (index, itemId) => {
    if (!itemId) return;
    const selected = inventoryItems.find((it) => it.id === Number(itemId));
    if (selected) {
      updateItem(index, "description", `${selected.name} (${selected.code || "N/A"})`);
      updateItem(index, "unit_price", Number(selected.standard_price) || 0);
    }
  };

  const addNewItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItem = (index) => {
    const remaining = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: remaining.length > 0 ? remaining : [{ description: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (grandTotal <= 0) {
      setFormMessage("Please add at least one valid item.");
      return;
    }

    setSubmitting(true);
    setFormMessage("");

    try {
      const payload = {
        lead_id: id,
        ...formData,
        total: subtotal, // backend will add GST
      };

      const response = await api.post("/sale/quotations/create-from-lead/", payload);

      setFormMessage("Quotation created and sent successfully!");
      setTimeout(() => {
        setShowQuotationForm(false);
        // Optional: redirect to quotations list
        // navigate("/sales/quotations");
      }, 1800);
    } catch (err) {
      console.error(err);
      setFormMessage(
        err.response?.data?.detail ||
        "Failed to create quotation. Please check your input."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          Loading lead details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-900/90 backdrop-blur-lg p-10 rounded-2xl border border-red-900/50 text-center max-w-md w-full shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-3">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate("/sales/qualifiedleads")}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl text-white font-medium shadow-lg transition"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button
            onClick={() => navigate("/sales/qualifiedleads")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Qualified Leads</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-300">
            Lead: {lead?.full_name || "—"}
          </h1>
        </div>

        {/* Lead Info Card */}
        <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 md:p-8 shadow-xl mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="text-lg font-medium">{lead?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Company</p>
              <p className="text-lg font-medium">{lead?.company || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-lg font-medium break-all">{lead?.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Phone</p>
              <p className="text-lg font-medium">{lead?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <span className="inline-block px-3 py-1 bg-green-900/60 text-green-300 rounded-full text-sm font-medium">
                {lead?.status || "Qualified"}
              </span>
            </div>
          </div>
        </div>

        {/* Quotation Section */}
        {!showQuotationForm ? (
          <div className="flex justify-center">
            <button
              onClick={() => setShowQuotationForm(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all text-lg font-medium"
            >
              <FileText size={22} />
              Create Quotation
            </button>
          </div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-purple-300 mb-6 flex items-center gap-3">
              <FileText size={24} />
              New Quotation for {lead?.full_name || "this lead"}
            </h2>

            {formMessage && (
              <div
                className={`p-4 rounded-xl mb-6 ${
                  formMessage.includes("success")
                    ? "bg-green-900/50 border border-green-700 text-green-300"
                    : "bg-red-900/50 border border-red-700 text-red-300"
                }`}
              >
                {formMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email (receives PDF) *</label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.customer_company}
                    readOnly
                    className="w-full bg-gray-700/50 border border-gray-700 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Valid Until *</label>
                  <input
                    type="date"
                    name="validity_date"
                    value={formData.validity_date}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-cyan-300 flex items-center gap-2">
                    <Calculator size={20} /> Items
                  </h3>
                  <button
                    type="button"
                    onClick={addNewItem}
                    className="flex items-center gap-2 px-5 py-2 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-lg transition"
                  >
                    <Plus size={18} /> Add Item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Description / Product</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Qty</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Unit Price (₹)</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Line Total (₹)</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700 bg-gray-900/40">
                      {formData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <select
                              value={
                                inventoryItems.find(
                                  (it) => item.description?.startsWith(it.name)
                                )?.id || ""
                              }
                              onChange={(e) => selectInventoryItem(index, e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 mb-2"
                            >
                              <option value="">— Select Product —</option>
                              {inventoryItems.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name} ({prod.code}) – ₹{Number(prod.standard_price || 0).toFixed(2)}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="Or enter custom description"
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-gray-300 placeholder-gray-500 text-sm"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              className="w-20 mx-auto block bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-gray-200"
                              required
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                              className="w-32 mx-auto block bg-gray-800 border border-gray-700 rounded px-3 py-2 text-right text-gray-200"
                              required
                            />
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-emerald-400">
                            ₹{((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-400 hover:text-red-300 transition p-1"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-800/80">
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-200">
                          Subtotal
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400">
                          ₹{subtotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right font-semibold text-gray-200">
                          GST (18%)
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400">
                          ₹{gst.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="px-6 py-4 text-right text-lg text-gray-200">
                          Grand Total
                        </td>
                        <td className="px-6 py-4 text-right text-xl text-emerald-400">
                          ₹{grandTotal.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Notes / Terms & Conditions
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-purple-500 focus:ring-purple-500 outline-none resize-y"
                  placeholder="Payment terms, delivery timeline, special instructions, thank you message..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowQuotationForm(false)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 transition order-2 sm:order-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || grandTotal <= 0}
                  className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition order-1 sm:order-2 ${
                    submitting || grandTotal <= 0
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  }`}
                >
                  {submitting ? "Sending..." : "Create & Send Quotation"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}