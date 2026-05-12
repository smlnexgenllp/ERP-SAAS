// src/pages/inventory/MachineList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Factory, RefreshCw, Trash2, Edit3, 
  Clock, AlertCircle, CheckCircle, XCircle,
  ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../../services/api';

export default function MachineList() {
  const navigate = useNavigate();
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchMachines = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await api.get('/inventory/machines/');
      
      const sortedData = (response.data || []).sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setMachines(sortedData);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load machines:', err);
      setError('Could not load machine list. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(machines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMachines = machines.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateNew = () => navigate('/machines/create');
  const handleEdit = (id) => navigate(`/machines/edit/${id}`);

  const handleViewDetails = (machine) => {
    setSelectedMachine(machine);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (machine) => {
    setDeleteConfirm({ id: machine.id, name: machine.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?.id) return;

    try {
      await api.delete(`/inventory/machines/${deleteConfirm.id}/`);
      setMachines(prev => prev.filter(m => m.id !== deleteConfirm.id));
      alert(`Machine "${deleteConfirm.name}" has been deleted.`);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete machine.';
      setError(message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => setDeleteConfirm(null);

  const getMaintenanceStatusBadge = (status) => {
    switch(status) {
      case 'operational': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'maintenance': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'breakdown':   return 'bg-red-100 text-red-700 border border-red-200';
      default:            return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getMaintenanceStatusIcon = (status) => {
    switch(status) {
      case 'operational': return <CheckCircle size={14} className="text-emerald-600" />;
      case 'maintenance': return <Wrench size={14} className="text-amber-600" />;
      case 'breakdown':   return <XCircle size={14} className="text-red-600" />;
      default:            return <AlertCircle size={14} className="text-zinc-500" />;
    }
  };

  const getWorkCenterTypeIcon = (type) => {
    switch(type) {
      case 'machine': return '⚙️';
      case 'assembly': return '🔧';
      case 'inspection': return '🔍';
      case 'labor': return '👤';
      default: return '🏭';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/manufacturing/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition font-medium"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Factory className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Machine / Work Center List</h1>
              <p className="text-sm text-zinc-500">
                {new Date().toLocaleDateString('en-IN')} • {machines.length} machines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            disabled={refreshing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition border ${
              refreshing 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200'
            }`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 transition"
          >
            <Plus size={16} />
            Add New Machine
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 md:p-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-blue-600 animate-pulse text-xl flex items-center gap-3">
              <RefreshCw className="animate-spin" size={24} />
              Loading machines...
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-3xl text-center max-w-2xl mx-auto">
            <p className="text-lg mb-4">{error}</p>
            <button onClick={fetchMachines} className="mt-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-medium">
              Try Again
            </button>
          </div>
        ) : machines.length === 0 ? (
          <div className="text-center py-20">
            <Factory className="w-20 h-20 mx-auto mb-6 text-zinc-300" />
            <h2 className="text-2xl font-semibold mb-3 text-zinc-900">No machines registered yet</h2>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-medium inline-flex items-center gap-3"
            >
              <Plus size={20} /> Add New Machine
            </button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <p className="text-sm text-zinc-500 font-medium">Total Machines</p>
                <p className="text-4xl font-bold text-zinc-900 mt-2">{machines.length}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm">
                <p className="text-sm text-emerald-600 font-medium">Operational</p>
                <p className="text-4xl font-bold text-emerald-700 mt-2">
                  {machines.filter(m => m.maintenance_status === 'operational').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm">
                <p className="text-sm text-amber-600 font-medium">In Maintenance</p>
                <p className="text-4xl font-bold text-amber-700 mt-2">
                  {machines.filter(m => m.maintenance_status === 'maintenance').length}
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm">
                <p className="text-sm text-blue-600 font-medium">Total Capacity</p>
                <p className="text-4xl font-bold text-blue-700 mt-2">
                  {machines.reduce((sum, m) => sum + (m.capacity_per_day_hours || 0), 0)} hrs
                </p>
              </div>
            </div>

            {/* Machines Table */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-left text-zinc-600">
                      <th className="py-5 px-6 font-semibold">Name / Code</th>
                      <th className="py-5 px-6 font-semibold">Type</th>
                      <th className="py-5 px-6 font-semibold">Department</th>
                      <th className="py-5 px-6 font-semibold text-center">Capacity</th>
                      <th className="py-5 px-6 font-semibold">Maintenance Status</th>
                      <th className="py-5 px-6 font-semibold">Active</th>
                      <th className="py-5 px-6 font-semibold">Next Maint.</th>
                      <th className="py-5 px-6 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMachines.map(machine => (
                      <tr
                        key={machine.id}
                        onClick={() => handleViewDetails(machine)}
                        className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        <td className="py-5 px-6">
                          <div className="font-semibold text-zinc-900">{machine.name}</div>
                          <div className="text-xs text-zinc-500 font-mono">{machine.code || '—'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="flex items-center gap-2">
                            <span>{getWorkCenterTypeIcon(machine.work_center_type)}</span>
                            <span>{machine.work_center_type_display || machine.work_center_type}</span>
                          </span>
                        </td>
                        <td className="py-5 px-6 text-zinc-700">{machine.department_name || '—'}</td>
                        <td className="py-5 px-6 text-center text-zinc-700">
                          {machine.capacity_per_day_hours} hrs/day
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(machine.maintenance_status)}`}>
                            {getMaintenanceStatusIcon(machine.maintenance_status)}
                            {machine.maintenance_status_display || machine.maintenance_status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            machine.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {machine.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-zinc-600">
                          {machine.next_maintenance_date 
                            ? new Date(machine.next_maintenance_date).toLocaleDateString('en-IN')
                            : '—'}
                        </td>
                        <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => handleEdit(machine.id)}
                              className="text-blue-600 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-50"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(machine)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-zinc-200 flex items-center justify-between bg-white">
                  <div className="text-sm text-zinc-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, machines.length)} of {machines.length} machines
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 rounded-2xl transition"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>

                    <div className="px-6 py-2.5 bg-zinc-100 rounded-2xl text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 rounded-2xl transition"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Delete Machine?</h3>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-medium transition"
              >
                Yes, Delete
              </button>
              <button 
                onClick={cancelDelete}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 py-3 rounded-2xl font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Detail Modal */}
      {showDetailModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-900">Machine Details</h2>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="text-2xl text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500">Name</label>
                  <p className="text-zinc-900 font-medium">{selectedMachine.name}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Code</label>
                  <p className="text-zinc-900 font-mono">{selectedMachine.code}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Department</label>
                  <p className="text-zinc-900">{selectedMachine.department_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Work Center Type</label>
                  <p className="text-zinc-900">{selectedMachine.work_center_type_display || selectedMachine.work_center_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500">Maintenance Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(selectedMachine.maintenance_status)}`}>
                      {getMaintenanceStatusIcon(selectedMachine.maintenance_status)}
                      {selectedMachine.maintenance_status_display || selectedMachine.maintenance_status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Active Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedMachine.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedMachine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  <Clock size={16} /> Capacity Planning
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-2xl">
                  <div>
                    <label className="text-xs text-zinc-500">Daily Capacity</label>
                    <p className="text-zinc-900">{selectedMachine.capacity_per_day_hours} hrs/day</p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Efficiency</label>
                    <p className="text-zinc-900">{selectedMachine.efficiency_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Utilization</label>
                    <p className="text-zinc-900">{selectedMachine.utilization_percentage}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Maintenance Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-2xl">
                  <div>
                    <label className="text-xs text-zinc-500">Last Maintenance</label>
                    <p className="text-zinc-900">
                      {selectedMachine.last_maintenance_date 
                        ? new Date(selectedMachine.last_maintenance_date).toLocaleDateString('en-IN')
                        : 'Not recorded'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500">Next Maintenance</label>
                    <p className="text-zinc-900">
                      {selectedMachine.next_maintenance_date 
                        ? new Date(selectedMachine.next_maintenance_date).toLocaleDateString('en-IN')
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedMachine.description && (
                <div>
                  <h3 className="text-sm font-semibold text-blue-600 mb-2">Description</h3>
                  <p className="text-zinc-700 bg-zinc-50 p-4 rounded-2xl">
                    {selectedMachine.description}
                  </p>
                </div>
              )}

              <div className="text-xs text-zinc-500 border-t border-zinc-200 pt-4 mt-4">
                <p>Created: {new Date(selectedMachine.created_at).toLocaleString('en-IN')}</p>
                <p>Last Updated: {new Date(selectedMachine.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedMachine.id);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition"
              >
                Edit Machine
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-2xl font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}