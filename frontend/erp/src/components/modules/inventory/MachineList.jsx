// src/pages/inventory/MachineList.jsx   (or production/MachineList.jsx - adjust path as needed)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Factory, RefreshCw, Trash2, Edit3 } from 'lucide-react';
import api from '../../../services/api'; // your axios instance with auth

export default function MachineList() {
  const navigate = useNavigate();
  
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40 backdrop-blur-sm">
                  <p className="text-sm text-cyan-400 uppercase tracking-wide font-medium mb-1">Total Machines</p>
                  <p className="text-4xl font-bold text-cyan-300">{machines.length}</p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40 backdrop-blur-sm">
                  <p className="text-sm text-green-400 uppercase tracking-wide font-medium mb-1">Active</p>
                  <p className="text-4xl font-bold text-green-300">
                    {machines.filter(m => m.is_active).length}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40 backdrop-blur-sm">
                  <p className="text-sm text-yellow-400 uppercase tracking-wide font-medium mb-1">Departments Used</p>
                  <p className="text-4xl font-bold text-yellow-300">
                    {new Set(machines.map(m => m.department_name).filter(Boolean)).size}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-cyan-300">Machines & Work Centers</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-950/50 border-b border-gray-700 text-left text-gray-300">
                        <th className="py-4 px-6 font-semibold">Name</th>
                        <th className="py-4 px-6 font-semibold">Code</th>
                        <th className="py-4 px-6 font-semibold">Department</th>
                        <th className="py-4 px-6 font-semibold text-center">Capacity (hrs/day)</th>
                        <th className="py-4 px-6 font-semibold">Status</th>
                        <th className="py-4 px-6 font-semibold">Created</th>
                        <th className="py-4 px-6 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {machines.map(machine => (
                        <tr
                          key={machine.id}
                          className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-white">{machine.name}</td>
                          <td className="py-4 px-6 text-gray-400">{machine.code || '—'}</td>
                          <td className="py-4 px-6">{machine.department_name || 'Not assigned'}</td>
                          <td className="py-4 px-6 text-center">{machine.capacity_per_day_hours}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                machine.is_active
                                  ? 'bg-green-900/70 text-green-300 border border-green-700/50'
                                  : 'bg-red-900/70 text-red-300 border border-red-700/50'
                              }`}
                            >
                              {machine.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-400">
                            {new Date(machine.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-center flex items-center justify-center gap-4">
                            <button
                              onClick={() => handleEdit(machine.id)}
                              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                              title="Edit machine"
                            >
                              <Edit3 size={16} />
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteClick(machine)}
                              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                              title="Delete machine"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
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
    </div>
  );
}