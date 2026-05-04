// src/pages/sales/SalesReturnList.jsx

import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import {
  Eye,
  Edit2,
  Download,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SalesReturnList() {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [filteredReturns, setFilteredReturns] = useState([]);

  // ================= FETCH RETURNS =================
  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sale/invoices/returns/");
      setReturns(res.data || []);
      setFilteredReturns(res.data || []);
    } catch (err) {
      console.error("Error fetching returns:", err);
      alert("Failed to load sales returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // ================= FILTER =================
  useEffect(() => {
    let result = [...returns];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) =>
        (r.return_number || "").toLowerCase().includes(term) ||
        (r.invoice_number || "").toLowerCase().includes(term) ||
        (r.customer_name || "").toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      result = result.filter(
        (r) => new Date(r.return_date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      result = result.filter(
        (r) => new Date(r.return_date) <= new Date(dateTo)
      );
    }

    setFilteredReturns(result);
  }, [searchTerm, dateFrom, dateTo, returns]);

  // ================= NAVIGATION =================
  const handleView = (id) => navigate(`/sales/returns/${id}`);
  const handleEdit = (id) => navigate(`/sales/returns/edit/${id}`);

  // ================= HELPERS =================
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;
  };

  // ================= UI =================
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Sales Returns / Credit Notes
          </h1>
          <p className="text-gray-600 mt-1">
            History of all customer returns
          </p>
        </div>

        <button
          onClick={() => navigate("/sales-return")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium"
        >
          + New Sales Return
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="text-sm font-medium">Search</label>
          <input
            type="text"
            placeholder="Return No, Invoice, Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border px-4 py-2.5 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border px-4 py-2.5 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border px-4 py-2.5 rounded-lg"
          />
        </div>

        <button
          onClick={fetchReturns}
          className="bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-lg flex items-center gap-2"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-10 text-center">No returns found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Return No</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Invoice</th>
                <th className="p-4 text-left">Customer</th>
                <th className="p-4 text-right">Rate (Avg)</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Items</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredReturns.map((ret) => (
                <tr key={ret.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    {ret.return_number}
                  </td>

                  <td className="p-4 text-gray-600">
                    {formatDate(ret.return_date)}
                  </td>

                  <td className="p-4">
                    {ret.invoice_number || "-"}
                  </td>

                  <td className="p-4">
                    {ret.customer_name}
                  </td>

                  {/* ✅ AVG RATE */}
                  <td className="p-4 text-right">
                    ₹{Number(ret.avg_rate || 0).toLocaleString("en-IN")}
                  </td>

                  {/* ✅ TOTAL */}
                  <td className="p-4 text-right text-green-600 font-semibold">
                    {formatCurrency(ret.total_amount)}
                  </td>

                  {/* ✅ ITEMS */}
                  <td className="p-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {ret.items_count || 0} items
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleView(ret.id)}
                        className="text-blue-600"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => handleEdit(ret.id)}
                        className="text-orange-500"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button className="text-gray-500">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Showing {filteredReturns.length} of {returns.length}
      </div>
    </div>
  );
}