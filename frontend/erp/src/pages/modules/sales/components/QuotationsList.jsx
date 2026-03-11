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
} from 'lucide-react';

export default function QuotationsList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({}); // { [quotationId]: true/false }

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

  // ──────────────────────────────────────────────────────────────
  // Status change (Approve / Reject / Negotiation)
  // ──────────────────────────────────────────────────────────────
  const handleStatusChange = async (quotationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to set status to "${newStatus.replace('_', ' ')}"?`)) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [quotationId]: true }));

    try {
      await api.post(`/sale/quotations/${quotationId}/status/`, {
        status: newStatus,
      });

      await fetchQuotations();
      alert(`Status updated to "${newStatus.replace('_', ' ')}"`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [quotationId]: false }));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Convert Approved Quotation → Customer
  // ──────────────────────────────────────────────────────────────
  const handleConvertToCustomer = async (quotationId) => {
    if (!window.confirm('Convert this approved quotation to a customer?')) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [quotationId]: true }));

    try {
      const res = await api.post(`/sale/quotations/${quotationId}/convert-to-customer/`);

      alert(res.data.detail || 'Successfully converted to customer!');

      // Refresh list to reflect any UI changes
      await fetchQuotations();

      // Optional: go to the new customer page
      // if (res.data.customer_id) {
      //   navigate(`/crm/customers/${res.data.customer_id}`);
      // }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to convert to customer.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [quotationId]: false }));
    }
  };

  const canChangeStatus = (status) =>
    ['sent', 'viewed', 'in_negotiation'].includes(status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-cyan-300">All Quotations</h1>

          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by number, customer, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading quotations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No quotations found.</div>
        ) : (
          <div className="bg-gray-900/70 rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">
                      Quote #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">
                      Valid Until
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((q) => {
                    const isLoading = actionLoading[q.id];
                    const canAct = canChangeStatus(q.status);

                    return (
                      <tr key={q.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-200">
                          {q.quote_number}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {q.customer_name}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              q.status === 'approved'
                                ? 'bg-green-900/70 text-green-300 border border-green-700/50'
                                : q.status === 'rejected'
                                ? 'bg-red-900/70 text-red-300 border border-red-700/50'
                                : q.status === 'in_negotiation'
                                ? 'bg-yellow-900/70 text-yellow-300 border border-yellow-700/50'
                                : q.status === 'expired'
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-blue-900/70 text-blue-300 border border-blue-700/50'
                            }`}
                          >
                            {q.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-400">
                          ₹{Number(q.grand_total || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {q.validity_date || '—'}
                        </td>
                        <td className="px-6 py-4 text-center flex items-center justify-center gap-4">
                          {/* View PDF */}
                          {q.pdf_url && (
                            <button
                              onClick={() => window.open(q.pdf_url, '_blank')}
                              className="text-purple-400 hover:text-purple-300 transition"
                              title="View PDF"
                            >
                              <FileText size={18} />
                            </button>
                          )}

                          {/* Approve / Reject / Negotiation */}
                          {canAct && !isLoading && (
                            <>
                              <button
                                onClick={() => handleStatusChange(q.id, 'approved')}
                                className="text-green-400 hover:text-green-300 transition"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>

                              <button
                                onClick={() => handleStatusChange(q.id, 'rejected')}
                                className="text-red-400 hover:text-red-300 transition"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>

                              <button
                                onClick={() => handleStatusChange(q.id, 'in_negotiation')}
                                className="text-yellow-400 hover:text-yellow-300 transition"
                                title="Request Negotiation"
                              >
                                <MessageCircle size={18} />
                              </button>
                            </>
                          )}

                          {/* Convert to Customer – only when approved */}
{ q.status === 'approved' && !isLoading && (
  <button
    onClick={() => navigate(`/crm/customers/create?quotation=${q.id}`)}
    className="text-teal-400 hover:text-teal-300 transition"
    title="Convert to Customer"
  >
    <Users size={18} />
  </button>
)}

                          {isLoading && (
                            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          )}
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
  );
}