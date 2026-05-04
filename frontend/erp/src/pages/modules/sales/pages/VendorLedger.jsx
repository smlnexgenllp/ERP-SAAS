import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VendorLedger() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get("/finance/vendors/");
      setVendors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLedger = async (vendorId) => {
    if (!vendorId) {
      setLedger(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/inventory/vendor-ledger/${vendorId}/`);
      setLedger(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load vendor ledger");
      setLedger(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (e) => {
    const id = e.target.value;
    setSelectedVendorId(id);
    loadLedger(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Vendor Ledger</h1>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Vendor</label>
          <select
            value={selectedVendorId}
            onChange={handleVendorChange}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose Vendor --</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} {v.gstin ? `(${v.gstin})` : ''}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

        {loading && <p className="text-center py-10">Loading ledger...</p>}

        {ledger && (
          <>
            {/* Vendor Header */}
            <div className="flex justify-between bg-gray-50 p-5 rounded-lg mb-6">
              <div>
                <h2 className="text-2xl font-semibold">{ledger.vendor.name}</h2>
                <p className="text-gray-600">{ledger.vendor.gstin}</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Printer size={18} /> Print
              </button>
            </div>

            {/* Ledger Table */}
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Particulars</th>
                  <th className="border p-3 text-left">Reference</th>
                  <th className="border p-3 text-right">Debit (₹)</th>
                  <th className="border p-3 text-right">Credit (₹)</th>
                  <th className="border p-3 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ledger.transactions.map((t, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="border p-3">{t.date}</td>
                    <td className="border p-3">{t.particulars}</td>
                    <td className="border p-3 font-mono">{t.reference}</td>
                    <td className="border p-3 text-right text-red-600 font-medium">
                      {t.debit ? t.debit.toFixed(2) : ''}
                    </td>
                    <td className="border p-3 text-right text-green-600 font-medium">
                      {t.credit ? t.credit.toFixed(2) : ''}
                    </td>
                    <td className="border p-3 text-right font-bold">
                      {t.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="mt-8 bg-gray-900 text-white p-6 rounded-xl">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-gray-400">Total Debit</p>
                  <p className="text-3xl font-bold">₹{ledger.summary.total_debit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Credit</p>
                  <p className="text-3xl font-bold">₹{ledger.summary.total_credit.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Closing Balance</p>
                  <p className={`text-4xl font-bold ${ledger.summary.closing_balance >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ₹{Math.abs(ledger.summary.closing_balance).toFixed(2)} {ledger.summary.balance_type}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}