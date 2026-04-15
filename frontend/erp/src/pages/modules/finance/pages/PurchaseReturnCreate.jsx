import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, Save, Loader2 } from "lucide-react";

export default function PurchaseReturnCreate() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    invoice: "",
    return_date: "",
    reason: "",
  });

  const [totals, setTotals] = useState({
    total: 0,
  });

  useEffect(() => {
    fetchInvoices();
    // Set today's date by default
    const today = new Date().toISOString().split("T")[0];
    setForm(prev => ({ ...prev, return_date: today }));
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/inventory/vendor-invoices/");
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvoiceChange = async (value) => {
    setError("");
    setForm((prev) => ({ ...prev, invoice: value }));

    if (!value) {
      setItemsList([]);
      setTotals({ total: 0 });
      return;
    }

    try {
      setLoading(true);
      const invoiceRes = await api.get(`/inventory/vendor-invoices/${value}/`);
      const invoice = invoiceRes.data;

      if (!invoice.grn) {
        setError("No GRN found for this invoice.");
        return;
      }

      const grnRes = await api.get(`/inventory/grns/${invoice.grn}/`);
      const grn = grnRes.data;

      const items = (grn.items || []).map((i) => ({
        item: i.item,
        item_name: i.item_name || "Item",
        qty: 0,
        rate: Number(i.rate || 0),
        tax: 18,
      }));

      setItemsList(items);
      calculateTotals(items);
    } catch (err) {
      setError("Failed to load items from GRN");
      setItemsList([]);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...itemsList];
    updated[index][field] = Number(value) || 0;
    setItemsList(updated);
    calculateTotals(updated);
  };

  const deleteItem = (index) => {
    const updated = itemsList.filter((_, i) => i !== index);
    setItemsList(updated);
    calculateTotals(updated);
  };

  const calculateTotals = (items) => {
    let total = 0;
    items.forEach((i) => {
      const base = i.qty * i.rate;
      const tax = (base * i.tax) / 100;
      total += base + tax;
    });

    setTotals({ total: Number(total.toFixed(2)) });
  };

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({ 
      invoice: "", 
      return_date: today, 
      reason: "" 
    });
    setItemsList([]);
    setTotals({ total: 0 });
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (!form.invoice) {
      setError("Please select an invoice");
      return;
    }
    if (!form.return_date) {
      setError("Please select return date");
      return;
    }
    if (itemsList.filter(i => i.qty > 0).length === 0) {
      setError("Please enter at least one return quantity");
      return;
    }

    const payload = {
      invoice: Number(form.invoice),
      return_date: form.return_date,
      reason: form.reason || "Purchase Return",
      items: itemsList
        .filter((i) => i.qty > 0)
        .map((i) => ({
          item: Number(i.item),
          qty: Number(i.qty),
          rate: Number(i.rate),
          tax: Number(i.tax),
        })),
    };

    setSubmitting(true);
    try {
      await api.post("/inventory/purchase-returns/", payload);
      alert("✅ Purchase Return Created Successfully!");

      resetForm();   // Stay on same page and reset form
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to create purchase return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ArrowLeft 
              onClick={() => navigate(-1)} 
              className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition" 
              size={28} 
            />
            <h1 className="text-3xl font-bold">Purchase Return</h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-400 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-cyan-400 text-sm mb-2">Select Vendor Invoice</label>
              <select
                value={form.invoice}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-3 rounded-lg outline-none focus:border-cyan-400"
                disabled={loading}
              >
                <option value="">-- Select Invoice --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-cyan-400 text-sm mb-2">Return Date</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-cyan-400 text-sm mb-2">Reason (Optional)</label>
              <input
                placeholder="Damaged goods / Wrong item / etc."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        {itemsList.length > 0 && (
          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold mb-5 text-cyan-200">Return Items</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-950 border-b border-cyan-800">
                    <th className="p-4 text-left text-cyan-400 font-medium">Item Name</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Return Qty</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Rate (₹)</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Tax (%)</th>
                    <th className="p-4 text-right text-cyan-400 font-medium">Total Amount</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900">
                  {itemsList.map((item, i) => {
                    const base = item.qty * item.rate;
                    const taxAmt = (base * item.tax) / 100;
                    const total = base + taxAmt;

                    return (
                      <tr key={i} className="hover:bg-gray-800/60 transition">
                        <td className="p-4 text-cyan-100">{item.item_name}</td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.qty}
                            onChange={(e) => updateItem(i, "qty", e.target.value)}
                            className="bg-gray-800 border border-cyan-700 text-cyan-200 w-24 text-center py-2 rounded-lg outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(i, "rate", e.target.value)}
                            className="bg-gray-800 border border-cyan-700 text-cyan-200 w-28 text-center py-2 rounded-lg outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.tax}
                            onChange={(e) => updateItem(i, "tax", e.target.value)}
                            className="bg-gray-800 border border-cyan-700 text-cyan-200 w-20 text-center py-2 rounded-lg outline-none focus:border-cyan-400"
                          />
                        </td>
                        <td className="p-4 text-right font-medium text-green-400">
                          ₹{total.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => deleteItem(i)}
                            className="text-red-400 hover:text-red-500 transition p-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total */}
        {totals.total > 0 && (
          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-10">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-cyan-400 text-lg">Total Return Amount</p>
                <p className="text-4xl font-bold text-green-400">
                  ₹{totals.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.invoice || itemsList.length === 0}
            className={`px-10 py-4 rounded-xl font-medium flex items-center gap-3 transition-all text-lg
              ${submitting || !form.invoice || itemsList.length === 0
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {submitting ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Saving Purchase Return...
              </>
            ) : (
              <>
                <Save size={22} />
                Create Purchase Return
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}