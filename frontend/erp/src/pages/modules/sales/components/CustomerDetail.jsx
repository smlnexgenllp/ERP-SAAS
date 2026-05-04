// src/pages/crm/CustomerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sale/customers/${id}/`);
        setCustomer(res.data);
      } catch (err) {
        console.error('Failed to load customer:', err);
        setError('Failed to load customer details. The customer may not exist or you may not have access.');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Customer Not Found</h2>
          <p className="text-zinc-600 mb-8">{error || 'The requested customer could not be found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

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
              <span className="font-medium">Back to Customers</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {customer.full_name}
                </h1>
                <p className="text-zinc-500">Customer Profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-10">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
              <div>
                <p className="text-sm text-zinc-500">Email</p>
                <p className="font-medium text-zinc-900 mt-2 break-all">{customer.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Phone</p>
                <p className="font-medium text-zinc-900 mt-2">{customer.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Alternate / WhatsApp</p>
                <p className="font-medium text-zinc-900 mt-2">{customer.alternate_phone || '—'}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-500">Company</p>
                <p className="font-medium text-zinc-900 mt-2">{customer.company || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Status</p>
                <span
                  className={`inline-block px-5 py-2 mt-2 rounded-2xl text-xs font-medium ${
                    customer.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : customer.status === 'inactive'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {customer.status ? customer.status.toUpperCase() : 'UNKNOWN'}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Industry</p>
                <p className="font-medium text-zinc-900 mt-2">{customer.industry || '—'}</p>
              </div>

              <div>
                <p className="text-sm text-zinc-500">PAN Number</p>
                <p className="font-medium text-zinc-900 mt-2 uppercase tracking-wider">
                  {customer.pan_number || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">GSTIN</p>
                <p className="font-medium text-zinc-900 mt-2 uppercase tracking-wider">
                  {customer.gstin || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Business Type</p>
                <p className="font-medium text-zinc-900 mt-2">
                  {customer.business_type
                    ? customer.business_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-sm text-zinc-500">Credit Limit</p>
                <p className="font-semibold text-emerald-600 mt-2 text-xl">
                  ₹{Number(customer.credit_limit || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Payment Terms</p>
                <p className="font-medium text-zinc-900 mt-2">
                  {customer.payment_terms_days || 0} days
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Billing Address</h3>
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-zinc-700 whitespace-pre-line leading-relaxed">
                  {customer.billing_address || 'No billing address provided.'}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Shipping Address</h3>
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-zinc-700 whitespace-pre-line leading-relaxed">
                  {customer.shipping_address || 'No shipping address provided.'}
                </div>
              </div>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-zinc-900 mb-4">Notes / Remarks</h3>
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-zinc-700 whitespace-pre-line leading-relaxed">
                  {customer.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}