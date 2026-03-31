// src/pages/FullStockLedger.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { 
  FiPackage, FiArrowLeft, FiRefreshCw, FiDownload, 
  FiFilter, FiSearch 
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function FullStockLedger() {
  const navigate = useNavigate();

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAllMovements();
  }, []);

  const fetchAllMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/stock/ledger/', { 
        params: { limit: 500 }   // Increase limit or implement pagination on backend
      });
      setMovements(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch stock ledger:", err);
      setError("Unable to load stock movements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered and Searched Data
  const filteredMovements = useMemo(() => {
    return movements.filter(mov => {
      const matchesSearch = 
        (mov.item_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (mov.item_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || mov.transaction_type === typeFilter;

      let matchesDate = true;
      if (fromDate || toDate) {
        const movDate = new Date(mov.created_at);
        if (fromDate) matchesDate = matchesDate && movDate >= new Date(fromDate);
        if (toDate) matchesDate = matchesDate && movDate <= new Date(toDate);
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [movements, searchTerm, typeFilter, fromDate, toDate]);

  // Summary Calculations
  const summary = useMemo(() => {
    const totalIn = filteredMovements
      .filter(m => m.transaction_type === 'IN')
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    const totalOut = filteredMovements
      .filter(m => m.transaction_type === 'OUT')
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    return {
      totalIn: totalIn.toFixed(0),
      totalOut: totalOut.toFixed(0),
      netMovement: (totalIn - totalOut).toFixed(0),
      totalTransactions: filteredMovements.length,
    };
  }, [filteredMovements]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const currentMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTypeStyle = (type) => {
    switch (type) {
      case 'IN':  return { color: 'text-green-400', icon: '↑', label: 'IN' };
      case 'OUT': return { color: 'text-red-400',   icon: '↓', label: 'OUT' };
      case 'ADJ': return { color: 'text-yellow-400', icon: '↻', label: 'ADJ' };
      default:    return { color: 'text-gray-400',   icon: '?', label: type };
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Item Name', 'Item Code', 'Type', 'Quantity', 'Reference', 'UOM'];
    
    const rows = filteredMovements.map(mov => [
      format(new Date(mov.created_at), 'yyyy-MM-dd HH:mm'),
      mov.item_name || '',
      mov.item_code || '',
      mov.transaction_type,
      mov.quantity,
      mov.reference || '',
      mov.uom || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Stock_Ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleGoBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl">
          <FiRefreshCw className="animate-spin" size={28} />
          Loading full stock ledger...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-center">
        <p className="text-red-400 text-xl mb-6">{error}</p>
        <button
          onClick={fetchAllMovements}
          className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <FiArrowLeft size={22} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <FiPackage className="text-cyan-500" /> Full Stock Ledger
            </h1>
            <p className="text-cyan-500 mt-1">Complete history of all stock IN, OUT & ADJ movements</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchAllMovements}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-cyan-300 border border-gray-700"
            >
              <FiRefreshCw size={18} /> Refresh
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredMovements.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-white border border-emerald-600 disabled:opacity-50"
            >
              <FiDownload size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <SummaryCard title="Total IN" value={summary.totalIn} color="green" />
          <SummaryCard title="Total OUT" value={summary.totalOut} color="red" />
          <SummaryCard title="Net Movement" value={summary.netMovement} color="cyan" />
          <SummaryCard title="Transactions" value={summary.totalTransactions} color="purple" />
        </div>

        {/* Filters */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[240px]">
              <label className="text-xs text-gray-400 block mb-1">Search Item</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  placeholder="Item name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Types</option>
                <option value="IN">IN (Receipt)</option>
                <option value="OUT">OUT (Issue)</option>
                <option value="ADJ">ADJ (Adjustment)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setFromDate(''); setToDate(''); setCurrentPage(1); }}
              className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Movements Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stock Movement History</h2>
            <p className="text-sm text-gray-400">
              Showing {currentMovements.length} of {filteredMovements.length} movements
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="p-4 text-left">Date & Time</th>
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-center">Type</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4 text-left">Reference</th>
                  <th className="p-4 text-left">UOM</th>
                </tr>
              </thead>
              <tbody>
                {currentMovements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-500">
                      No movements found matching your filters.
                    </td>
                  </tr>
                ) : (
                  currentMovements.map((mov) => {
                    const style = getTypeStyle(mov.transaction_type);
                    return (
                      <tr 
                        key={mov.id} 
                        className="border-t border-gray-800 hover:bg-gray-800/60 transition-colors"
                      >
                        <td className="p-4 text-gray-400">
                          {format(new Date(mov.created_at), 'dd MMM yyyy • hh:mm a')}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{mov.item_name}</div>
                          <div className="text-xs text-gray-500">{mov.item_code}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 font-medium ${style.color}`}>
                            <span className="text-lg">{style.icon}</span>
                            {style.label}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {Number(mov.quantity).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-gray-300">{mov.reference || '—'}</td>
                        <td className="p-4 text-gray-400">{mov.uom || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-gray-800 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Summary Card
function SummaryCard({ title, value, color }) {
  const colorMap = {
    green: 'text-green-400 border-green-500/30',
    red: 'text-red-400 border-red-500/30',
    cyan: 'text-cyan-400 border-cyan-500/30',
    purple: 'text-purple-400 border-purple-500/30',
  };

  return (
    <div className={`bg-gray-900 p-6 rounded-xl border ${colorMap[color]} hover:border-gray-700 transition-all`}>
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}