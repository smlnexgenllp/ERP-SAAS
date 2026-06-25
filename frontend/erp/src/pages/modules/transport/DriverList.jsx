import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../../../services/api";
import TransportSidebar from "./components/TransportSidebar";
import DriverCreate from "./DriverCreate";

export default function DriverList() {
  const [drivers, setDrivers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
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

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/transport/drivers/${id}/`);

      fetchDrivers();
    } catch (error) {
      console.error(error);
      alert("Failed to delete driver");
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.full_name} ${driver.phone_number} ${driver.license_number}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-100 flex">
      <TransportSidebar active="drivers" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-3xl bg-green-700 flex items-center justify-center">
                <Users className="text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Driver Master
                </h1>

                <p className="text-zinc-500">
                  Manage Transport Drivers
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedDriver(null);
                setShowCreate(true);
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl flex items-center gap-2"
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
                Driver Master
              </h2>
            </div>

            {loading ? (
              <div className="p-10 text-center">
                Loading Drivers...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-100">
                      <th className="p-4 text-left">
                        Name
                      </th>

                      <th className="p-4 text-left">
                        Phone
                      </th>

                      <th className="p-4 text-left">
                        License
                      </th>

                      <th className="p-4 text-left">
                        Expiry
                      </th>

                      <th className="p-4 text-left">
                        Status
                      </th>

                      <th className="p-4 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDrivers.length > 0 ? (
                      filteredDrivers.map((driver) => (
                        <tr
                          key={driver.id}
                          className="border-b hover:bg-zinc-50"
                        >
                          <td className="p-4 font-medium">
                            {driver.full_name}
                          </td>

                          <td className="p-4">
                            {driver.phone_number}
                          </td>

                          <td className="p-4">
                            {driver.license_number}
                          </td>

                          <td className="p-4">
                            {driver.license_expiry}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                driver.status ===
                                "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {driver.status}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleEdit(driver)
                                }
                                className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                onClick={() =>
                                  handleDelete(driver.id)
                                }
                                className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center p-8 text-zinc-500"
                        >
                          No Drivers Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <DriverCreate
          driver={selectedDriver}
          onClose={() => {
            setShowCreate(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            fetchDrivers();
            setShowCreate(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </div>
  );
}