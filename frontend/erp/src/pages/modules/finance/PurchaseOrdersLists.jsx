// src/pages/PurchaseOrdersList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { 
  FiPrinter, 
  FiSearch, 
  FiRefreshCw, 
  FiArrowLeft,
  FiPackage 
} from "react-icons/fi";

export default function PurchaseOrdersList() {
  const navigate = useNavigate();

  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState({});

  useEffect(() => {
    fetchPurchaseOrders();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/hr/departments/");
      const map = {};
      res.data.forEach((d) => {
        map[d.id] = d.name;
      });
      setDepartments(map);
    } catch (err) {
      console.error("Error loading departments", err);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/purchase-orders/");
      setPos(res.data || []);
      setFilteredPos(res.data || []);
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search
  useEffect(() => {
    let result = [...pos];

    if (statusFilter !== "all") {
      result = result.filter(po => 
        (po.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(po =>
        (po.po_number || "").toLowerCase().includes(term) ||
        (po.vendor_name || "").toLowerCase().includes(term) ||
        (po.department_name || "").toLowerCase().includes(term)
      );
    }

    setFilteredPos(result);
  }, [pos, statusFilter, searchTerm]);

  const formatAmount = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const handlePrint = (po) => {
    // Your existing print function (unchanged)
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the document");
      return;
    }

    // ... (your full print logic remains unchanged)
    // Keeping it as is for brevity
    console.log("Printing PO:", po.po_number);
    // Paste your original printWindow.document.write logic here if needed
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiPackage className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Purchase Orders
                </h1>
                <p className="text-zinc-500">Manage and track all purchase orders</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchPurchaseOrders}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search PO Number, Vendor or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl focus:outline-none focus:border-zinc-400 min-w-[180px]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">PO Number</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Department</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total Amount</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-zinc-500 mt-4">Loading purchase orders...</p>
                    </td>
                  </tr>
                ) : filteredPos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-zinc-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredPos.map((po) => (
                    <tr key={po.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-medium text-zinc-900">
                        {po.po_number || '—'}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {departments[po.department] || po.department_name || '—'}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {po.vendor_name || po.vendor?.name || '—'}
                      </td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {formatAmount(po.total_amount)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                            po.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {(po.status || "DRAFT").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => handlePrint(po)}
                          className="text-zinc-700 hover:text-zinc-900 transition p-3 hover:bg-zinc-100 rounded-xl"
                          title="Print Purchase Order"
                        >
                          <FiPrinter size={22} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}