// src/pages/finance/GSTReconciliation.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiArrowLeft,
  FiFileText, 
  FiSearch 
} from "react-icons/fi";
import api from '../../../../services/api';

function GSTReconciliation() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    let filtered = [...records];

    if (search) {
      filtered = filtered.filter(
        (row) =>
          row.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
          row.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
          row.gstin?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, search, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/gst-reconciliation/');

      setRecords(response.data);
      setFilteredRecords(response.data);
    } catch (error) {
      console.error('Error fetching GST reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
          >
            <FiArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
              <FiFileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                GST Reconciliation
              </h1>
              <p className="text-zinc-500">Compare GSTR-1 vs Books of Accounts</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search invoice, customer or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl focus:outline-none focus:border-zinc-400 min-w-[200px]"
          >
            <option value="all">All Status</option>
            <option value="matched">Matched</option>
            <option value="mismatch">Mismatch</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Month</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Invoice</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Customer</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">GSTIN</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">Taxable Amount</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">GST Amount</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">Portal GST</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-20">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-zinc-500 mt-4">Loading GST records...</p>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-20 text-zinc-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-8 py-6 text-zinc-700">{row.reconciliation_month}</td>
                      <td className="px-8 py-6 font-medium text-zinc-900">{row.invoice_number}</td>
                      <td className="px-8 py-6 text-zinc-700">{row.customer_name}</td>
                      <td className="px-8 py-6 font-mono text-zinc-700">{row.gstin}</td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {Number(row.taxable_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {Number(row.gst_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {Number(row.portal_gst_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                            row.status === 'matched'
                              ? 'bg-emerald-100 text-emerald-700'
                              : row.status === 'mismatch'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {row.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GSTReconciliation;