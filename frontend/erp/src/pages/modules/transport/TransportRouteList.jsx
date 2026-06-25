// components/transport/TransportRouteList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit2, Trash2, Plus, Search, RefreshCw, 
  ChevronLeft, ChevronRight, Map 
} from "lucide-react";
import api from "../../../services/api";

const TransportRouteList = () => {
  const navigate = useNavigate();
  
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    source_location: "",
    destination_location: "",
    distance_km: "",
    expected_hours: "",
    toll_estimate: "",
    notes: "",
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transport/routes/");
      setRoutes(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (route) => {
    setEditingRoute(route);
    setFormData({
      source_location: route.source_location,
      destination_location: route.destination_location,
      distance_km: route.distance_km,
      expected_hours: route.expected_hours,
      toll_estimate: route.toll_estimate,
      notes: route.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await api.put(`/transport/routes/${editingRoute.id}/`, formData);
        alert("Route updated successfully!");
      } else {
        await api.post("/transport/routes/", formData);
        alert("New Route Created Successfully!");
      }
      setShowModal(false);
      setEditingRoute(null);
      fetchRoutes();
    } catch (err) {
      alert("Failed to save route. Please check the data.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      await api.delete(`/transport/routes/${id}/`);
      fetchRoutes();
      alert("Route deleted successfully");
    } catch (err) {
      alert("Cannot delete this route. It may be in use.");
    }
  };

  // Filter + Pagination
  const filteredRoutes = routes.filter(route =>
    `${route.source_location || ''} ${route.destination_location || ''} ${route.route_code || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoutes = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header - Consistent Design */}
      <div className="bg-white rounded-3xl p-6 border shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/transport")}
              className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} className="text-zinc-600" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
              <Map className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Transport Routes</h1>
              <p className="text-zinc-500">Manage source to destination routes</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingRoute(null);
              setFormData({
                source_location: "",
                destination_location: "",
                distance_km: "",
                expected_hours: "",
                toll_estimate: "",
                notes: "",
              });
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            New Route
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* Table Header with Search */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Route Master</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search source, destination or route code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
              />
            </div>
            <button
              onClick={fetchRoutes}
              className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Route Code</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">From</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">To</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Distance (km)</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Est. Hours</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Toll (₹)</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-zinc-500">Loading routes...</td>
                </tr>
              ) : paginatedRoutes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-zinc-500">
                    No routes found. Create your first route.
                  </td>
                </tr>
              ) : (
                paginatedRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-zinc-800">
                      {route.route_code}
                    </td>
                    <td className="px-6 py-4">{route.source_location}</td>
                    <td className="px-6 py-4">{route.destination_location}</td>
                    <td className="px-6 py-4 text-center font-medium">{route.distance_km} km</td>
                    <td className="px-6 py-4 text-center">{route.expected_hours} hrs</td>
                    <td className="px-6 py-4 text-center">₹{parseFloat(route.toll_estimate || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleEditClick(route)}
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRoutes.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredRoutes.length)} of{" "}
              {filteredRoutes.length} routes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 border rounded-2xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border hover:bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 border rounded-2xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingRoute ? "Edit Route" : "Create New Route"}
                </h2>
                {editingRoute && (
                  <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                    {editingRoute.route_code}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Location *</label>
                <input
                  type="text"
                  value={formData.source_location}
                  onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Madurai Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Location *</label>
                <input
                  type="text"
                  value={formData.destination_location}
                  onChange={(e) => setFormData({ ...formData, destination_location: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Chennai Port"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expected_hours}
                    onChange={(e) => setFormData({ ...formData, expected_hours: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toll (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.toll_estimate}
                    onChange={(e) => setFormData({ ...formData, toll_estimate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition"
                >
                  {editingRoute ? "Update Route" : "Create Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportRouteList;