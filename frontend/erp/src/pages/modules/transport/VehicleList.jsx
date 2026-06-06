import React, { useEffect, useState } from "react";
import { Truck, Plus, Search } from "lucide-react";

import api from "../../../services/api";
import TransportSidebar from "./components/TransportSidebar";
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
    `${vehicle.vehicle_number} ${vehicle.vehicle_type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-100 flex">

      <TransportSidebar active="vehicles" />

      <div className="flex-1 flex flex-col">

        {/* Header */}
        <div className="bg-white border-b px-8 py-6">

          <div className="flex justify-between items-center">

            <div className="flex items-center gap-4">

              <div className="w-12 h-12 bg-blue-700 rounded-3xl flex items-center justify-center">
                <Truck className="text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Vehicle Master
                </h1>

                <p className="text-zinc-500">
                  Manage Transport Vehicles
                </p>
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

        <div className="p-8">

          {/* Search */}
          <div className="bg-white p-5 rounded-3xl border mb-6">

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-3.5 text-zinc-400"
              />

              <input
                type="text"
                placeholder="Search Vehicle..."
                className="w-full border rounded-2xl pl-12 pr-4 py-3"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>

          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border overflow-hidden">

            <div className="px-6 py-5 border-b">
              <h2 className="text-xl font-semibold">
                Vehicle Master
              </h2>
            </div>

            {loading ? (
              <div className="p-10 text-center">
                Loading Vehicles...
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="bg-zinc-100">

                      <th className="p-4 text-left">
                        Vehicle No
                      </th>

                      <th className="p-4 text-left">
                        Type
                      </th>

                      <th className="p-4 text-left">
                        Capacity
                      </th>

                      <th className="p-4 text-left">
                        Insurance
                      </th>

                      <th className="p-4 text-left">
                        Pollution
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="border-b hover:bg-zinc-50"
                      >

                        <td className="p-4 font-medium">
                          {vehicle.vehicle_number}
                        </td>

                        <td className="p-4">
                          {vehicle.vehicle_type}
                        </td>

                        <td className="p-4">
                          {vehicle.capacity}
                        </td>

                        <td className="p-4">
                          {vehicle.insurance_expiry}
                        </td>

                        <td className="p-4">
                          {vehicle.pollution_expiry}
                        </td>

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              vehicle.status === "available"
                                ? "bg-green-100 text-green-700"
                                : vehicle.status === "maintenance"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {vehicle.status}
                          </span>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

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