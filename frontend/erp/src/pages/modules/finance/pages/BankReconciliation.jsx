import React, { useEffect, useState } from 'react';
import {
  FaUniversity,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
} from 'react-icons/fa';
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
    }
  };

  const markMismatch = async (id) => {
    const remarks = prompt('Enter mismatch reason');

    if (!remarks) return;

    try {
      await api.post(`/finance/bank-transactions/${id}/mark_mismatch/`, {
        remarks,
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error marking mismatch:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-cyan-300 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaUniversity className="text-3xl text-cyan-400" />
        <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
      </div>

      <div className="bg-[#0f172a] border border-cyan-500/20 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute top-4 left-3 text-cyan-500" />
          <input
            type="text"
            placeholder="Search by reference or description"
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
          <option value="pending">Pending</option>
          <option value="matched">Matched</option>
          <option value="mismatch">Mismatch</option>
        </select>
      </div>

      <div className="bg-[#0f172a] border border-cyan-500/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cyan-900/20 text-cyan-200">
              <tr>
                <th className="px-4 py-4 text-left">Date</th>
                <th className="px-4 py-4 text-left">Reference</th>
                <th className="px-4 py-4 text-left">Description</th>
                <th className="px-4 py-4 text-left">Type</th>
                <th className="px-4 py-4 text-left">Amount</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="border-t border-cyan-500/10 hover:bg-cyan-900/10"
                  >
                    <td className="px-4 py-4">
                      {txn.date
                        ? new Date(txn.date).toLocaleDateString('en-GB')
                        : '-'}
                    </td>

                    <td className="px-4 py-4">{txn.reference}</td>

                    <td className="px-4 py-4">{txn.description}</td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          txn.type === 'credit'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-cyan-300">
                      ₹ {Number(txn.amount).toLocaleString()}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          txn.status === 'matched'
                            ? 'bg-green-500/20 text-green-400'
                            : txn.status === 'mismatch'
                            ? 'bg-red-500/20 text-red-400'
                            : txn.status === 'reconciled'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {(txn.status === 'pending' ||
                        txn.status === 'reconciled') && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => markMatched(txn.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
                          >
                            <FaCheckCircle />
                            Match
                          </button>

                          <button
                            onClick={() => markMismatch(txn.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
                          >
                            <FaTimesCircle />
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
  );
}

export default BankReconciliation;