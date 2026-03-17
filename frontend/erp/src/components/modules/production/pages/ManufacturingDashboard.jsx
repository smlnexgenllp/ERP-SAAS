// src/pages/ManufacturingDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext'; // adjust path if needed
import {
  Factory,
  Play,
  CheckCircle,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import api from '../../../../services/api'; // your axios instance with token interceptor

// Sidebar Component (you can move this to components/common/Sidebar.jsx later)
const Sidebar = ({ active = 'dashboard' }) => {
  const navigate = useNavigate();

  const menu = [
    { icon: Factory, label: 'Dashboard', path: '/production/dashboard', key: 'dashboard' },
    { icon: ClipboardList, label: 'Production Plans', path: '/production/pending-sales-orders', key: 'plans' },
    { icon: Package, label: 'Planned Orders', path: '/production/planned-orders', key: 'planned-orders' },
    { icon: Settings, label: 'Manufacturing Orders', path: '/production/manufacturing-orders', key: 'manufacturing-orders' },
  ];

  return (
    <div className="w-72 bg-gray-900/90 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-cyan-400" />
          <h2 className="text-xl font-bold text-cyan-300">Manufacturing</h2>
        </div>
      </div>

      <nav className="flex-1 p-5 space-y-2">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              active === item.key
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-5 border-t border-gray-800">
        <button
          onClick={() => navigate('/logout')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/70 hover:bg-red-800 text-white transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default function ManufacturingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, poRes, moRes] = await Promise.all([
        api.get('/production/production-plans/'),
        api.get('/production/planned-orders/'),
        api.get('/production/manufacturing-orders/'),
      ]);

      setPlans(plansRes.data || []);
      setPlannedOrders(poRes.data || []);
      setManufacturingOrders(moRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDashboard();
    }
  }, [authLoading]);

  const handleRunMRP = async () => {
    if (!window.confirm('Run MRP globally? This will create planned orders based on current demand.')) return;

    try {
      const response = await api.post('/production/run-mrp/');
      alert(response.data.detail || 'MRP completed successfully');

      if (response.data.capacity_warnings?.length > 0) {
        alert('Capacity Warnings:\n' + response.data.capacity_warnings.join('\n'));
      }

      fetchDashboard();
    } catch (err) {
      const msg = err.response?.data?.detail || 'MRP run failed';
      alert(msg);
    }
  };

  const handleConvertToMO = async (id) => {
    if (!window.confirm('Convert this planned order to a Manufacturing Order?')) return;

    try {
      await api.post(`/production/planned-orders/${id}/convert-to-mo/`);
      alert('Successfully converted to Manufacturing Order');
      fetchDashboard();
    } catch (err) {
      alert('Conversion failed: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleStartMO = async (id) => {
    try {
      await api.post(`/production/manufacturing-orders/${id}/start/`);
      alert('Production started');
      fetchDashboard();
    } catch (err) {
      alert('Failed to start order');
    }
  };

  const handleCompleteMO = async (id) => {
    if (!window.confirm('Complete this order? Finished goods stock will be updated.')) return;

    try {
      await api.post(`/production/manufacturing-orders/${id}/complete/`);
      alert('Order completed – stock updated');
      fetchDashboard();
    } catch (err) {
      alert('Completion failed');
    }
  };

  const runningCount = manufacturingOrders.filter((m) => m.status === 'in_progress').length;
  const completedCount = manufacturingOrders.filter((m) => m.status === 'done').length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
          <p className="text-cyan-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex">
      {/* Sidebar */}
      <Sidebar active="dashboard" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/90 border-b border-cyan-900/50 px-8 py-5 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-4">
            <Factory className="h-10 w-10 text-cyan-400" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-cyan-300">Manufacturing Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                • {user?.username || 'User'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRunMRP}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 px-6 py-3 rounded-lg font-medium shadow-lg transition"
          >
            <Play size={18} />
            Run Global MRP
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-900/80 p-6 rounded-xl border border-cyan-900/50 shadow-lg hover:shadow-cyan-900/20 transition">
              <p className="text-sm text-cyan-400 uppercase tracking-wide">Production Plans</p>
              <p className="text-4xl font-bold text-cyan-200 mt-3">{plans.length}</p>
            </div>

            <div className="bg-gray-900/80 p-6 rounded-xl border border-purple-900/50 shadow-lg hover:shadow-purple-900/20 transition">
              <p className="text-sm text-purple-400 uppercase tracking-wide">Planned Orders</p>
              <p className="text-4xl font-bold text-purple-200 mt-3">{plannedOrders.length}</p>
            </div>

            <div className="bg-gray-900/80 p-6 rounded-xl border border-yellow-900/50 shadow-lg hover:shadow-yellow-900/20 transition">
              <p className="text-sm text-yellow-400 uppercase tracking-wide">Running</p>
              <p className="text-4xl font-bold text-yellow-200 mt-3">{runningCount}</p>
            </div>

            <div className="bg-gray-900/80 p-6 rounded-xl border border-green-900/50 shadow-lg hover:shadow-green-900/20 transition">
              <p className="text-sm text-green-400 uppercase tracking-wide">Completed</p>
              <p className="text-4xl font-bold text-green-200 mt-3">{completedCount}</p>
            </div>
          </div>

          {/* Production Plans Table */}
          <div className="bg-gray-900/80 rounded-xl p-6 mb-10 border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-cyan-300">Production Plans</h2>
              <button
                onClick={handleRunMRP}
                className="md:hidden flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg text-sm"
              >
                <Play size={16} /> Run MRP
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-300">
                    <th className="text-left py-4 px-5">ID</th>
                    <th className="text-left py-4 px-5">Sales Order</th>
                    <th className="text-left py-4 px-5">Status</th>
                    <th className="text-center py-4 px-5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-gray-500 italic">
                        No production plans available yet
                      </td>
                    </tr>
                  ) : (
                    plans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-5 font-medium">{plan.id}</td>
                        <td className="py-4 px-5">
                          {plan.sales_order?.order_number || 'Independent / Forecast'}
                        </td>
                        <td className="py-4 px-5 capitalize">{plan.status.replace('_', ' ')}</td>
                        <td className="py-4 px-5 text-center">
                          {plan.status !== 'mrp_done' && (
                            <button
                              onClick={() => handleRunMRP(plan.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 mx-auto transition"
                            >
                              <Play size={16} />
                              Run MRP
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manufacturing Orders Table */}
          <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800 shadow-lg">
            <h2 className="text-xl font-semibold text-cyan-300 mb-6">Manufacturing Orders</h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-300">
                    <th className="text-left py-4 px-5">ID</th>
                    <th className="text-left py-4 px-5">Product</th>
                    <th className="text-right py-4 px-5">Qty</th>
                    <th className="text-left py-4 px-5">Status</th>
                    <th className="text-center py-4 px-5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {manufacturingOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500 italic">
                        No manufacturing orders created yet
                      </td>
                    </tr>
                  ) : (
                    manufacturingOrders.map((mo) => (
                      <tr
                        key={mo.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-5 font-medium">{mo.id}</td>
                        <td className="py-4 px-5">{mo.product?.name || mo.product || '—'}</td>
                        <td className="py-4 px-5 text-right font-semibold">{mo.quantity}</td>
                        <td className="py-4 px-5 capitalize">{mo.status.replace('_', ' ')}</td>
                        <td className="py-4 px-5 text-center">
                          {mo.status === 'draft' && (
                            <button
                              onClick={() => handleStartMO(mo.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg transition"
                            >
                              Start
                            </button>
                          )}

                          {mo.status === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteMO(mo.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 mx-auto justify-center transition"
                            >
                              <CheckCircle size={16} />
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}