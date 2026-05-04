// src/pages/sales/CustomerCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/api';
import { Save, ArrowLeft, Users } from 'lucide-react';

export default function CustomerCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('quotation');

  const [loading, setLoading] = useState(!!quotationId);
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
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Pre-fill from quotation if ID present
  useEffect(() => {
    if (!quotationId) return;

    const fetchQuotation = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sale/quotations/${quotationId}/`);
        const q = res.data;

        setFormData(prev => ({
          ...prev,
          full_name: q.customer_name || '',
          email: q.customer_email || '',
          company: q.customer_company || '',
        }));
      } catch (err) {
        setMessage('Could not load quotation data.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    if (!quotationId) {
      setMessage("No quotation ID found in URL. Cannot convert.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = { ...formData };

      const res = await api.post(
        `/sale/quotations/${quotationId}/convert-to-customer/`,
        payload
      );

      setMessage('Customer created successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/sale/orders/create?customer=${res.data.customer_id || res.data.id}`);
      }, 1500);
    } catch (err) {
      console.error('Conversion error:', err.response?.data || err);
      setMessage(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to convert quotation to customer. Please check the form.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {quotationId ? 'Convert Quotation to Customer' : 'Add New Customer'}
                </h1>
                <p className="text-zinc-500">
                  {quotationId 
                    ? 'Complete customer details from approved quotation' 
                    : 'Create a new customer record'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-5 rounded-2xl mb-8 text-sm font-medium border ${
            message.toLowerCase().includes('success') || message.includes('created')
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading quotation data...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Personal & Contact Info */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-6">Personal & Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Phone / Mobile</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Alternate / WhatsApp</label>
                    <input
                      type="text"
                      name="alternate_phone"
                      value={formData.alternate_phone}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-6">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Company Name</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Business Type *</label>
                    <select
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    >
                      <option value="">Select Business Type</option>
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
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Industry / Sector</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      placeholder="e.g. Retail, Manufacturing, IT Services"
                    />
                  </div>
                </div>
              </div>

              {/* Compliance Details */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-6">Compliance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">PAN Number</label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 uppercase tracking-wider"
                      maxLength={10}
                      placeholder="ABCDE1234F"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">GSTIN</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 uppercase tracking-wider"
                      maxLength={15}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleChange}
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                      maxLength={12}
                      placeholder="XXXX XXXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-6">Addresses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Billing Address</label>
                    <textarea
                      name="billing_address"
                      value={formData.billing_address}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-y"
                      placeholder="Complete billing address with PIN code..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Shipping Address</label>
                    <textarea
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-y"
                      placeholder="Shipping address (if different from billing)..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Credit */}
              <div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-6">Payment & Credit Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Payment Terms (days)</label>
                    <input
                      type="number"
                      name="payment_terms_days"
                      value={formData.payment_terms_days}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-600 mb-2">Credit Limit (₹)</label>
                    <input
                      type="number"
                      name="credit_limit"
                      value={formData.credit_limit}
                      onChange={handleChange}
                      min="0"
                      step="1000"
                      className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Notes / Remarks</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 resize-y"
                  placeholder="Any special instructions, preferences, or important notes..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center gap-3 px-10 py-3.5 rounded-2xl font-medium transition ${
                    submitting
                      ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm'
                  }`}
                >
                  <Save size={20} />
                  {submitting ? 'Saving Customer...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}