// components/transport/TransportTripList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, X, Clock, Gauge } from "lucide-react";
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
    trip_type: 'outbound',
    trip_status: 'planned',
    starting_km: '',
    ending_km: '',
    actual_arrival: '',
    loading_start_time: '',
    loading_end_time: '',
    unloading_start_time: '',
    unloading_end_time: '',
    remarks: ''
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
      trip_type: trip.trip_type || 'outbound',
      trip_status: trip.trip_status || 'planned',
      starting_km: trip.starting_km || '',
      ending_km: trip.ending_km || '',
      actual_arrival: trip.actual_arrival || '',
      loading_start_time: trip.loading_start_time || '',
      loading_end_time: trip.loading_end_time || '',
      unloading_start_time: trip.unloading_start_time || '',
      unloading_end_time: trip.unloading_end_time || '',
      remarks: trip.remarks || ''
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

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "—";
    return new Date(dateTime).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
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
        {/* Header */}
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
              <p className="text-zinc-600 mt-1">Complete overview with Loading & Unloading times</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/transport/create")}
            className="px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl font-medium flex items-center gap-2 transition"
          >
            + Create New Trip
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-zinc-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Trip Number</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Date</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Type</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Vehicle</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Driver</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Customer</th>

                  <th className="px-6 py-4 text-left font-medium text-zinc-700">
                    <div className="flex items-center gap-1">
                      <Gauge className="w-4 h-4" /> KM
                    </div>
                  </th>

                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Loading Time</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Actual Arrival</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Unloading Time</th>

                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Status</th>
                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="px-6 py-20 text-center text-zinc-500">
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

                      {/* KM Column */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="font-medium">{trip.starting_km || 0}</span>
                          <span className="text-zinc-400 mx-1">→</span>
                          <span className="font-medium text-emerald-600">{trip.ending_km || "—"}</span>
                        </div>
                        {trip.total_distance > 0 && (
                          <div className="text-xs text-emerald-600 font-medium">
                            {trip.total_distance} km
                          </div>
                        )}
                      </td>

                      {/* Loading Time */}
                      <td className="px-6 py-4 text-sm">
                        <div>{trip.loading_start_time ? formatDateTime(trip.loading_start_time) : "—"}</div>
                        <div className="text-emerald-600">
                          {trip.loading_end_time ? formatDateTime(trip.loading_end_time) : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {formatDateTime(trip.actual_arrival)}
                      </td>

                      {/* Unloading Time */}
                      <td className="px-6 py-4 text-sm">
                        <div>{trip.unloading_start_time ? formatDateTime(trip.unloading_start_time) : "—"}</div>
                        <div className="text-emerald-600">
                          {trip.unloading_end_time ? formatDateTime(trip.unloading_end_time) : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={trip.trip_status}
                          onChange={(e) => handleStatusUpdate(trip.id, e.target.value)}
                          className={`px-4 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer transition-all ${
                            trip.trip_status === "planned" ? "bg-blue-100 text-blue-700" :
                            trip.trip_status === "loading" ? "bg-purple-100 text-purple-700" :
                            trip.trip_status === "in_transit" ? "bg-amber-100 text-amber-700" :
                            trip.trip_status === "reached" ? "bg-indigo-100 text-indigo-700" :
                            trip.trip_status === "unloading" ? "bg-orange-100 text-orange-700" :
                            trip.trip_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            "bg-red-100 text-red-700"
                          }`}
                        >
                          <option value="planned">PLANNED</option>
                          <option value="loading">LOADING</option>
                          <option value="in_transit">IN TRANSIT</option>
                          <option value="reached">REACHED</option>
                          <option value="unloading">UNLOADING</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleEditClick(trip)}
                            className="text-blue-600 hover:text-blue-700 transition"
                            title="Edit Trip"
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

      {/* ==================== EDIT MODAL WITH LOADING & UNLOADING ==================== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6 text-zinc-700" />
                <h2 className="text-2xl font-semibold text-zinc-900">Edit Transport Trip</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-zinc-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-8 space-y-8 overflow-y-auto max-h-[calc(95vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Number</label>
                  <input type="text" name="trip_number" value={editFormData.trip_number} disabled className="w-full px-4 py-3 bg-zinc-100 border border-zinc-300 rounded-2xl" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Trip Status *</label>
                  <select name="trip_status" value={editFormData.trip_status} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl">
                    <option value="planned">Planned</option>
                    <option value="loading">Loading</option>
                    <option value="in_transit">In Transit</option>
                    <option value="reached">Reached</option>
                    <option value="unloading">Unloading</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Starting KM</label>
                  <input type="number" name="starting_km" value={editFormData.starting_km} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Ending KM</label>
                  <input type="number" name="ending_km" value={editFormData.ending_km} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Actual Arrival</label>
                  <input type="datetime-local" name="actual_arrival" value={editFormData.actual_arrival?.slice(0,16) || ''} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                </div>

                {/* Loading Section */}
                <div className="md:col-span-2 border border-blue-200 bg-blue-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Loading Time (Origin)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Loading Start</label>
                      <input type="datetime-local" name="loading_start_time" value={editFormData.loading_start_time?.slice(0,16) || ''} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Loading End</label>
                      <input type="datetime-local" name="loading_end_time" value={editFormData.loading_end_time?.slice(0,16) || ''} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                    </div>
                  </div>
                </div>

                {/* Unloading Section */}
                <div className="md:col-span-2 border border-amber-200 bg-amber-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-amber-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Unloading at Customer
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Unloading Start</label>
                      <input type="datetime-local" name="unloading_start_time" value={editFormData.unloading_start_time?.slice(0,16) || ''} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">Unloading End</label>
                      <input type="datetime-local" name="unloading_end_time" value={editFormData.unloading_end_time?.slice(0,16) || ''} onChange={handleEditInputChange} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Remarks</label>
                  <textarea name="remarks" value={editFormData.remarks} onChange={handleEditInputChange} rows={4} className="w-full px-4 py-3 border border-zinc-300 rounded-2xl" placeholder="Notes about loading/unloading..." />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3.5 border border-zinc-300 rounded-2xl hover:bg-zinc-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-zinc-900 text-white rounded-2xl hover:bg-black">
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