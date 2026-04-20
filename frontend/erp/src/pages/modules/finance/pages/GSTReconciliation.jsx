// GSTReconciliation.jsx

import React, { useEffect, useState } from 'react';
import { FaFileInvoiceDollar, FaSearch } from 'react-icons/fa';
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
    <div className="min-h-screen bg-[#020617] text-cyan-300 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaFileInvoiceDollar className="text-3xl text-cyan-400" />
        <h1 className="text-3xl font-bold">GST Reconciliation</h1>
      </div>

      <div className="bg-[#0f172a] border border-cyan-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute top-4 left-3 text-cyan-500" />
          <input
            type="text"
            placeholder="Search invoice, customer or GSTIN"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e293b] border border-cyan-500/20 rounded-xl py-3 pl-10 pr-4 text-cyan-200 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1e293b] border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-200 outline-none"
        >
          <option value="all">All Status</option>
          <option value="matched">Matched</option>
          <option value="mismatch">Mismatch</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="bg-[#0f172a] border border-cyan-500/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cyan-900/20 text-cyan-200">
              <tr>
                <th className="px-4 py-4 text-left">Month</th>
                <th className="px-4 py-4 text-left">Invoice</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">GSTIN</th>
                <th className="px-4 py-4 text-left">Taxable Amount</th>
                <th className="px-4 py-4 text-left">GST Amount</th>
                <th className="px-4 py-4 text-left">Portal GST</th>
                <th className="px-4 py-4 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-cyan-500/10 hover:bg-cyan-900/10"
                  >
                    <td className="px-4 py-4">{row.reconciliation_month}</td>
                    <td className="px-4 py-4">{row.invoice_number}</td>
                    <td className="px-4 py-4">{row.customer_name}</td>
                    <td className="px-4 py-4">{row.gstin}</td>
                    <td className="px-4 py-4">₹ {row.taxable_amount}</td>
                    <td className="px-4 py-4">₹ {row.gst_amount}</td>
                    <td className="px-4 py-4">₹ {row.portal_gst_amount}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          row.status === 'matched'
                            ? 'bg-green-500/20 text-green-400'
                            : row.status === 'mismatch'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {row.status}
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
  );
}

export default GSTReconciliation;