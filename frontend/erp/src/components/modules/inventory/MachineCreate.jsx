// src/pages/production/MachineCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, PlusCircle, ArrowLeft, Settings, Clock, DollarSign, Wrench } from 'lucide-react';
import api from '../../../services/api';

export default function MachineCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    department: null,
    work_center_type: 'machine',
    maintenance_status: 'operational',
    is_active: true,
    capacity_per_day_hours: 8,
    efficiency_percentage: 100.00,
    utilization_percentage: 100.00,
    default_queue_time_hours: 0,
    setup_time_hours: 0,
    hourly_labor_cost: 0,
    hourly_overhead_cost: 0,
    last_maintenance_date: '',
    next_maintenance_date: '',
    description: '',
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const workCenterTypes = [
    { value: 'machine', label: 'Machine Tool' },
    { value: 'assembly', label: 'Assembly Station' },
    { value: 'inspection', label: 'Quality Station' },
    { value: 'labor', label: 'Manual Work' },
  ];

  const maintenanceStatuses = [
    { value: 'operational', label: 'Operational' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'breakdown', label: 'Breakdown' },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/hr/departments/');
        setDepartments(response.data);
      } catch (err) {
        setError('Failed to load departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? '' : Number(value)) : 
              value,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const submitData = {
      name: formData.name,
      department: formData.department ? parseInt(formData.department) : null,
      work_center_type: formData.work_center_type,
      maintenance_status: formData.maintenance_status,
      is_active: formData.is_active,
      capacity_per_day_hours: formData.capacity_per_day_hours,
      efficiency_percentage: formData.efficiency_percentage,
      utilization_percentage: formData.utilization_percentage,
      default_queue_time_hours: formData.default_queue_time_hours,
      setup_time_hours: formData.setup_time_hours,
      hourly_labor_cost: formData.hourly_labor_cost,
      hourly_overhead_cost: formData.hourly_overhead_cost,
      last_maintenance_date: formData.last_maintenance_date || null,
      next_maintenance_date: formData.next_maintenance_date || null,
    };

    if (formData.description && formData.description.trim() !== '') {
      submitData.description = formData.description;
    }

    Object.keys(submitData).forEach(key => {
      if (submitData[key] === null || submitData[key] === '') {
        delete submitData[key];
      }
    });

    try {
      const response = await api.post('/inventory/machines/', submitData);
      
      // ✅ Changed navigation to /machines-list
      navigate('/machines-list', { 
        state: { message: 'Machine created successfully!' } 
      });
    } catch (err) {
      console.error('Full error object:', err);
      if (err.response?.data) {
        const responseData = err.response.data;
        if (responseData.detail) {
          setError(responseData.detail);
        } else if (responseData.non_field_errors) {
          setError(responseData.non_field_errors[0]);
        } else {
          const fieldErrorsObj = {};
          let hasFieldErrors = false;
          Object.keys(responseData).forEach(key => {
            if (Array.isArray(responseData[key])) {
              fieldErrorsObj[key] = responseData[key][0];
              hasFieldErrors = true;
            } else if (typeof responseData[key] === 'string') {
              fieldErrorsObj[key] = responseData[key];
              hasFieldErrors = true;
            }
          });
          if (hasFieldErrors) {
            setFieldErrors(fieldErrorsObj);
          } else {
            setError('Failed to create machine. Please check all fields.');
          }
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Factory },
    { id: 'capacity', label: 'Capacity', icon: Clock },
    { id: 'leadtime', label: 'Lead Time', icon: Settings },
    { id: 'costing', label: 'Costing', icon: DollarSign },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-blue-600 animate-pulse text-xl">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Factory className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Create New Machine</h1>
            <p className="text-sm text-zinc-500">
              {new Date().toLocaleDateString('en-IN')} • Add to inventory
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-2xl transition font-medium"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
                {error}
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-200 pb-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Machine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full bg-white border ${
                        fieldErrors.name ? 'border-red-500' : 'border-zinc-200'
                      } rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="CNC Lathe M1"
                    />
                    {fieldErrors.name && <p className="mt-1 text-sm text-red-500">{fieldErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Department</label>
                    <select
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                      className={`w-full bg-white border ${
                        fieldErrors.department ? 'border-red-500' : 'border-zinc-200'
                      } rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="">— Select Department —</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code && `(${dept.code})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Work Center Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="work_center_type"
                      value={formData.work_center_type}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {workCenterTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Maintenance Status</label>
                    <select
                      name="maintenance_status"
                      value={formData.maintenance_status}
                      onChange={handleChange}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {maintenanceStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-zinc-300 rounded"
                    />
                    <label className="text-zinc-700 font-medium">Active / Available for production</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description or notes about this machine..."
                    />
                  </div>
                </div>
              )}

              {/* Capacity Tab */}
              {activeTab === 'capacity' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Capacity Planning</h3>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Capacity per day (hours) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="capacity_per_day_hours"
                      value={formData.capacity_per_day_hours}
                      onChange={handleChange}
                      min="1"
                      max="24"
                      step="1"
                      required
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Efficiency Percentage (%)</label>
                    <input
                      type="number"
                      name="efficiency_percentage"
                      value={formData.efficiency_percentage}
                      onChange={handleChange}
                      min="0"
                      max="200"
                      step="0.01"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Utilization Percentage (%)</label>
                    <input
                      type="number"
                      name="utilization_percentage"
                      value={formData.utilization_percentage}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Lead Time Tab */}
              {activeTab === 'leadtime' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Lead Time Settings</h3>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Default Queue Time (hours)</label>
                    <input
                      type="number"
                      name="default_queue_time_hours"
                      value={formData.default_queue_time_hours}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Setup Time (hours)</label>
                    <input
                      type="number"
                      name="setup_time_hours"
                      value={formData.setup_time_hours}
                      onChange={handleChange}
                      min="0"
                      step="0.5"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Costing Tab */}
              {activeTab === 'costing' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Costing Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Hourly Labor Cost (₹)</label>
                    <input
                      type="number"
                      name="hourly_labor_cost"
                      value={formData.hourly_labor_cost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Hourly Overhead Cost (₹)</label>
                    <input
                      type="number"
                      name="hourly_overhead_cost"
                      value={formData.hourly_overhead_cost}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Maintenance Tab */}
              {activeTab === 'maintenance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Maintenance Schedule</h3>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Last Maintenance Date</label>
                    <input
                      type="date"
                      name="last_maintenance_date"
                      value={formData.last_maintenance_date}
                      onChange={handleDateChange}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Next Maintenance Date</label>
                    <input
                      type="date"
                      name="next_maintenance_date"
                      value={formData.next_maintenance_date}
                      onChange={handleDateChange}
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  disabled={activeTab === tabs[0].id}
                  className="px-6 py-3 text-zinc-600 hover:bg-zinc-100 rounded-2xl font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  disabled={activeTab === tabs[tabs.length - 1].id}
                  className="px-6 py-3 text-zinc-600 hover:bg-zinc-100 rounded-2xl font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    submitting 
                      ? 'bg-zinc-300 cursor-not-allowed text-zinc-500' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {submitting ? 'Creating Machine...' : (
                    <>
                      <PlusCircle size={18} />
                      Create Machine
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 py-4 px-6 bg-zinc-100 hover:bg-zinc-200 rounded-2xl font-semibold transition"
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