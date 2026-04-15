// src/pages/sales/SalesReturn.jsx

import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SalesReturn() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [returnDate, setReturnDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
  });

  // Auto set today's date and fetch invoices
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setReturnDate(today);
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sale/invoices/");
      setInvoices(res.data || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      alert("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice selection
  const handleInvoiceChange = async (e) => {
    const id = e.target.value;
    setSelectedInvoice(id);
    setCustomer("");
    setItems([]);
    setTotals({ subtotal: 0, tax: 0, total: 0 });

    if (!id) return;

    try {
      setLoading(true);
      const res = await api.get(`/sale/invoices/${id}/`);
      const data = res.data;

      setCustomer(data.customer_name || data.customer?.name || "");

      const formattedItems = data.items.map((item) => {
        const soldQty = parseFloat(item.quantity) || 0;
        const alreadyReturned = parseFloat(item.returned_qty) || 0;
        const remainingQty = Math.max(soldQty - alreadyReturned, 0);

        return {
          item: item.item,
          item_name: item.item_name || item.name,
          sold_qty: soldQty,
          already_returned: alreadyReturned,
          remaining_qty: remainingQty,
          return_qty: 0,
          rate: parseFloat(item.rate) || 0,
          tax: parseFloat(item.tax) || parseFloat(item.gst_rate) || 0,
          amount: 0,
        };
      });

      setItems(formattedItems);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      alert("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  // Handle return quantity change
  const handleQtyChange = (index, value) => {
    const updated = [...items];
    let qty = Number(value) || 0;

    if (qty < 0) qty = 0;
    if (qty > updated[index].remaining_qty) {
      alert(`Return quantity cannot exceed remaining quantity (${updated[index].remaining_qty})`);
      qty = updated[index].remaining_qty;
    }

    updated[index].return_qty = qty;

    const base = qty * updated[index].rate;
    const taxAmt = (base * updated[index].tax) / 100;

    updated[index].amount = base + taxAmt;

    setItems(updated);
    calculateTotals(updated);
  };

  // Calculate totals
  const calculateTotals = (itemsList) => {
    let subtotal = 0;
    let tax = 0;

    itemsList.forEach((item) => {
      const base = item.return_qty * item.rate;
      const taxAmt = (base * item.tax) / 100;

      subtotal += base;
      tax += taxAmt;
    });

    setTotals({
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number((subtotal + tax).toFixed(2)),
    });
  };

  // Save Sales Return
  const handleSave = async () => {
    if (!selectedInvoice) {
      alert("Please select an invoice");
      return;
    }
    if (!returnDate) {
      alert("Please select return date");
      return;
    }

    const filteredItems = items
      .filter((i) => i.return_qty > 0)
      .map((i) => ({
        item: i.item,
        qty: i.return_qty,
        rate: i.rate,
        tax: i.tax,
      }));

    if (filteredItems.length === 0) {
      alert("Please enter at least one return quantity");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/sale/invoices/returns/", {
        invoice: parseInt(selectedInvoice),
        return_date: returnDate,
        items: filteredItems,
      });

      alert("Sales Return / Credit Note created successfully ✅");
      navigate(-1);
    } catch (err) {
      console.error("Save error:", err);
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.detail || 
        "Failed to create sales return. Please try again.";
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ArrowLeft 
          onClick={() => navigate(-1)} 
          className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition" 
          size={28} 
        />
        <h1 className="text-3xl font-bold">Sales Return / Credit Note</h1>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Invoice Selection */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-cyan-200">Select Invoice</h2>
          
          <select
            className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-3 rounded-lg outline-none focus:border-cyan-400"
            value={selectedInvoice}
            onChange={handleInvoiceChange}
            disabled={loading}
          >
            <option value="">-- Select Invoice --</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoice_number} - {inv.customer_name || inv.customer?.name}
              </option>
            ))}
          </select>

          {customer && (
            <div className="mt-4 p-4 bg-gray-800/60 border border-cyan-700 rounded-lg">
              <p className="text-cyan-400 text-sm">Customer</p>
              <p className="text-lg font-medium text-cyan-100">{customer}</p>
            </div>
          )}
        </div>

        {/* Return Date */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
          <label className="block text-cyan-400 text-sm mb-2">Return Date</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-3 rounded-lg outline-none focus:border-cyan-400"
          />
        </div>

        {/* Items Table */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold mb-5 text-cyan-200">Return Items</h3>

          {items.length === 0 && selectedInvoice ? (
            <p className="text-cyan-400 py-12 text-center">Loading invoice items...</p>
          ) : items.length === 0 ? (
            <p className="text-cyan-500 py-12 text-center">Please select an invoice first</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-950 border-b border-cyan-800">
                    <th className="p-4 text-left text-cyan-400 font-medium">Item Name</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Sold Qty</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Already Returned</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Remaining Qty</th>
                    <th className="p-4 text-center text-cyan-400 font-medium">Return Qty</th>
                    <th className="p-4 text-right text-cyan-400 font-medium">Rate (₹)</th>
                    <th className="p-4 text-right text-cyan-400 font-medium">Tax (%)</th>
                    <th className="p-4 text-right text-cyan-400 font-medium">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-800/50 transition">
                      <td className="p-4 text-cyan-100">{item.item_name}</td>
                      <td className="p-4 text-center text-cyan-200">{item.sold_qty}</td>
                      <td className="p-4 text-center text-orange-400">
                        {item.already_returned}
                      </td>
                      <td className="p-4 text-center font-medium text-green-400">
                        {item.remaining_qty}
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.remaining_qty}
                          step="0.01"
                          value={item.return_qty}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          disabled={item.remaining_qty <= 0}
                          className="bg-gray-800 border border-cyan-700 text-cyan-200 w-28 text-center py-2 rounded-lg outline-none focus:border-cyan-400 disabled:opacity-50"
                        />
                      </td>
                      <td className="p-4 text-right text-cyan-200">₹{item.rate.toFixed(2)}</td>
                      <td className="p-4 text-right text-cyan-200">{item.tax}%</td>
                      <td className="p-4 text-right font-medium text-green-400">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Totals */}
        {totals.total > 0 && (
          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-10">
            <div className="flex justify-end">
              <div className="text-right space-y-3">
                <p className="text-cyan-300">
                  Subtotal: <span className="font-medium text-cyan-100">₹{totals.subtotal.toFixed(2)}</span>
                </p>
                <p className="text-cyan-300">
                  Tax: <span className="font-medium text-cyan-100">₹{totals.tax.toFixed(2)}</span>
                </p>
                <div className="border-t border-cyan-700 pt-3">
                  <h3 className="text-3xl font-bold text-green-400">
                    Total Return Amount: ₹{totals.total.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-cyan-700 text-cyan-300 rounded-xl font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={submitting || !selectedInvoice || totals.total === 0}
            className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
              ${submitting || !selectedInvoice || totals.total === 0
                ? "bg-gray-700 cursor-not-allowed text-gray-400"
                : "bg-blue-600 hover:bg-blue-700 text-white"}`}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Create Sales Return
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}