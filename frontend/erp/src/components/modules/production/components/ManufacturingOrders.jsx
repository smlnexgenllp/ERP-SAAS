import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  RefreshCw,
  Play,
  CheckCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function ManufacturingOrders() {
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
      alert("Failed to load Manufacturing Orders");
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
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;

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
      draft: { color: "bg-yellow-500/10 text-yellow-400", label: "Draft" },
      in_progress: { color: "bg-blue-500/10 text-blue-400", label: "In Progress" },
      done: { color: "bg-green-500/10 text-green-400", label: "Completed" },
    };

    const style = config[status] || { color: "bg-gray-500/10 text-gray-400", label: status };

    return (
      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${style.color}`}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Manufacturing Orders</h1>
        <button
          onClick={fetchManufacturingOrders}
          className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <input
          type="text"
          placeholder="Search by Product or MO ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Completed</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-cyan-400">
          <RefreshCw className="animate-spin inline mr-2" size={24} />
          Loading...
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-4 text-left">MO ID</th>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Start Date</th>
                <th className="p-4 text-center">Finish Date</th>
                <th className="p-4 text-center">Planned Order</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-500">
                    No manufacturing orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((mo) => (
                  <tr key={mo.id} className="hover:bg-gray-800/50">
                    <td className="p-4 font-mono text-cyan-300">#{mo.id}</td>

                    <td className="p-4">
                      <div className="font-medium text-white">
                        {mo.product_name || mo.product?.name || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mo.product_code || mo.product?.code || ""}
                      </div>
                    </td>

                    <td className="p-4 text-right font-semibold">
                      {Number(mo.quantity || 0).toLocaleString()}
                    </td>

                    <td className="p-4 text-center">
                      {getStatusBadge(mo.status)}
                    </td>

                    <td className="p-4 text-center text-gray-300">
                      {mo.start_date || "—"}
                    </td>

                    <td className="p-4 text-center text-gray-300">
                      {mo.finish_date || "—"}
                    </td>

                    <td className="p-4 text-center font-mono text-gray-400">
                      {mo.planned_order ? `#${mo.planned_order}` : "—"}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        {/* Start Button - Only show for Draft */}
                        {mo.status === "draft" && (
                          <button
                            onClick={() => updateStatus(mo.id, "in_progress")}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                          >
                            <Play size={16} />
                            Start
                          </button>
                        )}

                        {/* Complete Button - Only show for In Progress */}
                        {mo.status === "in_progress" && (
                          <button
                            onClick={() => updateStatus(mo.id, "done")}
                            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Complete
                          </button>
                        )}

                        {/* Edit Dates Button - Always available */}
                        <button
                          onClick={() => openEditModal(mo)}
                          className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                        >
                          <Edit2 size={16} />
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
      )}

      {/* Edit Dates Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              Edit Dates - MO #{editModal.id}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="text-gray-400 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={editModal.start_date}
                  onChange={(e) => setEditModal({ ...editModal, start_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Finish Date</label>
                <input
                  type="date"
                  value={editModal.finish_date}
                  onChange={(e) => setEditModal({ ...editModal, finish_date: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={saveDates}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save Changes
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}