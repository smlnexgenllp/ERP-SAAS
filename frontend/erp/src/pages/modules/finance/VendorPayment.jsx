// src/pages/finance/VendorPayment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { 
  FiArrowLeft,
  FiCreditCard,
  FiSearch,
  FiCheckCircle,
  FiDollarSign 
} from "react-icons/fi";

export default function VendorPayment() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setCurrentPage(1); // Reset to first page on refresh
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
    setCurrentPage(1); // Reset to first page when search changes
  }, [search, invoices]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

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
      
      setAmount("");
      setRef("");
      setSelectedInvoice(null);
      
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
        return "bg-emerald-100 text-emerald-700";
      case "partial":
        return "bg-amber-100 text-amber-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiCreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Vendor Payments
                </h1>
                <p className="text-zinc-500">Record payments against vendor invoices</p>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice, vendor, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
            <p className="ml-4 text-zinc-500">Loading vendor invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl py-20 text-center text-zinc-500">
            No vendor invoices found.
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">Invoice #</th>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Paid</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Balance</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-zinc-50 transition-colors ${
                        selectedInvoice?.id === inv.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-8 py-6 font-medium text-zinc-900">
                        {inv.invoice_number}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">{inv.vendor}</td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹{Number(inv.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-8 py-6 text-right text-zinc-700">
                        ₹{Number(inv.paid || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-8 py-6 text-right font-semibold text-orange-600">
                        ₹{Number(inv.balance || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${getStatusBadge(inv.status)}`}
                        >
                          {inv.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          disabled={inv.status === "paid"}
                          className="flex items-center gap-2 mx-auto px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiDollarSign size={18} />
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-zinc-100 flex items-center justify-between bg-white">
                <div className="text-sm text-zinc-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} 
                  {' '}of {filteredInvoices.length} invoices
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>

                  <div className="px-6 py-2.5 bg-zinc-100 rounded-2xl font-medium text-sm">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Form */}
        {selectedInvoice && (
          <div className="mt-10 bg-white border border-zinc-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                <FiCreditCard size={28} />
                Record Payment
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-3xl text-zinc-400 hover:text-zinc-600 transition"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-zinc-500 text-sm">Invoice Number</p>
                <p className="font-semibold text-lg text-zinc-900">{selectedInvoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-sm">Vendor</p>
                <p className="font-semibold text-lg text-zinc-900">{selectedInvoice.vendor}</p>
              </div>
            </div>

            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 mb-8">
              <div className="flex justify-between text-lg">
                <span className="text-zinc-600">Balance Due</span>
                <span className="font-bold text-orange-600">
                  ₹{Number(selectedInvoice.balance || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none text-lg"
                />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">
                  Reference Number (UTR / Cheque No)
                </label>
                <input
                  type="text"
                  placeholder="Enter reference number"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={payLoading || !amount}
              className="w-full mt-10 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold text-lg transition disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {payLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <FiCheckCircle size={24} />
                  Confirm & Record Payment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}