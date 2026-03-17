// src/pages/inventory/MachineEdit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Factory, Save, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../../services/api';

export default function MachineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    capacity_per_day_hours: 8,
    is_active: true,
  });

  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch both departments and current machine data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load departments (same as create)
        const deptRes = await api.get('/hr/departments/');
        setDepartments(deptRes.data || []);

        // Load existing machine
        const machineRes = await api.get(`/inventory/machines/${id}/`);
        const machine = machineRes.data;

        setFormData({
          name: machine.name || '',
          code: machine.code || '',
          description: machine.description || '',
          department: machine.department || '', // should be the ID
          capacity_per_day_hours: machine.capacity_per_day_hours || 8,
          is_active: machine.is_active !== false,
        });
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
          'Failed to load machine or departments. Please try again.'
        );
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.put(`/inventory/machines/${id}/`, formData);
      alert('Machine updated successfully');
      navigate('/machines-list');
    } catch (err) {
      const errMsg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Failed to update machine. Please check your input.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Factory className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">Edit Machine</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString('en-IN')} • ID: {id}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900/70 rounded-2xl border border-cyan-900/40 backdrop-blur-sm shadow-xl p-8">
            {error && (
              <div className="bg-red-900/60 border border-red-700 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="mt-1 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">
                  Machine Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="CNC Lathe M1"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Machine Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="MCH-001"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                >
                  <option value="">— Select Department —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.code && `(${dept.code})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">
                  Capacity per day (hours)
                </label>
                <input
                  type="number"
                  name="capacity_per_day_hours"
                  value={formData.capacity_per_day_hours}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-300 mb-2 font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  placeholder="Brief description or notes about this machine..."
                />
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-600 rounded bg-gray-800"
                />
                <label className="text-gray-300 font-medium">Active / Available for production</label>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    submitting
                      ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 shadow-lg shadow-cyan-900/30'
                  }`}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 px-6 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}