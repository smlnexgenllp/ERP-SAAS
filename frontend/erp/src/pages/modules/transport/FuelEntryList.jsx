// src/pages/modules/transport/FuelEntryList.jsx
import React, { useEffect, useState } from "react";
import {
  Fuel,
  Plus,
  Search,
  RefreshCw,
  Truck,
  X,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import api from "../../../services/api";

export default function FuelEntryList() {
  const [fuelEntries, setFuelEntries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [form, setForm] = useState({
    vehicle: "",
    trip: "",
    fuel_date: new Date().toISOString().split("T")[0],
    liters: "",
    rate_per_liter: "",
    fuel_station: "",
    odometer_reading: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fuelRes, vehicleRes, tripRes] = await Promise.all([
        api.get("/transport/fuel-entries/"),
        api.get("/transport/vehicles/"),
        api.get("/transport/trips/"),
      ]);

      setFuelEntries(fuelRes.data || []);
      setVehicles(vehicleRes.data || []);
      setTrips(tripRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      vehicle: "",
      trip: "",
      fuel_date: new Date().toISOString().split("T")[0],
      liters: "",
      rate_per_liter: "",
      fuel_station: "",
      odometer_reading: "",
      notes: "",
    });
    setIsEditing(false);
    setSelectedEntry(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setIsEditing(true);
    setForm({
      vehicle: entry.vehicle || "",
      trip: entry.trip || "",
      fuel_date: entry.fuel_date,
      liters: entry.liters || "",
      rate_per_liter: entry.rate_per_liter || "",
      fuel_station: entry.fuel_station || "",
      odometer_reading: entry.odometer_reading || "",
      notes: entry.notes || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditing && selectedEntry) {
        await api.put(`/transport/fuel-entries/${selectedEntry.id}/`, form);
        alert("Fuel Entry Updated Successfully!");
      } else {
        await api.post("/transport/fuel-entries/", form);
        alert("Fuel Entry Added Successfully!");
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error(err.response?.data);
      alert(isEditing ? "Failed to update fuel entry" : "Failed to create fuel entry");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fuel entry?")) return;

    try {
      await api.delete(`/transport/fuel-entries/${id}/`);
      alert("Fuel Entry Deleted Successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete fuel entry");
    }
  };

  const goBack = () => {
    window.history.back(); // Or use navigate('/transport') if you prefer
  };

  const filteredEntries = fuelEntries.filter((entry) =>
    `${entry.vehicle_name || ""} ${entry.fuel_station || ""} ${entry.trip_number || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalFuelCost = fuelEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header with Back Button */}
      <div className="bg-white rounded-3xl p-6 border shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} className="text-zinc-600" />
            </button>

            <div className="w-14 h-14 rounded-3xl bg-yellow-100 flex items-center justify-center">
              <Fuel className="w-7 h-7 text-yellow-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Fuel Entries</h1>
              <p className="text-zinc-500">Vehicle Fuel Management</p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add Fuel Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-3xl border">
          <p className="text-zinc-500">Total Entries</p>
          <h2 className="text-4xl font-bold mt-2">{fuelEntries.length}</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl border">
          <p className="text-zinc-500">Total Fuel Cost</p>
          <h2 className="text-4xl font-bold mt-2">₹ {totalFuelCost.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-6 rounded-3xl border">
          <p className="text-zinc-500">Vehicles Refueled</p>
          <h2 className="text-4xl font-bold mt-2">
            {new Set(fuelEntries.map((f) => f.vehicle)).size}
          </h2>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Fuel Entry Master</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search vehicle or station..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
              />
            </div>
            <button onClick={fetchData} className="border px-4 rounded-2xl hover:bg-zinc-50">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50">
                <th className="p-4 text-left">Vehicle</th>
                <th className="p-4 text-left">Trip</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Liters</th>
                <th className="p-4 text-left">Rate</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-left">Station</th>
                <th className="p-4 text-left">Odometer</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-t hover:bg-zinc-50">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Truck size={16} />
                      {entry.vehicle_name}
                    </div>
                  </td>
                  <td className="p-4">
                    {entry.trip_number ? (
                      <span className="font-medium text-blue-600">{entry.trip_number}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">{entry.fuel_date}</td>
                  <td className="p-4">{entry.liters}</td>
                  <td className="p-4">₹ {entry.rate_per_liter}</td>
                  <td className="p-4 font-semibold text-green-700">₹ {entry.amount}</td>
                  <td className="p-4">{entry.fuel_station || "—"}</td>
                  <td className="p-4">{entry.odometer_reading || "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(entry)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal with Field Labels */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {isEditing ? "Edit Fuel Entry" : "Add Fuel Entry"}
              </h2>
              <button onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Vehicle *</label>
                <select
                  required
                  className="border p-3 rounded-xl w-full"
                  value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Trip (Optional)</label>
                <select
                  className="border p-3 rounded-xl w-full"
                  value={form.trip}
                  onChange={(e) => setForm({ ...form, trip: e.target.value })}
                >
                  <option value="">Select Trip</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trip_number} - {t.vehicle_number || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Fuel Date *</label>
                <input
                  type="date"
                  required
                  className="border p-3 rounded-xl w-full"
                  value={form.fuel_date}
                  onChange={(e) => setForm({ ...form, fuel_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Liters *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Liters"
                  required
                  className="border p-3 rounded-xl w-full"
                  value={form.liters}
                  onChange={(e) => setForm({ ...form, liters: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Rate Per Liter *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Rate Per Liter"
                  required
                  className="border p-3 rounded-xl w-full"
                  value={form.rate_per_liter}
                  onChange={(e) => setForm({ ...form, rate_per_liter: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Fuel Station</label>
                <input
                  placeholder="Fuel Station"
                  className="border p-3 rounded-xl w-full"
                  value={form.fuel_station}
                  onChange={(e) => setForm({ ...form, fuel_station: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Odometer Reading</label>
                <input
                  type="number"
                  placeholder="Odometer Reading"
                  className="border p-3 rounded-xl w-full"
                  value={form.odometer_reading}
                  onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <textarea
                  rows="4"
                  placeholder="Additional notes..."
                  className="border p-3 rounded-xl w-full"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="bg-yellow-600 text-white py-3 rounded-xl col-span-2 font-medium hover:bg-yellow-700 mt-4"
              >
                {isEditing ? "Update Fuel Entry" : "Save Fuel Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}