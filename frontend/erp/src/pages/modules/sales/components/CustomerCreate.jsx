import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../services/api';
import { Save, ArrowLeft } from 'lucide-react';

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
          // phone, alternate_phone, addresses → will be filled manually or from lead
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
    const payload = {
      ...formData,
      // No need to send quotation_id — it's already in the URL
    };

    console.log('Submitting to:', `/sale/quotations/${quotationId}/convert-to-customer/`);
    console.log('Payload:', payload); // ← debug: check what is sent

    const res = await api.post(
      `/sale/quotations/${quotationId}/convert-to-customer/`,
      payload
    );

setMessage('Customer saved! Redirecting to Sales Order creation...');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-cyan-300">
            {quotationId ? 'Convert Quotation to Customer' : 'Add New Customer'}
          </h1>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${
            message.includes('success') ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-cyan-400 animate-pulse">Loading quotation data...</div>
        ) : (
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Phone / Mobile</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Alternate / WhatsApp</label>
                <input
                  type="text"
                  name="alternate_phone"
                  value={formData.alternate_phone}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Business Type *</label>
                <select
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none uppercase"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none uppercase"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Notes / Remarks</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:border-cyan-500 outline-none resize-y"
                placeholder="Any special instructions, preferences, or comments..."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
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
                {submitting ? 'Saving...' : 'Create Customer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}