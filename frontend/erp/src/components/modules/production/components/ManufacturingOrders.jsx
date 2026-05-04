// src/pages/modules/production/ManufacturingOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import {
  RefreshCw,
  Play,
  CheckCircle,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Settings,
  AlertCircle,
} from "lucide-react";

export default function ManufacturingOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal for editing dates
  const [editModal, setEditModal] = useState(null);

  const fetchManufacturingOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/production/manufacturing-orders/");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to load manufacturing orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManufacturingOrders();
  }, []);

  // Filter + Search
  const filteredOrders = orders
    .filter((mo) => {
      const matchesStatus = filterStatus === "all" || mo.status === filterStatus;
      const matchesSearch =
        (mo.product_name || mo.product?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        mo.id.toString().includes(searchTerm);
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => b.id - a.id);

  // Update Status
  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Change status to "${newStatus.replace('_', ' ')}"?`)) return;

    try {
      await api.patch(`/production/manufacturing-orders/${id}/`, { status: newStatus });
      alert("Status updated successfully!");
      fetchManufacturingOrders();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    }
  };

  // Open Edit Dates Modal
  const openEditModal = (mo) => {
    setEditModal({
      id: mo.id,
      start_date: mo.start_date || "",
      finish_date: mo.finish_date || "",
    });
  };

  // Save Dates
  const saveDates = async () => {
    if (!editModal) return;

    try {
      await api.patch(`/production/manufacturing-orders/${editModal.id}/`, {
        start_date: editModal.start_date,
        finish_date: editModal.finish_date,
      });
      alert("Dates updated successfully!");
      setEditModal(null);
      fetchManufacturingOrders();
    } catch (err) {
      alert("Failed to update dates");
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { 
        bg: "bg-amber-100 text-amber-700", 
        label: "Draft" 
      },
      in_progress: { 
        bg: "bg-blue-100 text-blue-700", 
        label: "In Progress" 
      },
      done: { 
        bg: "bg-emerald-100 text-emerald-700", 
        label: "Completed" 
      },
    };

    const style = config[status] || { 
      bg: "bg-zinc-100 text-zinc-600", 
      label: status.replace('_', ' ') 
    };

    return (
      <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${style.bg}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Manufacturing Orders
                </h1>
                <p className="text-zinc-500">Track and manage production orders</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchManufacturingOrders}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-600 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by Product Name or MO ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-64 px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-6 text-lg font-medium">Loading manufacturing orders...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">MO ID</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Product</th>
                      <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Quantity</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Status</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Start Date</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Finish Date</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Planned Order</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center">
                            <AlertCircle className="w-12 h-12 text-zinc-300 mb-4" />
                            <p className="text-zinc-500 text-lg">No manufacturing orders found</p>
                            <p className="text-zinc-400 mt-1">Try adjusting your search or filter</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((mo) => (
                        <tr key={mo.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-8 py-6 font-mono font-medium text-zinc-900">#{mo.id}</td>

                          <td className="px-8 py-6">
                            <div className="font-medium text-zinc-900">
                              {mo.product_name || mo.product?.name || "—"}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {mo.product_code || mo.product?.code || ""}
                            </div>
                          </td>

                          <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                            {Number(mo.quantity || 0).toLocaleString('en-IN')}
                          </td>

                          <td className="px-8 py-6 text-center">
                            {getStatusBadge(mo.status)}
                          </td>

                          <td className="px-8 py-6 text-center text-zinc-600">
                            {mo.start_date || "—"}
                          </td>

                          <td className="px-8 py-6 text-center text-zinc-600">
                            {mo.finish_date || "—"}
                          </td>

                          <td className="px-8 py-6 text-center font-mono text-zinc-500">
                            {mo.planned_order ? `#${mo.planned_order}` : "—"}
                          </td>

                          <td className="px-8 py-6">
                            <div className="flex gap-3 justify-center">
                              {/* Start Button */}
                              {mo.status === "draft" && (
                                <button
                                  onClick={() => updateStatus(mo.id, "in_progress")}
                                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                                >
                                  <Play size={18} />
                                  Start
                                </button>
                              )}

                              {/* Complete Button */}
                              {mo.status === "in_progress" && (
                                <button
                                  onClick={() => updateStatus(mo.id, "done")}
                                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                                >
                                  <CheckCircle size={18} />
                                  Complete
                                </button>
                              )}

                              {/* Edit Dates Button */}
                              <button
                                onClick={() => openEditModal(mo)}
                                className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                              >
                                <Edit2 size={18} />
                                Edit Dates
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Edit Dates Modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl w-full max-w-md p-10">
              <h2 className="text-2xl font-bold text-zinc-900 mb-8">
                Edit Dates - MO #{editModal.id}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editModal.start_date}
                    onChange={(e) => setEditModal({ ...editModal, start_date: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-600 mb-2">Finish Date</label>
                  <input
                    type="date"
                    value={editModal.finish_date}
                    onChange={(e) => setEditModal({ ...editModal, finish_date: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={saveDates}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition"
                >
                  <Save size={20} /> Save Changes
                </button>
                <button
                  onClick={() => setEditModal(null)}
                  className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 transition"
                >
                  <X size={20} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}