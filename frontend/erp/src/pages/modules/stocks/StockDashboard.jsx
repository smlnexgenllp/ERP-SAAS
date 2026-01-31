// src/pages/StockDashboard.jsx  (or wherever you place it)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api'; // your axios / api instance
import { 
  FiPackage, FiAlertTriangle, FiDollarSign, FiClock, 
  FiArrowUpRight, FiArrowDownRight, FiRefreshCw 
} from 'react-icons/fi';
import { format } from 'date-fns';

export default function StockDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_items: 0,
    low_stock_items: 0,
    total_stock_value: 0,
    recent_received: 0,
    recent_issued: 0,
  });

  const [recentMovements, setRecentMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStockDashboardData();
  }, []);

  const fetchStockDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all items with stock info
      const itemsRes = await api.get('/stock/items/');
      const items = itemsRes.data.results || itemsRes.data; // handle paginated or direct array

      // Calculate stats
      const lowStockCount = items.filter(item => item.available_stock <= 10).length;
      const stockValue = items.reduce(
        (sum, item) => sum + (Number(item.current_stock) * Number(item.standard_price || 0)),
        0
      );

      // Fetch recent movements (last 10-20)
      const ledgerRes = await api.get('/stock/ledger/', {
        params: { limit: 15 }
      });
      const movements = ledgerRes.data.results || ledgerRes.data;

      // Quick 30-day summary
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentReceived = movements
        .filter(m => m.transaction_type === 'IN' && new Date(m.created_at) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + Number(m.quantity), 0);

      const recentIssued = movements
        .filter(m => m.transaction_type === 'OUT' && new Date(m.created_at) >= thirtyDaysAgo)
        .reduce((sum, m) => sum + Number(m.quantity), 0);

      setStats({
        total_items: items.length,
        low_stock_items: lowStockCount,
        total_stock_value: stockValue.toFixed(2),
        recent_received: recentReceived.toFixed(0),
        recent_issued: recentIssued.toFixed(0),
      });

      setRecentMovements(movements);
    } catch (err) {
      console.error("Stock dashboard failed:", err);
      setError("Unable to load stock dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'IN':  return { color: 'text-green-400', icon: <FiArrowUpRight /> };
      case 'OUT': return { color: 'text-red-400',   icon: <FiArrowDownRight /> };
      case 'ADJ': return { color: 'text-yellow-400', icon: <FiRefreshCw /> };
      default:    return { color: 'text-gray-400',   icon: null };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl">
          <FiRefreshCw className="animate-spin" size={28} />
          Loading stock dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 p-8 text-center">
        <p className="text-red-400 text-xl mb-6">{error}</p>
        <button
          onClick={fetchStockDashboardData}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <FiPackage className="text-cyan-500" /> Stock Dashboard
          </h1>
          <button
            onClick={fetchStockDashboardData}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-cyan-300 border border-gray-700"
          >
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-12">
          <StatCard 
            icon={<FiPackage className="text-blue-400" />}
            title="Total Items"
            value={stats.total_items}
          />
          <StatCard 
            icon={<FiAlertTriangle className="text-orange-400" />}
            title="Low Stock"
            value={stats.low_stock_items}
            alert={stats.low_stock_items > 0}
          />
          <StatCard 
            icon={<FiDollarSign className="text-emerald-400" />}
            title="Stock Value"
            value={`₹ ${Number(stats.total_stock_value).toLocaleString('en-IN')}`}
          />
          <StatCard 
            icon={<FiArrowUpRight className="text-green-400" />}
            title="Received (30d)"
            value={stats.recent_received}
          />
          <StatCard 
            icon={<FiArrowDownRight className="text-red-400" />}
            title="Issued (30d)"
            value={stats.recent_issued}
          />
        </div>

        {/* Recent Movements Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-12">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Recent Stock Movements</h2>
          </div>

          {recentMovements.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th className="p-4 text-left">Item</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-right">Qty</th>
                    <th className="p-4 text-left">Reference</th>
                    <th className="p-4 text-right">Date / Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMovements.map(mov => {
                    const style = getTypeStyle(mov.transaction_type);
                    return (
                      <tr 
                        key={mov.id} 
                        className="border-t border-gray-800 hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium">{mov.item_name}</div>
                          <div className="text-xs text-gray-500">{mov.item_code} • {mov.uom}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`flex items-center justify-center gap-1.5 ${style.color}`}>
                            {style.icon}
                            {mov.transaction_type}
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">
                          {Number(mov.quantity).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-gray-300">{mov.reference || '—'}</td>
                        <td className="p-4 text-right text-gray-400">
                          {format(new Date(mov.created_at), 'dd MMM yyyy • hh:mm a')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            title="New GRN"
            desc="Receive materials from approved QC"
            onClick={() => navigate('/grn/create')}
            color="cyan"
          />
          <ActionCard 
            title="Stock Items"
            desc="View all items & current levels"
            onClick={() => navigate('/stock/items')}
            color="blue"
          />
          <ActionCard 
            title="Low Stock"
            desc="Items needing reorder"
            onClick={() => navigate('/stock/items?low_stock=true')}
            color="orange"
          />
          <ActionCard 
            title="Full Ledger"
            desc="Complete stock movement history"
            onClick={() => navigate('/stock/ledger')}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({ icon, title, value, alert = false }) {
  return (
    <div className={`bg-gray-900 p-5 rounded-xl border ${alert ? 'border-orange-600/40' : 'border-gray-800'} hover:border-gray-700 transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-3xl opacity-90">{icon}</div>
        {alert && <FiAlertTriangle className="text-orange-400" size={20} />}
      </div>
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc, onClick, color }) {
  const bgColors = {
    cyan:   'bg-cyan-700/80 hover:bg-cyan-600',
    blue:   'bg-blue-700/80 hover:bg-blue-600',
    orange: 'bg-orange-700/80 hover:bg-orange-600',
    purple: 'bg-purple-700/80 hover:bg-purple-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${bgColors[color]} p-6 rounded-xl text-left transition-all hover:shadow-lg hover:scale-[1.02] border border-gray-700`}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-300">{desc}</p>
    </button>
  );
}