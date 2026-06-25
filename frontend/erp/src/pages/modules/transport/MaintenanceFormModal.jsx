// src/components/maintenance/MaintenanceFormModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import Select from 'react-select';

const MaintenanceFormModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    vehicle: '',
    maintenance_type: '',
    service_center: '',
    service_date: '',
    next_service_date: '',
    cost: '',
    odometer_reading: '',
    status: 'scheduled',
    notes: '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch Vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/transport/vehicle-maintenance/vehicles/');
        const options = res.data.map(v => ({
          value: v.id,
          label: `${v.vehicle_number} (${v.brand} ${v.model}) - ${v.status}`,
        }));
        setVehicles(options);
      } catch (err) {
        console.error("Failed to load vehicles", err);
      } finally {
        setLoadingVehicles(false);
      }
    };

    if (isOpen) {
      fetchVehicles();
      setSubmitError(null);
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        vehicle: initialData.vehicle || '',
        maintenance_type: initialData.maintenance_type || '',
        service_center: initialData.service_center || '',
        service_date: initialData.service_date || '',
        next_service_date: initialData.next_service_date || '',
        cost: initialData.cost || '',
        odometer_reading: initialData.odometer_reading || '',
        status: initialData.status || 'scheduled',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        vehicle: '',
        maintenance_type: '',
        service_center: '',
        service_date: '',
        next_service_date: '',
        cost: '',
        odometer_reading: '',
        status: 'scheduled',
        notes: '',
      });
    }
    setSubmitError(null);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, vehicle: selectedOption ? selectedOption.value : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      vehicle: formData.vehicle || null,
      maintenance_type: formData.maintenance_type || "",
      service_center: formData.service_center || "",
      service_date: formData.service_date || null,
      next_service_date: formData.next_service_date || null,
      cost: formData.cost !== "" ? Number(formData.cost) : null,
      odometer_reading: formData.odometer_reading !== "" ? Number(formData.odometer_reading) : null,
      status: formData.status || "scheduled",
      notes: formData.notes || "",
    };

    try {
      if (initialData) {
        await api.put(`/transport/vehicle-maintenance/${initialData.id}/`, payload);
      } else {
        await api.post("/transport/vehicle-maintenance/", payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("API Error:", err);
      let errorMsg = 'Failed to save maintenance record. Please try again.';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          errorMsg = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
        } else {
          errorMsg = err.response.data;
        }
      }
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header with X Button */}
        <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">
            {initialData ? 'Edit Maintenance Record' : 'New Maintenance Record'}
          </h2>
          
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-6 h-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6h12v12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle <span className="text-red-500">*</span>
            </label>
            <Select
              options={vehicles}
              value={vehicles.find(v => v.value === formData.vehicle)}
              onChange={handleVehicleChange}
              isLoading={loadingVehicles}
              placeholder="Search and select vehicle..."
              isClearable
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
              <input
                type="text"
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Oil Change, Brake Service"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Center</label>
              <input
                type="text"
                name="service_center"
                value={formData.service_center}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Service Center Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
              <input
                type="date"
                name="service_date"
                value={formData.service_date}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Service Due</label>
              <input
                type="date"
                name="next_service_date"
                value={formData.next_service_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading</label>
              <input
                type="number"
                name="odometer_reading"
                value={formData.odometer_reading}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional remarks..."
            />
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-70 flex items-center gap-2 transition"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Record' : 'Create Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceFormModal;