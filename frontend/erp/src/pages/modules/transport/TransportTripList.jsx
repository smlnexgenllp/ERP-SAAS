// components/transport/TransportTripList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, X } from "lucide-react"; // Make sure lucide-react is installed
import api from "../../../services/api";

const TransportTripList = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  const [editFormData, setEditFormData] = useState({
    trip_number: '',
    trip_date: '',
    trip_type: 'delivery',
    vehicle: '',
    driver: '',
    customer: '',
    sales_order: '',
    trip_status: 'planned'
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get("/transport/trips/");
      setTrips(response.data);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      alert("Failed to load transport trips.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/transport/trips/${id}/`);
      setTrips(prev => prev.filter(trip => trip.id !== id));
      alert("Trip deleted successfully!");
    } catch (error) {
      alert("Failed to delete trip.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (trip) => {
    setEditingTrip(trip);
    setEditFormData({
      trip_number: trip.trip_number || '',
      trip_date: trip.trip_date ? trip.trip_date.split('T')[0] : '',
      trip_type: trip.trip_type || 'delivery',
      vehicle: trip.vehicle || '',
      driver: trip.driver || '',
      customer: trip.customer || '',
      sales_order: trip.sales_order || '',
      trip_status: trip.trip_status || 'planned'
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTrip) return;

    try {
      const response = await api.put(`/transport/trips/${editingTrip.id}/`, editFormData);
      
      setTrips(prev => prev.map(trip =>
        trip.id === editingTrip.id ? { ...trip, ...response.data } : trip
      ));

      setShowEditModal(false);
      setEditingTrip(null);
      alert("Trip updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update trip.");
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await api.patch(`/transport/trips/${id}/`, { trip_status: newStatus });
      setTrips(prev => prev.map(trip =>
        trip.id === id ? { ...trip, ...response.data } : trip
      ));
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-lg text-zinc-600">Loading Transport Trips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/transport")}
              className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Transport Trips</h1>
              <p className="text-zinc-600 mt-1">Manage all your delivery and transport trips</p>
            </div>
          </div>

          <button
            onClick={() => navigate("transport-list")}
            className="px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-medium flex items-center gap-2 transition"
          >
            + Create New Trip
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-100">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Trip Number</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Date</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Type</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Vehicle</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Driver</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Customer</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Sales Order</th>
                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Status</th>
                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-20 text-center text-zinc-500">
                      No transport trips found.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-zinc-900">{trip.trip_number}</td>
                      <td className="px-6 py-4 text-zinc-600">
                        {new Date(trip.trip_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium">{trip.trip_type}</td>
                      <td className="px-6 py-4 font-medium">{trip.vehicle_number || trip.vehicle || "—"}</td>
                      <td className="px-6 py-4 font-medium">{trip.driver_name || trip.driver || "—"}</td>
                      <td className="px-6 py-4 text-zinc-700">{trip.customer_name || trip.customer || "—"}</td>
                      <td className="px-6 py-4">
                        {trip.sales_order_number || trip.sales_order ? `SO-${trip.sales_order_number || trip.sales_order}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={trip.trip_status}
                          onChange={(e) => handleStatusUpdate(trip.id, e.target.value)}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer transition-all ${
                            trip.trip_status === "planned" ? "bg-blue-100 text-blue-700" :
                            trip.trip_status === "in_transit" ? "bg-amber-100 text-amber-700" :
                            trip.trip_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            "bg-red-100 text-red-700"
                          }`}
                        >
                          <option value="planned">PLANNED</option>
                          <option value="in_transit">IN TRANSIT</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleEditClick(trip)}
                            className="text-blue-600 hover:text-blue-700 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(trip.id)}
                            disabled={deletingId === trip.id}
                            className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === trip.id ? "⏳" : "🗑️"}
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
      </div>

      {/* ==================== IMPROVED EDIT MODAL ==================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6 text-zinc-700" />
                <h2 className="text-2xl font-semibold text-zinc-900">Edit Transport Trip</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-500 hover:text-zinc-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(92vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Number *</label>
                  <input
                    type="text"
                    name="trip_number"
                    value={editFormData.trip_number}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Date *</label>
                  <input
                    type="date"
                    name="trip_date"
                    value={editFormData.trip_date}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Type *</label>
                  <select
                    name="trip_type"
                    value={editFormData.trip_type}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Vehicle</label>
                  <input
                    type="text"
                    name="vehicle"
                    value={editFormData.vehicle}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    placeholder="e.g. TN67 AB 1234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Driver</label>
                  <input
                    type="text"
                    name="driver"
                    value={editFormData.driver}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                    placeholder="Driver name / ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Customer</label>
                  <input
                    type="text"
                    name="customer"
                    value={editFormData.customer}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Sales Order</label>
                  <input
                    type="text"
                    name="sales_order"
                    value={editFormData.sales_order}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Status *</label>
                  <select
                    name="trip_status"
                    value={editFormData.trip_status}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-4 py-3 border border-zinc-300 rounded-2xl focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_transit">In Transit</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-4 pt-6 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 border border-zinc-300 text-zinc-700 font-medium rounded-2xl hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-zinc-900 text-white font-medium rounded-2xl hover:bg-black transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportTripList;