// src/components/modules/finance/vendor/VendorForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';

const VENDOR_TYPES = [
  { value: 'local', label: 'Local' },
  { value: 'outstation', label: 'Outstation' },
  { value: 'import', label: 'Import/Overseas' },
  { value: 'service', label: 'Service Provider' },
  { value: 'goods', label: 'Goods Supplier' },
];

const VendorForm = ({ vendorId, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const isEdit = !!vendorId;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    gst_number: '',
    pan_number: '',
    msme_number: '',
    vendor_type: 'goods',
    payment_terms_days: 30,
    is_active: true,
    is_approved: false,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      const res = await api.get(`/finance/vendors/${vendorId}/`);
      setFormData(res.data);
    } catch (err) {
      setError('Failed to load vendor. Please try again.');
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.gst_number && formData.gst_number.length !== 15) {
      errors.gst_number = 'GSTIN must be exactly 15 characters';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      if (isEdit) {
        await api.put(`/finance/vendors/${vendorId}/`, formData);
      } else {
        await api.post('/finance/vendors/', formData);
      }

      if (onSuccess) onSuccess();
      else navigate('/finance/vendors');
    } catch (err) {
      const serverData = err.response?.data;
      if (serverData && typeof serverData === 'object') {
        setFieldErrors(serverData);
        setError(serverData.non_field_errors?.[0] || 'Validation failed');
      } else {
        setError(
          serverData?.detail ||
          err.response?.statusText ||
          'Failed to save vendor.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-zinc-700 text-sm font-medium mb-2">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={`w-full bg-white border ${
              fieldErrors.name 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-zinc-200 focus:border-zinc-400'
            } rounded-2xl px-5 py-3.5 focus:outline-none transition`}
          />
          {fieldErrors.name && <p className="mt-1.5 text-red-600 text-sm">{fieldErrors.name}</p>}
        </div>

        {/* Email + Website */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Phone + Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">Mobile</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-zinc-700 text-sm font-medium mb-2">Full Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={4}
            className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition resize-y"
          />
        </div>

        {/* Tax Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">GSTIN</label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              maxLength={15}
              className={`w-full bg-white border ${
                fieldErrors.gst_number 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-zinc-200 focus:border-zinc-400'
              } rounded-2xl px-5 py-3.5 focus:outline-none transition font-mono uppercase`}
            />
            {fieldErrors.gst_number && <p className="mt-1.5 text-red-600 text-sm">{fieldErrors.gst_number}</p>}
          </div>

          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">PAN Number</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              maxLength={10}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">MSME / UDYAM</label>
            <input
              type="text"
              name="msme_number"
              value={formData.msme_number}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Vendor Type + Payment Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">Vendor Type</label>
            <select
              name="vendor_type"
              value={formData.vendor_type}
              onChange={handleChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            >
              {VENDOR_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-700 text-sm font-medium mb-2">
              Payment Terms (days)
            </label>
            <input
              type="number"
              name="payment_terms_days"
              value={formData.payment_terms_days}
              onChange={handleChange}
              min="0"
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="flex flex-wrap gap-8 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            <span className="text-zinc-700 font-medium select-none">Active</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_approved"
              checked={formData.is_approved}
              onChange={handleChange}
              className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            <span className="text-zinc-700 font-medium select-none">Approved</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-medium transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-70 min-w-[180px]"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? 'Saving...' : isEdit ? 'Update Vendor' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;