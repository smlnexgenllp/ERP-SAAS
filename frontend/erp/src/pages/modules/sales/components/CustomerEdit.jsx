// src/pages/crm/CustomerEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';

export default function CustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // success / error
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    pan_number: '',
    gstin: '',
    aadhaar_number: '',
    business_type: '',
    industry: '',
    alternate_phone: '',
    billing_address: '',
    shipping_address: '',
    payment_terms_days: 30,
    credit_limit: 0,
    notes: '',
    status: 'active',
  });

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sale/customers/${id}/`);
        const cust = res.data;

        setFormData({
          full_name: cust.full_name || '',
          email: cust.email || '',
          phone: cust.phone || '',
          company: cust.company || '',
          pan_number: cust.pan_number || '',
          gstin: cust.gstin || '',
          aadhaar_number: cust.aadhaar_number || '',
          business_type: cust.business_type || '',
          industry: cust.industry || '',
          alternate_phone: cust.alternate_phone || '',
          billing_address: cust.billing_address || '',
          shipping_address: cust.shipping_address || '',
          payment_terms_days: Number(cust.payment_terms_days) || 30,
          credit_limit: Number(cust.credit_limit) || 0,
          notes: cust.notes || '',
          status: cust.status || 'active',
        });
      } catch (err) {
        setMessage({
          text: err.response?.data?.detail || 'Failed to load customer data.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setMessage({ text: 'Full Name is required.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      // PATCH – only send changed fields, but we send all for simplicity
      const payload = { ...formData };

      await api.patch(`/sale/customers/${id}/edit/`, payload);

      setMessage({ text: 'Customer updated successfully!', type: 'success' });

      setTimeout(() => {
        navigate(`/crm/customers/${id}`);
      }, 1500);
    } catch (err) {
      setMessage({
        text:
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          'Failed to update customer. Please check the values.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          Loading customer data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/crm/customers/${id}`)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Customer</span>
          </button>
          <h1 className="text-3xl font-bold text-cyan-300">
            Edit Customer #{id}
          </h1>
        </div>

        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-green-900/50 border-green-700 text-green-300'
                : 'bg-red-900/50 border-red-700 text-red-300'
            }`}
          >
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/60 border border-cyan-900/40 rounded-2xl p-8 shadow-xl">
          {/* Personal / Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone / Mobile</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Alternate / WhatsApp</label>
              <input
                type="text"
                name="alternate_phone"
                value={formData.alternate_phone}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Company Name</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Business Type *</label>
              <select
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              >
                <option value="">Select Type</option>
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership Firm</option>
                <option value="private_limited">Private Limited Company</option>
                <option value="limited_liability_partnership">LLP</option>
                <option value="public_limited">Public Limited Company</option>
                <option value="huf">HUF</option>
                <option value="trust">Trust / Society</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Industry / Sector</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
                placeholder="e.g. Retail, Manufacturing, IT Services"
              />
            </div>
          </div>

          {/* Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">PAN Number</label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none uppercase"
                maxLength={10}
                placeholder="ABCDE1234F"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none uppercase"
                maxLength={15}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Aadhaar (optional)</label>
              <input
                type="text"
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
                maxLength={12}
                placeholder="XXXX XXXX XXXX"
              />
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Billing Address</label>
              <textarea
                name="billing_address"
                value={formData.billing_address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-y"
                placeholder="Complete billing address..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Shipping Address</label>
              <textarea
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-y"
                placeholder="Shipping address if different..."
              />
            </div>
          </div>

          {/* Payment & Credit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Payment Terms (days)</label>
              <input
                type="number"
                name="payment_terms_days"
                value={formData.payment_terms_days}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Credit Limit (₹)</label>
              <input
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                min="0"
                step="1000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Customer Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes / Remarks</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 focus:ring-cyan-500 outline-none resize-y"
              placeholder="Any special instructions, preferences, or comments..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-800">
            <button
              type="button"
              onClick={() => navigate(`/crm/customers/${id}`)}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-xl text-white font-medium shadow-lg transition ${
                submitting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
              }`}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}