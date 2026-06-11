import React, { useEffect, useState } from "react";
import { Truck, Plus, Search, Edit, Trash2, ArrowLeft } from "lucide-react";

import api from "../../../services/api";
import VehicleCreate from "./VehicleCreate";

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transport/vehicles/");
      setVehicles(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) =>
    `${vehicle.vehicle_number} ${vehicle.brand} ${vehicle.model} ${vehicle.vehicle_type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const goBack = () => {
    window.history.back(); // Go back to previous page (Transport section)
  };

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

            <div className="w-14 h-14 bg-blue-700 rounded-3xl flex items-center justify-center">
              <Truck className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Vehicle Master</h1>
              <p className="text-zinc-500">Manage Transport Vehicles</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="max-w-full">
        {/* Search */}
        <div className="bg-white p-5 rounded-3xl border mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Vehicle No, Brand, Model..."
              className="w-full border rounded-2xl pl-12 pr-4 py-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Vehicles ({vehicles.length})</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-zinc-500">Loading Vehicles...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="p-4 text-left">Vehicle No</th>
                    <th className="p-4 text-left">Brand / Model</th>
                    <th className="p-4 text-left">Type</th>
                    <th className="p-4 text-left">Capacity</th>
                    <th className="p-4 text-left">Fuel</th>
                    <th className="p-4 text-left">Odometer</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Insurance</th>
                    <th className="p-4 text-left">Fitness</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-zinc-50">
                      <td className="p-4 font-medium">{vehicle.vehicle_number}</td>
                      <td className="p-4">
                        <div>
                          <span className="font-medium">{vehicle.brand}</span>
                          {vehicle.model && <span className="text-zinc-500"> / {vehicle.model}</span>}
                        </div>
                      </td>
                      <td className="p-4">{vehicle.vehicle_type || "—"}</td>
                      <td className="p-4">
                        {vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : "—"}
                        {vehicle.capacity_cbm ? ` / ${vehicle.capacity_cbm} CBM` : ""}
                      </td>
                      <td className="p-4">{vehicle.fuel_type || "—"}</td>
                      <td className="p-4">{vehicle.current_odometer || "—"}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            vehicle.status === "available"
                              ? "bg-green-100 text-green-700"
                              : vehicle.status === "on_trip"
                              ? "bg-blue-100 text-blue-700"
                              : vehicle.status === "maintenance"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {vehicle.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4">{vehicle.insurance_expiry || "—"}</td>
                      <td className="p-4">{vehicle.fitness_expiry || "—"}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-xl">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <VehicleCreate
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            fetchVehicles();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}