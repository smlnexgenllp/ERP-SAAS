// src/pages/inventory/MachineList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Factory, RefreshCw, Trash2, Edit3, 
  Clock, DollarSign, Activity, Wrench, Calendar,
  AlertCircle, CheckCircle, XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
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
      
      // Sort by newest first
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
      case 'operational': return 'bg-green-900/70 text-green-300 border border-green-700/50';
      case 'maintenance': return 'bg-yellow-900/70 text-yellow-300 border border-yellow-700/50';
      case 'breakdown':   return 'bg-red-900/70 text-red-300 border border-red-700/50';
      default:            return 'bg-gray-700 text-gray-300';
    }
  };

  const getMaintenanceStatusIcon = (status) => {
    switch(status) {
      case 'operational': return <CheckCircle size={14} className="text-green-400" />;
      case 'maintenance': return <Wrench size={14} className="text-yellow-400" />;
      case 'breakdown':   return <XCircle size={14} className="text-red-400" />;
      default:            return <AlertCircle size={14} className="text-gray-400" />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* Header with Back Button */}
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/manufacturing/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Factory className="w-9 h-9 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-300">Machine / Work Center List</h1>
              <p className="text-sm text-gray-400">
                {new Date().toLocaleDateString('en-IN')} • {machines.length} machines
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border ${
              refreshing 
                ? 'bg-gray-700 cursor-not-allowed text-gray-400 border-gray-600' 
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
            }`}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-cyan-900/30"
          >
            <Plus size={16} />
            Add New Machine
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-400 animate-pulse text-xl flex items-center gap-3">
                <RefreshCw className="animate-spin" size={24} />
                Loading machines...
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-8 rounded-2xl text-center max-w-2xl mx-auto">
              <p className="text-lg mb-4">{error}</p>
              <button
                onClick={fetchMachines}
                className="mt-2 bg-red-700 hover:bg-red-600 px-6 py-3 rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          ) : machines.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Factory className="w-20 h-20 mx-auto mb-6 opacity-40" />
              <h2 className="text-2xl font-semibold mb-3">No machines registered yet</h2>
              <button
                onClick={handleCreateNew}
                className="bg-cyan-600 hover:bg-cyan-700 px-8 py-4 rounded-xl text-lg font-medium inline-flex items-center gap-3"
              >
                <Plus size={20} /> Add New Machine
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40">
                  <p className="text-sm text-cyan-400 uppercase tracking-wide font-medium mb-1">Total Machines</p>
                  <p className="text-4xl font-bold text-white">{machines.length}</p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40">
                  <p className="text-sm text-green-400 uppercase tracking-wide font-medium mb-1">Operational</p>
                  <p className="text-4xl font-bold text-green-300">
                    {machines.filter(m => m.maintenance_status === 'operational').length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40">
                  <p className="text-sm text-yellow-400 uppercase tracking-wide font-medium mb-1">In Maintenance</p>
                  <p className="text-4xl font-bold text-yellow-300">
                    {machines.filter(m => m.maintenance_status === 'maintenance').length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40">
                  <p className="text-sm text-purple-400 uppercase tracking-wide font-medium mb-1">Total Capacity</p>
                  <p className="text-4xl font-bold text-purple-300">
                    {machines.reduce((sum, m) => sum + (m.capacity_per_day_hours || 0), 0)} hrs
                  </p>
                </div>
              </div>

              {/* Machines Table */}
              <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-950/50 border-b border-gray-700 text-left text-gray-300">
                        <th className="py-4 px-6 font-semibold">Name / Code</th>
                        <th className="py-4 px-6 font-semibold">Type</th>
                        <th className="py-4 px-6 font-semibold">Department</th>
                        <th className="py-4 px-6 font-semibold text-center">Capacity</th>
                        <th className="py-4 px-6 font-semibold">Maintenance Status</th>
                        <th className="py-4 px-6 font-semibold">Active</th>
                        <th className="py-4 px-6 font-semibold">Next Maint.</th>
                        <th className="py-4 px-6 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMachines.map(machine => (
                        <tr
                          key={machine.id}
                          onClick={() => handleViewDetails(machine)}
                          className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{machine.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{machine.code || '—'}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="flex items-center gap-2">
                              <span>{getWorkCenterTypeIcon(machine.work_center_type)}</span>
                              <span>{machine.work_center_type_display || machine.work_center_type}</span>
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-300">{machine.department_name || '—'}</td>
                          <td className="py-4 px-6 text-center text-gray-300">
                            {machine.capacity_per_day_hours} hrs/day
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(machine.maintenance_status)}`}>
                              {getMaintenanceStatusIcon(machine.maintenance_status)}
                              {machine.maintenance_status_display || machine.maintenance_status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              machine.is_active ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                            }`}>
                              {machine.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-400">
                            {machine.next_maintenance_date 
                              ? new Date(machine.next_maintenance_date).toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => handleEdit(machine.id)}
                                className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-gray-700/50"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(machine)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-gray-700/50"
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
                  <div className="p-6 border-t border-gray-800 flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, machines.length)} of {machines.length} machines
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
                      >
                        <ChevronLeft size={18} /> Previous
                      </button>

                      <div className="px-5 py-2 bg-gray-800 rounded-xl text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>

                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
                      >
                        Next <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-300 mb-4">Delete Machine?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-700 hover:bg-red-600 py-3 rounded-xl font-medium"
              >
                Yes, Delete
              </button>
              <button 
                onClick={cancelDelete}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Detail Modal */}
      {showDetailModal && selectedMachine && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-900/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-cyan-300">Machine Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white text-xl">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Name</label>
                  <p className="text-white font-medium">{selectedMachine.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Code</label>
                  <p className="text-white font-mono">{selectedMachine.code}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Department</label>
                  <p className="text-white">{selectedMachine.department_name || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Work Center Type</label>
                  <p className="text-white">{selectedMachine.work_center_type_display || selectedMachine.work_center_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Maintenance Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(selectedMachine.maintenance_status)}`}>
                      {getMaintenanceStatusIcon(selectedMachine.maintenance_status)}
                      {selectedMachine.maintenance_status_display || selectedMachine.maintenance_status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Active Status</label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedMachine.is_active ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                    }`}>
                      {selectedMachine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Clock size={16} /> Capacity Planning
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-800/50 p-4 rounded-xl">
                  <div>
                    <label className="text-xs text-gray-500">Daily Capacity</label>
                    <p className="text-white">{selectedMachine.capacity_per_day_hours} hrs/day</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Efficiency</label>
                    <p className="text-white">{selectedMachine.efficiency_percentage}%</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Utilization</label>
                    <p className="text-white">{selectedMachine.utilization_percentage}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Maintenance Schedule
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-xl">
                  <div>
                    <label className="text-xs text-gray-500">Last Maintenance</label>
                    <p className="text-white">
                      {selectedMachine.last_maintenance_date 
                        ? new Date(selectedMachine.last_maintenance_date).toLocaleDateString('en-IN')
                        : 'Not recorded'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Next Maintenance</label>
                    <p className="text-white">
                      {selectedMachine.next_maintenance_date 
                        ? new Date(selectedMachine.next_maintenance_date).toLocaleDateString('en-IN')
                        : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedMachine.description && (
                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2">Description</h3>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-xl">
                    {selectedMachine.description}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 border-t border-gray-800 pt-4 mt-4">
                <p>Created: {new Date(selectedMachine.created_at).toLocaleString('en-IN')}</p>
                <p>Last Updated: {new Date(selectedMachine.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedMachine.id);
                }}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition"
              >
                Edit Machine
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
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