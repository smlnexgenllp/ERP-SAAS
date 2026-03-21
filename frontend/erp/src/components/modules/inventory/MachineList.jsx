// src/pages/inventory/MachineList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Factory, RefreshCw, Trash2, Edit3, 
  Clock, DollarSign, Activity, Wrench, Calendar,
  AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import api from '../../../services/api';

export default function MachineList() {
  const navigate = useNavigate();
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null); // For detail view
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name } or null

  const fetchMachines = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await api.get('/inventory/machines/');
      setMachines(response.data || []);
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

  const handleCreateNew = () => {
    navigate('/machines/create');
  };

  const handleEdit = (id) => {
    navigate(`/machines/edit/${id}`);
  };

  const handleViewDetails = (machine) => {
    setSelectedMachine(machine);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (machine) => {
    setDeleteConfirm({
      id: machine.id,
      name: machine.name
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm?.id) return;

    try {
      await api.delete(`/inventory/machines/${deleteConfirm.id}/`);
      setMachines(prev => prev.filter(m => m.id !== deleteConfirm.id));
      alert(`Machine "${deleteConfirm.name}" has been deleted.`);
    } catch (err) {
      console.error('Delete error:', err);
      const message = err.response?.data?.detail || 
                      err.response?.data?.non_field_errors?.[0] || 
                      'Failed to delete machine. It may be in use.';
      setError(message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Helper function to get status badge color
  const getMaintenanceStatusBadge = (status) => {
    switch(status) {
      case 'operational':
        return 'bg-green-900/70 text-green-300 border border-green-700/50';
      case 'maintenance':
        return 'bg-yellow-900/70 text-yellow-300 border border-yellow-700/50';
      case 'breakdown':
        return 'bg-red-900/70 text-red-300 border border-red-700/50';
      default:
        return 'bg-gray-900/70 text-gray-300 border border-gray-700/50';
    }
  };

  const getMaintenanceStatusIcon = (status) => {
    switch(status) {
      case 'operational':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'maintenance':
        return <Wrench size={14} className="text-yellow-400" />;
      case 'breakdown':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getWorkCenterTypeIcon = (type) => {
    switch(type) {
      case 'machine':
        return '⚙️';
      case 'assembly':
        return '🔧';
      case 'inspection':
        return '🔍';
      case 'labor':
        return '👤';
      default:
        return '🏭';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Factory className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">Machine / Work Center List</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-IN')} • {machines.length} machines found
            </p>
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
              <p className="text-lg mb-8">Create your first machine to get started.</p>
              <button
                onClick={handleCreateNew}
                className="bg-cyan-600 hover:bg-cyan-700 px-8 py-4 rounded-xl text-lg font-medium inline-flex items-center gap-3 shadow-lg shadow-cyan-900/30"
              >
                <Plus size={20} />
                Add New Machine
              </button>
            </div>
          ) : (
            <>
              {/* Summary Cards - Enhanced with more metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40 backdrop-blur-sm">
                  <p className="text-sm text-cyan-400 uppercase tracking-wide font-medium mb-1">Total Machines</p>
                  <p className="text-4xl font-bold text-cyan-300">{machines.length}</p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40 backdrop-blur-sm">
                  <p className="text-sm text-green-400 uppercase tracking-wide font-medium mb-1">Operational</p>
                  <p className="text-4xl font-bold text-green-300">
                    {machines.filter(m => m.maintenance_status === 'operational').length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40 backdrop-blur-sm">
                  <p className="text-sm text-yellow-400 uppercase tracking-wide font-medium mb-1">In Maintenance</p>
                  <p className="text-4xl font-bold text-yellow-300">
                    {machines.filter(m => m.maintenance_status === 'maintenance').length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40 backdrop-blur-sm">
                  <p className="text-sm text-purple-400 uppercase tracking-wide font-medium mb-1">Total Capacity</p>
                  <p className="text-4xl font-bold text-purple-300">
                    {machines.reduce((sum, m) => sum + (m.capacity_per_day_hours || 0), 0)} hrs
                  </p>
                </div>
              </div>

              {/* Machines Table - Enhanced with more columns */}
              <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-cyan-300">Machines & Work Centers</h2>
                  <span className="text-sm text-gray-400">
                    Click on any row to view details
                  </span>
                </div>

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
                      {machines.map(machine => (
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
                          <td className="py-4 px-6">{machine.department_name || '—'}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-medium">{machine.capacity_per_day_hours}</span>
                            <span className="text-xs text-gray-500 ml-1">hrs/day</span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(machine.maintenance_status)}`}
                            >
                              {getMaintenanceStatusIcon(machine.maintenance_status)}
                              {machine.maintenance_status_display || machine.maintenance_status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                machine.is_active
                                  ? 'bg-green-900/70 text-green-300 border border-green-700/50'
                                  : 'bg-red-900/70 text-red-300 border border-red-700/50'
                              }`}
                            >
                              {machine.is_active ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {machine.next_maintenance_date ? (
                              <span className="flex items-center gap-1 text-xs">
                                <Calendar size={12} className="text-gray-500" />
                                {new Date(machine.next_maintenance_date).toLocaleDateString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleEdit(machine.id)}
                                className="text-cyan-400 hover:text-cyan-300 transition-colors p-1.5 rounded-lg hover:bg-gray-700/50"
                                title="Edit machine"
                              >
                                <Edit3 size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteClick(machine)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-gray-700/50"
                                title="Delete machine"
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
              </div>
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-300 mb-4">Delete Machine?</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete
              <br />
              <strong className="text-white">"{deleteConfirm.name}"</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium transition"
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
          <div className="bg-gray-900 border border-cyan-900/40 rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-cyan-300">Machine Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
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

              {/* Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Maintenance Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusBadge(selectedMachine.maintenance_status)}`}
                    >
                      {getMaintenanceStatusIcon(selectedMachine.maintenance_status)}
                      {selectedMachine.maintenance_status_display || selectedMachine.maintenance_status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Active Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedMachine.is_active
                          ? 'bg-green-900/70 text-green-300 border border-green-700/50'
                          : 'bg-red-900/70 text-red-300 border border-red-700/50'
                      }`}
                    >
                      {selectedMachine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Capacity Planning */}
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
                  <div>
                    <label className="text-xs text-gray-500">Effective Capacity</label>
                    <p className="text-white font-medium text-cyan-300">
                      {selectedMachine.effective_capacity || 
                        (selectedMachine.capacity_per_day_hours * 
                         (selectedMachine.efficiency_percentage / 100) * 
                         (selectedMachine.utilization_percentage / 100)).toFixed(2)} hrs/day
                    </p>
                  </div>
                </div>
              </div>

              {/* Lead Time */}
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Activity size={16} /> Lead Time Settings
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-xl">
                  <div>
                    <label className="text-xs text-gray-500">Queue Time</label>
                    <p className="text-white">{selectedMachine.default_queue_time_hours} hrs</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Setup Time</label>
                    <p className="text-white">{selectedMachine.setup_time_hours} hrs</p>
                  </div>
                </div>
              </div>

              {/* Costing */}
              <div>
                <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <DollarSign size={16} /> Costing Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-800/50 p-4 rounded-xl">
                  <div>
                    <label className="text-xs text-gray-500">Hourly Labor Cost</label>
                    <p className="text-white">₹{selectedMachine.hourly_labor_cost}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Hourly Overhead Cost</label>
                    <p className="text-white">₹{selectedMachine.hourly_overhead_cost}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Total Hourly Rate</label>
                    <p className="text-white font-medium text-green-400">
                      ₹{(Number(selectedMachine.hourly_labor_cost) + Number(selectedMachine.hourly_overhead_cost)).toFixed(2)}/hr
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance Dates */}
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

              {/* Description */}
              {selectedMachine.description && (
                <div>
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2">Description</h3>
                  <p className="text-gray-300 bg-gray-800/50 p-4 rounded-xl">
                    {selectedMachine.description}
                  </p>
                </div>
              )}

              {/* Audit Info */}
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