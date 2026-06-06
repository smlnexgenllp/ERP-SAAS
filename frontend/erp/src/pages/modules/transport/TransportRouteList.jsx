// components/transport/TransportRouteList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Trash2, Plus } from "lucide-react";
import api from "../../../services/api";

const TransportRouteList = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

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
      const res = await api.get("/transport/routes/");
      setRoutes(res.data);
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

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading Routes...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
 <button
                      onClick={() => navigate("/transport")}
                      className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
                    >
                      <ArrowLeft size={20} />
                      <span className="font-medium">Back</span>
                    </button>
            <h1 className="text-3xl font-bold text-zinc-900">Transport Routes</h1>
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
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition"
          >
            <Plus className="w-5 h-5" />
            New Route
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-6 py-4 text-left">Route Code</th>
                <th className="px-6 py-4 text-left">From</th>
                <th className="px-6 py-4 text-left">To</th>
                <th className="px-6 py-4 text-center">Distance (km)</th>
                <th className="px-6 py-4 text-center">Est. Hours</th>
                <th className="px-6 py-4 text-center">Toll (₹)</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {routes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-zinc-500">
                    No routes found. Create your first route.
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="hover:bg-zinc-50">
                    <td className="px-6 py-4 font-mono font-semibold text-zinc-800">
                      {route.route_code}
                    </td>
                    <td className="px-6 py-4">{route.source_location}</td>
                    <td className="px-6 py-4">{route.destination_location}</td>
                    <td className="px-6 py-4 text-center font-medium">{route.distance_km} km</td>
                    <td className="px-6 py-4 text-center">{route.expected_hours} hrs</td>
                    <td className="px-6 py-4 text-center">₹{parseFloat(route.toll_estimate).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleEditClick(route)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:text-red-700"
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
      </div>

      {/* Compact Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingRoute ? "Edit Route" : "Create New Route"}
                </h2>
                {editingRoute && (
                  <p className="text-xs text-zinc-500 mt-0.5 font-mono">
                    {editingRoute.route_code}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Source Location *</label>
                <input
                  type="text"
                  value={formData.source_location}
                  onChange={(e) => setFormData({ ...formData, source_location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm"
                  placeholder="e.g. Madurai Warehouse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Destination Location *</label>
                <input
                  type="text"
                  value={formData.destination_location}
                  onChange={(e) => setFormData({ ...formData, destination_location: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm"
                  placeholder="e.g. Chennai Port"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Distance (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Est. Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expected_hours}
                    onChange={(e) => setFormData({ ...formData, expected_hours: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Toll (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.toll_estimate}
                    onChange={(e) => setFormData({ ...formData, toll_estimate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 text-sm resize-y"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-zinc-300 text-zinc-700 rounded-2xl hover:bg-zinc-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-black text-sm font-medium"
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