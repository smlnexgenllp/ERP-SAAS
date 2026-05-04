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
  Percent,
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

  // Organization & GST Details
  const [organization, setOrganization] = useState({
    company_name: "",
    address: "",
    gstin: "",
    pan: "",
    phone: "",
    email: "",
  });

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_company: "",
    validity_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [{
      description: "",
      quantity: 1,
      unit_price: 0,
      inventory_id: null
    }],
    notes: "",
    gst_percentage: 18,
  });

  // Fetch lead details
  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sale/qualified-leads/${id}/`);
        setLead(res.data);
      } catch (err) {
        console.error("Failed to load lead:", err);
        setError(err.response?.status === 404
          ? "This lead was not found or you don't have access to it."
          : "Failed to load lead details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  // Fetch Organization + GST Settings
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const res = await api.get("/sale/gst-settings/");
        if (res.data) {
          setOrganization({
            company_name: res.data.company_name || "Your Company Name",
            address: res.data.address || "",
            gstin: res.data.gstin || "",
            pan: res.data.pan || "",
            phone: res.data.phone || "",
            email: res.data.email || "",
          });
          setFormData(prev => ({
            ...prev,
            gst_percentage: res.data.gst_rate || 18,
          }));
        }
      } catch (err) {
        console.log("Using default organization details");
      }
    };
    fetchOrganization();
  }, []);

  // Pre-fill customer info from lead
  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        customer_name: lead.full_name || "Valued Customer",
        customer_email: lead.email || "",
        customer_company: lead.company || "",
      }));
    }
  }, [lead]);

  // Load inventory when form opens
  useEffect(() => {
    if (showQuotationForm && inventoryItems.length === 0) {
      const fetchInventory = async () => {
        try {
          const res = await api.get("/inventory/items-for-quotation/");
          setInventoryItems(res.data || []);
        } catch (err) {
          console.error("Failed to load inventory:", err);
          setFormMessage("Could not load product list. You can enter items manually.");
        }
      };
      fetchInventory();
    }
  }, [showQuotationForm]);

  // Calculations
  const calculations = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    }, 0);
    const gstRate = Number(formData.gst_percentage) || 0;
    const gstAmount = (subtotal * gstRate) / 100;
    const grandTotal = subtotal + gstAmount;
    return { subtotal, gstAmount, grandTotal, gstRate };
  }, [formData.items, formData.gst_percentage]);

  const { subtotal, gstAmount, grandTotal, gstRate } = calculations;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGstChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) value = 0;
    setFormData(prev => ({
      ...prev,
      gst_percentage: Math.max(0, Math.min(100, value))
    }));
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const selectInventoryItem = (index, itemId) => {
    const selectedId = Number(itemId);
    if (!selectedId) return;
    const selected = inventoryItems.find(it => it.id === selectedId);
    if (!selected) return;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      description: `${selected.name} (${selected.code || "N/A"})`,
      unit_price: Number(selected.standard_price) || 0,
      inventory_id: selectedId
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addNewItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: "",
        quantity: 1,
        unit_price: 0,
        inventory_id: null
      }],
    }));
  };

  const removeItem = (index) => {
    const remaining = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: remaining.length > 0
        ? remaining
        : [{ description: "", quantity: 1, unit_price: 0, inventory_id: null }]
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
        total: subtotal,
        gst_percentage: gstRate,
        gst_amount: gstAmount,
        organization: organization,
      };
      await api.post("/sale/quotations/create-from-lead/", payload);
      setFormMessage("Quotation created and sent successfully!");
      setTimeout(() => {
        setShowQuotationForm(false);
        // Optional: navigate back or refresh
      }, 1800);
    } catch (err) {
      console.error(err);
      setFormMessage(err.response?.data?.detail || "Failed to create quotation.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== UI (Matching QuotationsList Theme) ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Error</h2>
          <p className="text-zinc-600 mb-8">{error}</p>
          <button
            onClick={() => navigate("/sales/qualifiedleads")}
            className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium transition"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/sales/qualifiedleads")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Qualified Leads</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Lead: {lead?.full_name || "—"}
                </h1>
                <p className="text-zinc-500">Create quotation from this lead</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Info Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-10">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Lead Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
            <div>
              <p className="text-sm text-zinc-500">Name</p>
              <p className="font-medium text-zinc-900 mt-1">{lead?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Company</p>
              <p className="font-medium text-zinc-900 mt-1">{lead?.company || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Email</p>
              <p className="font-medium text-zinc-900 mt-1 break-all">{lead?.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Phone</p>
              <p className="font-medium text-zinc-900 mt-1">{lead?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Status</p>
              <span className="inline-block px-4 py-1.5 mt-1 bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-medium">
                {lead?.status || "Qualified"}
              </span>
            </div>
          </div>
        </div>

        {/* Create Quotation Button / Form */}
        {!showQuotationForm ? (
          <div className="flex justify-center">
            <button
              onClick={() => setShowQuotationForm(true)}
              className="flex items-center gap-3 px-10 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-3xl text-lg font-medium shadow-sm transition"
            >
              <FileText size={24} />
              Create New Quotation
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
            <h2 className="text-3xl font-bold text-zinc-900 mb-8 flex items-center gap-4">
              <FileText className="text-zinc-700" size={32} />
              New Quotation for {lead?.full_name}
            </h2>

            {formMessage && (
              <div className={`p-5 rounded-2xl mb-8 text-sm font-medium ${
                formMessage.includes("success")
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}>
                {formMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Email *</label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formData.customer_email}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.customer_company}
                    readOnly
                    className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Valid Until *</label>
                  <input
                    type="date"
                    name="validity_date"
                    value={formData.validity_date}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    required
                  />
                </div>
              </div>

              {/* GST Rate */}
              <div className="flex items-center gap-5 bg-zinc-50 border border-zinc-200 rounded-3xl p-6">
                <div className="flex items-center gap-3 text-amber-600">
                  <Percent size={24} />
                  <span className="font-semibold text-zinc-700">GST Rate</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.gst_percentage}
                  onChange={handleGstChange}
                  className="w-28 bg-white border border-zinc-200 rounded-2xl px-5 py-3 text-center text-lg font-semibold focus:outline-none focus:border-zinc-400"
                />
                <span className="font-medium text-zinc-600">%</span>
                <p className="text-zinc-500 text-sm ml-4">You can change this as needed</p>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                    <Calculator size={26} /> Quotation Items
                  </h3>
                  <button
                    type="button"
                    onClick={addNewItem}
                    className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
                  >
                    <Plus size={20} />
                    <span className="font-medium">Add Item</span>
                  </button>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-100">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Description / Product</th>
                          <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Qty</th>
                          <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Unit Price (₹)</th>
                          <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Line Total (₹)</th>
                          <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {formData.items.map((item, index) => (
                          <tr key={index} className="hover:bg-zinc-50">
                            <td className="px-8 py-6">
                              <select
                                value={item.inventory_id || ""}
                                onChange={(e) => selectInventoryItem(index, e.target.value)}
                                className="w-full bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-zinc-900 mb-3 focus:outline-none focus:border-zinc-400"
                              >
                                <option value="">— Select from Inventory —</option>
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
                                className="w-full bg-transparent text-zinc-700 placeholder-zinc-400 focus:outline-none text-sm"
                              />
                            </td>
                            <td className="px-8 py-6">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                className="w-24 mx-auto block bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-center focus:outline-none focus:border-zinc-400"
                                required
                              />
                            </td>
                            <td className="px-8 py-6">
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                                className="w-36 mx-auto block bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-right focus:outline-none focus:border-zinc-400"
                                required
                              />
                            </td>
                            <td className="px-8 py-6 text-right font-semibold text-emerald-600">
                              ₹{((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString('en-IN')}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-500 hover:text-red-600 transition p-2"
                              >
                                <Trash2 size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-zinc-50">
                        <tr>
                          <td colSpan={3} className="px-8 py-6 text-right font-semibold text-zinc-700">Subtotal</td>
                          <td className="px-8 py-6 text-right font-semibold text-emerald-600">₹{subtotal.toLocaleString('en-IN')}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-8 py-6 text-right font-semibold text-zinc-700">GST ({gstRate}%)</td>
                          <td className="px-8 py-6 text-right font-semibold text-emerald-600">₹{gstAmount.toLocaleString('en-IN')}</td>
                          <td></td>
                        </tr>
                        <tr className="border-t border-zinc-200">
                          <td colSpan={3} className="px-8 py-6 text-right text-lg font-bold text-zinc-900">Grand Total</td>
                          <td className="px-8 py-6 text-right text-2xl font-bold text-emerald-600">₹{grandTotal.toLocaleString('en-IN')}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Notes / Terms & Conditions</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-y"
                  placeholder="Payment terms, delivery timeline, warranty, etc..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowQuotationForm(false)}
                  className="px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || grandTotal <= 0}
                  className={`px-10 py-3.5 rounded-2xl font-medium transition ${
                    submitting || grandTotal <= 0
                      ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                  }`}
                >
                  {submitting ? "Creating Quotation..." : "Create & Send Quotation"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}