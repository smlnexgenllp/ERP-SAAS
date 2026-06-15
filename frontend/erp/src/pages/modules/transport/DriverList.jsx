import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Search } from "lucide-react";

import api from "../../../services/api";
import DriverCreate from "./DriverCreate";

export default function DriverList() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transport/drivers/");
      setDrivers(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.full_name} ${driver.phone_number} ${driver.license_number}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header with Back Button */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => navigate('/transport')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-all"
            >
              <span className="text-2xl leading-none">←</span>
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-3xl bg-green-700 flex items-center justify-center">
                <Users className="text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">Driver Master</h1>
                <p className="text-zinc-500">Manage Transport Drivers</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add Driver
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Search */}
        <div className="bg-white rounded-3xl border p-5 mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-4 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search Driver..."
              className="w-full border rounded-2xl pl-12 pr-4 py-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border overflow-hidden">
          <div className="px-6 py-5 border-b">
            <h2 className="text-xl font-semibold">Driver Master</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">Loading Drivers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Phone</th>
                    <th className="p-4 text-left">License</th>
                    <th className="p-4 text-left">Expiry</th>
                    <th className="p-4 text-left">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="border-b hover:bg-zinc-50"
                    >
                      <td className="p-4 font-medium">{driver.full_name}</td>
                      <td className="p-4">{driver.phone_number}</td>
                      <td className="p-4">{driver.license_number}</td>
                      <td className="p-4">{driver.license_expiry}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            driver.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {driver.status}
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

      {showCreate && (
        <DriverCreate
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            fetchDrivers();
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}