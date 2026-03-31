// src/pages/crm/CustomerDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { ArrowLeft } from 'lucide-react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/sale/customers/${id}/`);
        setCustomer(res.data);
      } catch (err) {
        console.error('Failed to load customer:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-cyan-400">Loading...</div>;
  if (!customer) return <div className="text-center py-20 text-red-400">Customer not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8"
      >
        <ArrowLeft size={20} /> Back to Customers
      </button>

      <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-8 shadow-xl max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-300 mb-6">{customer.full_name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-400">Email</p>
            <p className="text-lg text-gray-200">{customer.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Phone / Alternate</p>
            <p className="text-lg text-gray-200">
              {customer.phone || customer.alternate_phone || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Company</p>
            <p className="text-lg text-gray-200">{customer.company || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Status</p>
            <span
              className={`inline-block px-4 py-1 rounded-full text-sm font-medium mt-1 ${
                customer.status === 'active'
                  ? 'bg-green-900/60 text-green-300'
                  : customer.status === 'inactive'
                  ? 'bg-yellow-900/60 text-yellow-300'
                  : 'bg-red-900/60 text-red-300'
              }`}
            >
              {customer.status?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-gray-400">PAN</p>
            <p className="text-lg text-gray-200 uppercase">{customer.pan_number || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">GSTIN</p>
            <p className="text-lg text-gray-200 uppercase">{customer.gstin || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Business Type</p>
            <p className="text-lg text-gray-200">
              {customer.business_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Industry</p>
            <p className="text-lg text-gray-200">{customer.industry || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400">Credit Limit</p>
            <p className="text-lg text-emerald-400">
              ₹{Number(customer.credit_limit || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Payment Terms</p>
            <p className="text-lg text-gray-200">{customer.payment_terms_days} days</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-gray-400 mb-2">Billing Address</p>
          <p className="text-gray-200 whitespace-pre-line">{customer.billing_address || '—'}</p>
        </div>

        <div className="mt-6">
          <p className="text-gray-400 mb-2">Shipping Address</p>
          <p className="text-gray-200 whitespace-pre-line">{customer.shipping_address || '—'}</p>
        </div>

        <div className="mt-6">
          <p className="text-gray-400 mb-2">Notes</p>
          <p className="text-gray-200 whitespace-pre-line">{customer.notes || '—'}</p>
        </div>
      </div>
    </div>
  );
}