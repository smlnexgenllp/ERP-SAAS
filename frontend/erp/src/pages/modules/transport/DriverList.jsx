// src/pages/modules/transport/DriverList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import api from "../../../services/api";
import DriverCreate from "./DriverCreate";

export default function DriverList() {
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/transport/drivers/");
      setDrivers(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      alert("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setSelectedDriver(driver);
    setShowCreate(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

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

  // Pagination Logic
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header */}
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
              <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Driver Master</h1>
              <p className="text-zinc-500">Manage Transport Drivers</p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedDriver(null);
              setShowCreate(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Add Driver
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* Search Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">All Drivers</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, phone or license..."
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              onClick={fetchDrivers}
              className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading Drivers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Name</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Phone</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">License</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Expiry</th>
                  <th className="px-6 py-4 text-left font-medium text-zinc-700">Status</th>
                  <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {paginatedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-zinc-500">
                      No drivers found.
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{driver.full_name}</td>
                      <td className="px-6 py-4">{driver.phone_number}</td>
                      <td className="px-6 py-4">{driver.license_number}</td>
                      <td className="px-6 py-4">{driver.license_expiry || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            driver.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {driver.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleEdit(driver)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(driver.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                          >
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
        {filteredDrivers.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredDrivers.length)} of{" "}
              {filteredDrivers.length} drivers
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

      {/* Create/Edit Modal */}
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