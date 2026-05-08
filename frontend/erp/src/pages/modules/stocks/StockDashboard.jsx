// src/pages/StockDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  FiPackage,
  FiAlertTriangle,
  FiDollarSign,
  FiArrowUpRight,
  FiArrowDownRight,
  FiRefreshCw,
  FiArrowLeft,
  FiSearch,
} from "react-icons/fi";
import { format } from "date-fns";

export default function StockDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    total_stock_value: 0,
    recent_received: 0,
    recent_issued: 0,
  });

  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStockDashboardData();
  }, []);

  const fetchStockDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const itemsRes = await api.get("/stock/items/");
      const items = itemsRes.data.results || itemsRes.data;

      const lowStockCount = items.filter((item) => item.available_stock <= 10).length;
      const stockValue = items.reduce(
        (sum, item) => sum + Number(item.current_stock || 0) * Number(item.standard_price || 0),
        0
      );

      const ledgerRes = await api.get("/stock/ledger/", { params: { limit: 100 } });
      const movements = ledgerRes.data.results || ledgerRes.data;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentReceived = movements
        .filter((m) => m.transaction_type === "IN" && new Date(m.created_at) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + Number(m.quantity), 0);

      const recentIssued = movements
        .filter((m) => m.transaction_type === "OUT" && new Date(m.created_at) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + Number(m.quantity), 0);

      setStats({
        total_items: items.length,
        low_stock_items: lowStockCount,
        total_stock_value: stockValue.toFixed(2),
        recent_received: recentReceived.toFixed(0),
        recent_issued: recentIssued.toFixed(0),
      });

      setRecentMovements(movements);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (err) {
      console.error("Stock dashboard failed:", err);
      setError("Unable to load stock dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "IN": return { color: "text-emerald-600", icon: <FiArrowUpRight /> };
      case "OUT": return { color: "text-red-600", icon: <FiArrowDownRight /> };
      case "ADJ": return { color: "text-amber-600", icon: <FiRefreshCw /> };
      default: return { color: "text-zinc-500", icon: null };
    }
  };

  // Filter movements based on search
  const filteredMovements = recentMovements.filter((mov) =>
    mov.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleGoBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading Stock Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button onClick={handleGoBack} className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition">
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiPackage className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Stock Dashboard</h1>
                <p className="text-zinc-500">Overview of current stock levels and movements</p>
              </div>
            </div>
          </div>

          <button onClick={fetchStockDashboardData} className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition">
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <FiAlertTriangle size={22} />
            <span>{error}</span>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <StatCard icon={<FiPackage className="text-blue-600" />} title="Total Items" value={stats.total_items} />
          <StatCard icon={<FiAlertTriangle className="text-amber-600" />} title="Low Stock" value={stats.low_stock_items} alert={stats.low_stock_items > 0} />
          <StatCard icon={<FiDollarSign className="text-emerald-600" />} title="Stock Value" value={<span className="inline-flex whitespace-nowrap">₹ {Number(stats.total_stock_value).toLocaleString("en-IN")}</span>} />
          <StatCard icon={<FiArrowUpRight className="text-emerald-600" />} title="Received (30d)" value={stats.recent_received} />
          <StatCard icon={<FiArrowDownRight className="text-red-600" />} title="Issued (30d)" value={stats.recent_issued} />
        </div>

        {/* Recent Movements Table with Search & Pagination */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h2 className="text-2xl font-semibold text-zinc-900">Recent Stock Movements</h2>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search by item name, code or reference..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 py-20">
              <FiPackage className="w-16 h-16 text-zinc-300 mb-6" />
              <p className="text-xl font-medium text-zinc-600">No matching movements found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="p-5 text-left font-semibold text-zinc-600">Item</th>
                      <th className="p-5 text-center font-semibold text-zinc-600">Type</th>
                      <th className="p-5 text-right font-semibold text-zinc-600">Qty</th>
                      <th className="p-5 text-left font-semibold text-zinc-600">Reference</th>
                      <th className="p-5 text-right font-semibold text-zinc-600">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedMovements.map((mov) => {
                      const style = getTypeStyle(mov.transaction_type);
                      return (
                        <tr key={mov.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="p-5">
                            <div className="font-medium text-zinc-900">{mov.item_name}</div>
                            <div className="text-xs text-zinc-500">{mov.item_code} • {mov.uom}</div>
                          </td>
                          <td className="p-5 text-center">
                            <div className={`inline-flex items-center gap-1.5 ${style.color}`}>
                              {style.icon}
                              <span className="font-medium">{mov.transaction_type}</span>
                            </div>
                          </td>
                          <td className="p-5 text-right font-semibold text-zinc-900">
                            {Number(mov.quantity).toLocaleString("en-IN")}
                          </td>
                          <td className="p-5 text-zinc-600">{mov.reference || "—"}</td>
                          <td className="p-5 text-right text-zinc-500">
                            {format(new Date(mov.created_at), "dd MMM yyyy • hh:mm a")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-5 border-t border-zinc-100 flex items-center justify-between">
                  <p className="text-sm text-zinc-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMovements.length)} of {filteredMovements.length} movements
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-zinc-200 rounded-xl disabled:opacity-50 hover:bg-zinc-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-zinc-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-zinc-200 rounded-xl disabled:opacity-50 hover:bg-zinc-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard title="New GRN" desc="Receive materials from approved QC" color="emerald" onClick={() => navigate("/grns/create")} />
          <ActionCard title="Stock Items" desc="View all items & current levels" color="blue" onClick={() => navigate("/overall-stock")} />
          <ActionCard title="Low Stock" desc="Items needing reorder" color="amber" onClick={() => navigate("/low-stock")} />
          <ActionCard title="Full Ledger" desc="Complete stock movement history" color="purple" onClick={() => navigate("/full-ledger")} />
        </div>
      </div>
    </div>
  );
}

/* ==================== Reusable Components ==================== */

function StatCard({ icon, title, value, alert = false }) {
  return (
    <div className={`bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all ${alert ? "border-amber-200" : ""}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="text-4xl opacity-90">{icon}</div>
        {alert && <FiAlertTriangle className="text-amber-500" size={28} />}
      </div>
      <div className="text-zinc-500 text-sm mb-2">{title}</div>
      <div className="text-4xl font-bold tracking-tighter text-zinc-900">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, onClick, color }) {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    purple: "bg-purple-600 hover:bg-purple-700",
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white p-8 rounded-3xl text-left transition-all hover:shadow-lg`}
    >
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm opacity-90">{desc}</p>
    </button>
  );
}