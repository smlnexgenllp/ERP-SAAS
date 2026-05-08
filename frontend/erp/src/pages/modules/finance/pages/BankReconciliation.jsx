// src/pages/finance/BankReconciliation.jsx
import React, { useEffect, useState } from 'react';
import { 
  FiArrowLeft,
  FiCreditCard,      // ← Fixed: Replaced FiBuilding
  FiCheckCircle, 
  FiXCircle, 
  FiSearch 
} from "react-icons/fi";
import api from '../../../../services/api';

function BankReconciliation() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    if (search) {
      filtered = filtered.filter(
        (txn) =>
          txn.reference?.toLowerCase().includes(search.toLowerCase()) ||
          txn.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((txn) => {
        if (statusFilter === 'pending') {
          return txn.status !== 'matched' && txn.status !== 'mismatch';
        }
        return txn.status === statusFilter;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, search, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/bank-reconciliation/');

      const formattedData = response.data.map((item, index) => ({
        id: item.id || index + 1,
        date: item.date,
        reference: item.reference || '-',
        description: item.description || '-',
        type: item.type || '-',
        amount: item.amount || 0,
        status: item.status || 'pending',
      }));

      setTransactions(formattedData);
      setFilteredTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMatched = async (id) => {
    try {
      await api.post(`/finance/bank-transactions/${id}/mark_matched/`);
      fetchTransactions();
    } catch (error) {
      console.error('Error marking matched:', error);
      alert('Failed to mark as matched');
    }
  };

  const markMismatch = async (id) => {
    const remarks = prompt('Enter mismatch reason:');
    if (!remarks) return;

    try {
      await api.post(`/finance/bank-transactions/${id}/mark_mismatch/`, {
        remarks,
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error marking mismatch:', error);
      alert('Failed to mark as mismatch');
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
              <FiCreditCard className="w-8 h-8 text-white" />   {/* ← Fixed Here */}
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                Bank Reconciliation
              </h1>
              <p className="text-zinc-500">Match bank transactions with system records</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by reference or description..."
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
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="mismatch">Mismatch</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Date</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Reference</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Description</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Type</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">Amount</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-20">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-zinc-500 mt-4">Loading transactions...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-20 text-zinc-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-8 py-6 text-zinc-700">
                        {txn.date ? new Date(txn.date).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="px-8 py-6 font-medium text-zinc-900">{txn.reference}</td>
                      <td className="px-8 py-6 text-zinc-700">{txn.description}</td>

                      <td className="px-8 py-6">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium capitalize ${
                            txn.type === 'credit'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {Number(txn.amount).toLocaleString()}
                      </td>

                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium capitalize ${
                            txn.status === 'matched'
                              ? 'bg-emerald-100 text-emerald-700'
                              : txn.status === 'mismatch'
                              ? 'bg-red-100 text-red-700'
                              : txn.status === 'reconciled'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </td>

                      <td className="px-8 py-6 text-center">
                        {(txn.status === 'pending' || txn.status === 'reconciled') && (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => markMatched(txn.id)}
                              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl transition text-sm font-medium"
                            >
                              <FiCheckCircle size={18} />
                              Match
                            </button>

                            <button
                              onClick={() => markMismatch(txn.id)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-2xl transition text-sm font-medium"
                            >
                              <FiXCircle size={18} />
                              Mismatch
                            </button>
                          </div>
                        )}
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

export default BankReconciliation;