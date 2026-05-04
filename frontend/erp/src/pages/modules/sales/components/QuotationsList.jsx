// src/pages/sales/QuotationsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  MessageCircle,
  Users,
  ArrowLeft,
  AlertCircle,
  Briefcase,
  FileCheck,
  CreditCard,
  LogOut 
} from 'lucide-react';

export default function QuotationsList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sale/quotations/');
      setQuotations(res.data);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = quotations.filter((q) =>
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.status?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (quotationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to set status to "${newStatus.replace('_', ' ')}"?`)) return;

    setActionLoading((prev) => ({ ...prev, [quotationId]: true }));

    try {
      await api.post(`/sale/quotations/${quotationId}/status/`, { status: newStatus });
      await fetchQuotations();
      alert(`Status updated to "${newStatus.replace('_', ' ')}"`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [quotationId]: false }));
    }
  };

  const handleConvertToCustomer = async (quotationId) => {
    if (!window.confirm('Convert this approved quotation to a customer?')) return;

    setActionLoading((prev) => ({ ...prev, [quotationId]: true }));

    try {
      const res = await api.post(`/sale/quotations/${quotationId}/convert-to-customer/`);
      alert(res.data.detail || 'Successfully converted to customer!');
      await fetchQuotations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to convert to customer.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [quotationId]: false }));
    }
  };

  const canChangeStatus = (status) =>
    ['sent', 'viewed', 'in_negotiation'].includes(status);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      {/* Main Content - Sidebar Removed */}
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate('/sales/dashboard')}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-900">All Quotations</h1>
                  <p className="text-zinc-500">Manage and track your quotations</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search by quote number, customer, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-6 text-lg font-medium">Loading quotations...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
              <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-xl text-zinc-600">No quotations found</p>
              <p className="text-zinc-500 mt-2">Try adjusting your search term</p>
            </div>
          ) : (
            /* Table Card */
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Quote #</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Customer</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Status</th>
                      <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Amount</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Valid Until</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filtered.map((q) => {
                      const isLoading = actionLoading[q.id];
                      const canAct = canChangeStatus(q.status);

                      return (
                        <tr key={q.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="px-8 py-6 font-medium text-zinc-900">{q.quote_number}</td>
                          <td className="px-8 py-6 text-zinc-700">{q.customer_name}</td>
                          <td className="px-8 py-6">
                            <span className={`inline-block px-4 py-1.5 rounded-2xl text-xs font-medium ${
                              q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              q.status === 'in_negotiation' ? 'bg-amber-100 text-amber-700' :
                              q.status === 'expired' ? 'bg-zinc-100 text-zinc-600' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {q.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right font-semibold text-emerald-600">
                            ₹{Number(q.grand_total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-8 py-6 text-zinc-600">
                            {q.validity_date || '—'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-5">
                              {q.pdf_url && (
                                <button
                                  onClick={() => window.open(q.pdf_url, '_blank')}
                                  className="text-purple-600 hover:text-purple-700 transition"
                                  title="View PDF"
                                >
                                  <FileText size={20} />
                                </button>
                              )}

                              {canAct && !isLoading && (
                                <>
                                  <button onClick={() => handleStatusChange(q.id, 'approved')} className="text-emerald-600 hover:text-emerald-700 transition" title="Approve">
                                    <CheckCircle size={20} />
                                  </button>
                                  <button onClick={() => handleStatusChange(q.id, 'rejected')} className="text-red-600 hover:text-red-700 transition" title="Reject">
                                    <XCircle size={20} />
                                  </button>
                                  <button onClick={() => handleStatusChange(q.id, 'in_negotiation')} className="text-amber-600 hover:text-amber-700 transition" title="Request Negotiation">
                                    <MessageCircle size={20} />
                                  </button>
                                </>
                              )}

                              {q.status === 'approved' && !isLoading && (
                                <button
                                  onClick={() => handleConvertToCustomer(q.id)}
                                  className="text-teal-600 hover:text-teal-700 transition"
                                  title="Convert to Customer"
                                >
                                  <Users size={20} />
                                </button>
                              )}

                              {isLoading && <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}