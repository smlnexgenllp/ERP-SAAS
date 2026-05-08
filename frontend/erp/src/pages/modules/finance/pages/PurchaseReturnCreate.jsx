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
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to create purchase return");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Purchase Return</h1>
              <p className="text-zinc-500">Create return against vendor invoice</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            {error}
          </div>
        )}

        {/* Form Section */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Select Vendor Invoice</label>
              <select
                value={form.invoice}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
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
              <label className="block text-sm font-medium text-zinc-600 mb-2">Return Date</label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Reason (Optional)</label>
              <input
                placeholder="Damaged goods, Wrong item, etc."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        {itemsList.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10 mb-10">
            <h3 className="text-2xl font-semibold text-zinc-900 mb-6">Return Items</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-5 text-left font-semibold text-zinc-600">Item Name</th>
                    <th className="px-6 py-5 text-center font-semibold text-zinc-600">Return Qty</th>
                    <th className="px-6 py-5 text-center font-semibold text-zinc-600">Rate (₹)</th>
                    <th className="px-6 py-5 text-center font-semibold text-zinc-600">Tax (%)</th>
                    <th className="px-6 py-5 text-right font-semibold text-zinc-600">Total Amount</th>
                    <th className="px-6 py-5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {itemsList.map((item, i) => {
                    const base = item.qty * item.rate;
                    const taxAmt = (base * item.tax) / 100;
                    const total = base + taxAmt;

                    return (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="px-6 py-5 font-medium">{item.item_name}</td>
                        <td className="px-6 py-5 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.qty}
                            onChange={(e) => updateItem(i, "qty", e.target.value)}
                            className="w-28 mx-auto border border-zinc-200 rounded-2xl px-4 py-2.5 text-center focus:border-zinc-400"
                          />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(i, "rate", e.target.value)}
                            className="w-32 mx-auto border border-zinc-200 rounded-2xl px-4 py-2.5 text-center focus:border-zinc-400"
                          />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.tax}
                            onChange={(e) => updateItem(i, "tax", e.target.value)}
                            className="w-24 mx-auto border border-zinc-200 rounded-2xl px-4 py-2.5 text-center focus:border-zinc-400"
                          />
                        </td>
                        <td className="px-6 py-5 text-right font-semibold text-zinc-900">
                          ₹{total.toFixed(2)}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => deleteItem(i)}
                            className="text-red-500 hover:text-red-600 p-2 transition"
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

        {/* Grand Total */}
        {totals.total > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-10 flex justify-end">
            <div className="text-right">
              <p className="text-zinc-500">Total Return Amount</p>
              <p className="text-4xl font-bold text-zinc-900">₹{totals.total.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.invoice || itemsList.length === 0}
            className={`px-10 py-4 rounded-2xl font-medium flex items-center gap-3 transition-all text-lg ${
              submitting || !form.invoice || itemsList.length === 0
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-900 hover:bg-zinc-800 text-white"
            }`}
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