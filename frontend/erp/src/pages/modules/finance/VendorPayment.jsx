// src/pages/finance/VendorPayment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  ArrowLeft,
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  IndianRupee,
} from "lucide-react";

export default function VendorPayment() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/vendor-invoices/summary/");
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error("Failed to fetch vendor invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    const filtered = invoices.filter((inv) =>
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor?.toLowerCase().includes(search.toLowerCase()) ||
      inv.status?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [search, invoices]);

  const handlePay = async () => {
    if (!selectedInvoice || !amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > parseFloat(selectedInvoice.balance)) {
      alert("Payment amount cannot exceed the balance!");
      return;
    }

    setPayLoading(true);
    try {
      await api.post("/inventory/vendor-payments/", {
        invoice: selectedInvoice.id,
        amount: parseFloat(amount),
        payment_mode: mode,
        reference_number: ref.trim(),
      });

      alert("Payment recorded successfully!");
      
      // Reset form
      setAmount("");
      setRef("");
      setSelectedInvoice(null);
      
      // Refresh data
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.detail || "Payment failed. Please try again.");
    } finally {
      setPayLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-900/70 text-green-300 border border-green-700/50";
      case "partial":
        return "bg-yellow-900/70 text-yellow-300 border border-yellow-700/50";
      case "overdue":
        return "bg-red-900/70 text-red-300 border border-red-700/50";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  const statusColor = (status) => {
    if (status === "paid") return "text-green-400";
    if (status === "partial") return "text-yellow-400";
    if (status === "overdue") return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <CreditCard className="text-cyan-400" size={28} />
              <h1 className="text-3xl font-bold text-cyan-300">Vendor Payments</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by invoice, vendor, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading vendor invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No vendor invoices found.
          </div>
        ) : (
          <div className="bg-gray-900/70 rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Invoice #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Vendor</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Total</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Paid</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Balance</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-gray-800/50 transition-colors ${
                        selectedInvoice?.id === inv.id ? "bg-cyan-950/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-200">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{inv.vendor}</td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-400">
                        ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        ₹{Number(inv.paid || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-400">
                        ₹{Number(inv.balance || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            inv.status
                          )}`}
                        >
                          {inv.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="flex items-center gap-2 mx-auto px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-medium transition disabled:opacity-50"
                          disabled={inv.status === "paid"}
                        >
                          <IndianRupee size={16} />
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Form - Modern Sidebar Style */}
        {selectedInvoice && (
          <div className="mt-8 bg-gray-900/70 border border-green-900/50 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-green-300 flex items-center gap-3">
                <CreditCard size={26} />
                Make Payment
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-400 hover:text-gray-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-gray-400 text-sm">Invoice Number</p>
                <p className="font-semibold text-lg">{selectedInvoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Vendor</p>
                <p className="font-semibold text-lg">{selectedInvoice.vendor}</p>
              </div>
            </div>

            <div className="bg-gray-950 rounded-xl p-5 mb-6 border border-cyan-900/30">
              <div className="flex justify-between text-lg">
                <span className="text-gray-400">Balance Due</span>
                <span className="font-bold text-orange-400">
                  ₹{Number(selectedInvoice.balance || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-green-500 outline-none"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Reference Number (UTR / Cheque No)
                </label>
                <input
                  type="text"
                  placeholder="Enter reference number"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={payLoading || !amount}
              className="w-full mt-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-2xl font-semibold text-lg transition disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {payLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle size={22} />
                  Confirm Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}