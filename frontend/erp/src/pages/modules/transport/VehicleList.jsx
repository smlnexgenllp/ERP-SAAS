// components/transport/VehicleList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Truck, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, 
  Edit, Trash2, ArrowLeft 
} from "lucide-react";

import api from "../../../services/api";
import VehicleCreate from "./VehicleCreate";

export default function VehicleList() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transport/vehicles/");
      setVehicles(response.data || []);
      setCurrentPage(1);
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

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
              <Truck className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Vehicle Master</h1>
              <p className="text-zinc-500">Manage Transport Vehicles</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* Table Header with Search */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">All Vehicles ({vehicles.length})</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by Vehicle No, Brand, Model..."
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              onClick={fetchVehicles}
              className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading Vehicles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Vehicle No</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Brand / Model</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Type</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Capacity</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Fuel</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Odometer</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Status</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Insurance</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Fitness</th>
                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {paginatedVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-12 text-center text-zinc-500">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  paginatedVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{vehicle.vehicle_number}</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium">{vehicle.brand}</span>
                          {vehicle.model && <span className="text-zinc-500"> / {vehicle.model}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">{vehicle.vehicle_type || "—"}</td>
                      <td className="px-6 py-4">
                        {vehicle.capacity_kg ? `${vehicle.capacity_kg} kg` : "—"}
                        {vehicle.capacity_cbm ? ` / ${vehicle.capacity_cbm} CBM` : ""}
                      </td>
                      <td className="px-6 py-4">{vehicle.fuel_type || "—"}</td>
                      <td className="px-6 py-4">{vehicle.current_odometer || "—"}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">{vehicle.insurance_expiry || "—"}</td>
                      <td className="px-6 py-4">{vehicle.fitness_expiry || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 justify-center">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition">
                            <Trash2 size={18} />
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

        {/* Pagination */}
        {filteredVehicles.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredVehicles.length)} of{" "}
              {filteredVehicles.length} vehicles
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