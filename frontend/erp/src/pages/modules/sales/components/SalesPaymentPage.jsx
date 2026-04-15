import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import {
  ArrowLeft,
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SalesPaymentPage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
      const res = await api.get("/sale/invoices/");
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    let data = invoices;

    if (search) {
      data = data.filter(
        (inv) =>
          inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
          inv.customer_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      data = data.filter((inv) => inv.status === statusFilter);
    }

    setFilteredInvoices(data);
  }, [search, statusFilter, invoices]);

  // Payment Handler
  const handlePay = async () => {
    if (!selectedInvoice || !amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const balance = parseFloat(selectedInvoice.grand_total || 0) - 
                    parseFloat(selectedInvoice.amount_paid || 0);

    if (parseFloat(amount) > balance) {
      alert("Amount exceeds remaining balance");
      return;
    }

    setPayLoading(true);
    try {
      await api.post("/sale/payments/", {
        invoice: selectedInvoice.id,
        amount: parseFloat(amount),
        mode,
        reference: ref,
      });

      alert("✅ Payment recorded successfully!");

      setSelectedInvoice(null);
      setAmount("");
      setRef("");

      fetchInvoices(); // Refresh to get updated amount_paid
    } catch (err) {
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  // Status Badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-900 text-green-300";
      case "partial":
        return "bg-yellow-900 text-yellow-300";
      case "issued":
        return "bg-blue-900 text-blue-300";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-800 px-4 py-2 rounded-xl hover:bg-gray-700 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-cyan-300">Sales Payments</h1>
          </div>

          {/* Filters */}
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl w-80 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 px-5 py-3 rounded-xl focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="issued">Issued</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-gray-900 rounded-3xl border border-cyan-900/30 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-5 text-left">Invoice</th>
                <th className="p-5 text-left">Customer</th>
                <th className="p-5 text-right">Total</th>
                <th className="p-5 text-right">Paid</th>
                <th className="p-5 text-right">Balance</th>
                <th className="p-5 text-center">Status</th>
                <th className="p-5 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((inv) => {
                const total = parseFloat(inv.grand_total || 0);
                const paid = parseFloat(inv.amount_paid || 0);
                const balance = total - paid;

                return (
                  <tr key={inv.id} className="border-t border-gray-800 hover:bg-gray-800/70 transition">
                    <td className="p-5 font-mono text-cyan-300">{inv.invoice_number}</td>
                    <td className="p-5">{inv.customer_name}</td>

                    <td className="p-5 text-right text-green-400 font-medium">
                      ₹{total.toLocaleString("en-IN")}
                    </td>

                    <td className="p-5 text-right text-emerald-400 font-medium">
                      ₹{paid.toLocaleString("en-IN")}
                    </td>

                    <td className="p-5 text-right text-orange-400 font-semibold">
                      ₹{balance.toLocaleString("en-IN")}
                    </td>

                    <td className="p-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider ${getStatusBadge(inv.status)}`}>
                        {inv.status || "draft"}
                      </span>
                    </td>

                    <td className="p-5 text-center">
                      <button
                        disabled={inv.status === "paid" || balance <= 0}
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-xl text-sm font-medium transition"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-20 text-center text-gray-400">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAYMENT SIDEBAR */}
        {selectedInvoice && (
          <div className="fixed right-0 top-0 w-full max-w-md h-full bg-gray-900 border-l border-cyan-900 p-8 z-50 overflow-auto">
            <h2 className="text-2xl text-cyan-300 mb-6">Record Payment</h2>

            <div className="mb-6">
              <p className="text-lg font-medium">{selectedInvoice.invoice_number}</p>
              <p className="text-gray-400">{selectedInvoice.customer_name}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount to Pay</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none focus:border-cyan-500 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Reference / Transaction ID</label>
                <input
                  placeholder="Optional"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-medium transition"
              >
                Cancel
              </button>

              <button
                onClick={handlePay}
                disabled={payLoading}
                className="flex-1 py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-2xl font-medium transition flex items-center justify-center gap-2"
              >
                {payLoading ? "Processing..." : "Record Payment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}