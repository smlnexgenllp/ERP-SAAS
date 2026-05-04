// src/pages/FullStockLedger.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { 
  Package, ArrowLeft, RefreshCw, Download, 
  Filter, Search 
} from 'lucide-react';
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
        params: { limit: 500 }
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
      case 'IN':  return { 
        bg: 'bg-emerald-100 text-emerald-700', 
        icon: '↑', 
        label: 'IN' 
      };
      case 'OUT': return { 
        bg: 'bg-red-100 text-red-700', 
        icon: '↓', 
        label: 'OUT' 
      };
      case 'ADJ': return { 
        bg: 'bg-amber-100 text-amber-700', 
        icon: '↻', 
        label: 'ADJ' 
      };
      default:    return { 
        bg: 'bg-zinc-100 text-zinc-600', 
        icon: '?', 
        label: type 
      };
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading stock ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Error</h2>
          <p className="text-zinc-600 mb-8">{error}</p>
          <button
            onClick={fetchAllMovements}
            className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Full Stock Ledger
                </h1>
                <p className="text-zinc-500">Complete history of all stock movements</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchAllMovements}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
            >
              <RefreshCw size={20} />
              <span className="font-medium">Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredMovements.length === 0}
              className="flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-2xl transition disabled:cursor-not-allowed"
            >
              <Download size={20} />
              <span className="font-medium">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <SummaryCard title="Total IN" value={summary.totalIn} color="emerald" />
          <SummaryCard title="Total OUT" value={summary.totalOut} color="red" />
          <SummaryCard title="Net Movement" value={summary.netMovement} color="zinc" />
          <SummaryCard title="Total Transactions" value={summary.totalTransactions} color="amber" />
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-8 shadow-sm">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-sm font-medium text-zinc-600 mb-2">Search Item</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by item name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-zinc-900 focus:outline-none focus:border-zinc-400"
              >
                <option value="ALL">All Types</option>
                <option value="IN">IN (Receipt)</option>
                <option value="OUT">OUT (Issue)</option>
                <option value="ADJ">ADJ (Adjustment)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
              />
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setFromDate('');
                setToDate('');
                setCurrentPage(1);
              }}
              className="px-6 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Stock Ledger Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
            <h2 className="text-xl font-semibold text-zinc-900">Stock Movement History</h2>
            <p className="text-sm text-zinc-500">
              Showing {currentMovements.length} of {filteredMovements.length} movements
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Date & Time</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Item</th>
                  <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Type</th>
                  <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Quantity</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Reference</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">UOM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentMovements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-12 h-12 text-zinc-300 mb-4" />
                        <p className="text-zinc-500 text-lg">No movements found</p>
                        <p className="text-zinc-400 mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentMovements.map((mov) => {
                    const style = getTypeStyle(mov.transaction_type);
                    return (
                      <tr key={mov.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 text-zinc-600">
                          {format(new Date(mov.created_at), 'dd MMM yyyy • hh:mm a')}
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-medium text-zinc-900">{mov.item_name}</div>
                          <div className="text-sm text-zinc-500">{mov.item_code}</div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-medium ${style.bg}`}>
                            <span className="text-base">{style.icon}</span>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                          {Number(mov.quantity).toLocaleString('en-IN')}
                        </td>
                        <td className="px-8 py-6 text-zinc-600">{mov.reference || '—'}</td>
                        <td className="px-8 py-6 text-zinc-600">{mov.uom || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-zinc-100 flex justify-between items-center bg-zinc-50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 rounded-2xl disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="font-medium text-zinc-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50 rounded-2xl disabled:cursor-not-allowed transition"
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

// Reusable Summary Card Component
function SummaryCard({ title, value, color }) {
  const colorMap = {
    emerald: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    red: 'text-red-600 border-red-200 bg-red-50',
    zinc: 'text-zinc-700 border-zinc-200 bg-zinc-50',
    amber: 'text-amber-600 border-amber-200 bg-amber-50',
  };

  return (
    <div className={`bg-white border rounded-3xl p-8 shadow-sm ${colorMap[color]}`}>
      <div className="text-sm text-zinc-500 mb-3">{title}</div>
      <div className="text-4xl font-bold tracking-tight">{value}</div>
    </div>
  );
}