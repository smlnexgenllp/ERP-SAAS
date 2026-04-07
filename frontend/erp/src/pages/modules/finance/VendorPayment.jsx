import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { ArrowLeft, CreditCard, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VendorPayment() {
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("bank");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchInvoices = async () => {
    const res = await api.get("/inventory/vendor-invoices/summary/");
    setInvoices(res.data);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async () => {
    if (!selected || !amount) return;

    setLoading(true);
    try {
      await api.post("/inventory/vendor-payments/", {
        invoice: selected.id,
        amount,
        payment_mode: mode,
        reference_number: ref,
      });

      alert("Payment successful");
      setAmount("");
      setRef("");
      setSelected(null);
      fetchInvoices();
    } catch {
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => {
    if (s === "paid") return "text-green-400";
    if (s === "partial") return "text-yellow-400";
    if (s === "overdue") return "text-red-400";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono p-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-cyan-900 pb-3">
        <button onClick={() => navigate("/finance/dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-cyan-700 rounded">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <CreditCard className="text-cyan-400" />
        <h1 className="text-2xl font-bold text-blue-300">VENDOR PAYMENTS</h1>
      </div>

      {/* Invoice Table */}
      <div className="border border-cyan-900 bg-gray-900/40 rounded-xl p-4 mb-6">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-cyan-800">
              <th>Invoice</th>
              <th>Vendor</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id}
                onClick={() => setSelected(i)}
                className="cursor-pointer hover:bg-gray-800">
                <td>{i.invoice_number}</td>
                <td>{i.vendor}</td>
                <td>₹{i.total}</td>
                <td>₹{i.paid}</td>
                <td>₹{i.balance}</td>
                <td className={statusColor(i.status)}>{i.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Form */}
      {selected && (
        <div className="border border-green-900 bg-gray-900/40 rounded-xl p-4">
          <h2 className="mb-3">Make Payment</h2>

          <p>Invoice: {selected.invoice_number}</p>
          <p>Balance: ₹{selected.balance}</p>

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 mt-3 bg-gray-800 border border-cyan-700 rounded"
          />

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full p-3 mt-3 bg-gray-800 border border-cyan-700 rounded"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank Transfer</option>
            <option value="upi">UPI</option>
          </select>

          <input
            placeholder="Reference Number (UTR / Cheque)"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="w-full p-3 mt-3 bg-gray-800 border border-cyan-700 rounded"
          />

          <button
            onClick={handlePay}
            className="w-full mt-4 py-3 bg-green-700 hover:bg-green-600 rounded"
          >
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </div>
      )}
    </div>
  );
}