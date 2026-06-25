// src/components/maintenance/MaintenanceList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const MaintenanceList = ({ onEdit }) => {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/transport/vehicle-maintenance/');
      
      let maintenanceData = [];
      if (res.data && Array.isArray(res.data)) {
        maintenanceData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        maintenanceData = res.data.results;
      } else {
        maintenanceData = [];
      }
      
      setMaintenances(maintenanceData);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching maintenance records", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch maintenance records');
      setMaintenances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      setDeletingId(id);
      await api.delete(`/transport/vehicle-maintenance/${id}/`);
      setMaintenances(prev => prev.filter(item => item.id !== id));
      alert('Maintenance record deleted successfully.');
    } catch (err) {
      console.error("Error deleting maintenance record", err);
      alert(err.response?.data?.message || 'Failed to delete maintenance record');
      fetchMaintenances();
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter + Pagination
  const filteredMaintenances = maintenances.filter(item =>
    `${item.vehicle_number || ''} ${item.maintenance_type || ''} ${item.vehicle?.vehicle_number || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMaintenances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMaintenances = filteredMaintenances.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="bg-white rounded-3xl border shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={fetchMaintenances}
          className="px-6 py-2.5 bg-red-600 text-white rounded-2xl hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      {/* Table Header with Search */}
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold">Maintenance Records</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search vehicle or maintenance type..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-3 border rounded-2xl w-80"
            />
          </div>
          <button
            onClick={fetchMaintenances}
            className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Vehicle</th>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Type</th>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Service Date</th>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Next Due</th>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Cost</th>
              <th className="px-6 py-4 text-left font-medium text-zinc-700">Status</th>
              <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-zinc-500">Loading maintenance records...</td>
              </tr>
            ) : paginatedMaintenances.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12 text-center text-zinc-500">No maintenance records found.</td>
              </tr>
            ) : (
              paginatedMaintenances.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    {item.vehicle_number || item.vehicle?.vehicle_number || item.vehicle?.number || '-'}
                  </td>
                  <td className="px-6 py-4">{item.maintenance_type || '-'}</td>
                  <td className="px-6 py-4">{item.service_date || '-'}</td>
                  <td className="px-6 py-4">{item.next_service_date || '-'}</td>
                  <td className="px-6 py-4 font-semibold">
                    ₹{item.cost ? parseFloat(item.cost).toLocaleString() : '0'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                      {item.status ? item.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredMaintenances.length > 0 && (
        <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
          <div className="text-sm text-zinc-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredMaintenances.length)} of{" "}
            {filteredMaintenances.length} records
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
  );
};

export default MaintenanceList;