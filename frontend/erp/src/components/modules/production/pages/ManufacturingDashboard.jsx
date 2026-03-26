// src/pages/ManufacturingDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import {
  Factory,
  BarChart3,
  ClipboardList,
  Package,
  Truck,
  History,
  Settings,
  Users,
  LogOut,
  Zap,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import api from '../../../../services/api';

const Sidebar = ({ active = 'dashboard' }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      path: '/production/dashboard',
      key: 'dashboard',
    },
    {
      icon: ClipboardList,
      label: 'MRP & Demand',
      path: '/production/pending-sales-orders',
      key: 'plans',
    },
    {
      icon: Package,
      label: 'Planned Orders',
      path: '/planned-orders',
      key: 'planned-orders',
    },
    {
      icon: PlayCircle,
      label: 'Manufacturing Orders',
      path: '/manufacture-orders',
      key: 'manufacturing-orders',
    },
    {
      icon: Truck,
      label: 'Material Transfer',
      path: '/department-transaction',
      key: 'Transactions',
    },
    {
      icon: History,
      label: 'Transfer History',
      path: '/transaction-history',
      key: 'History',
    },
    {
      icon: Settings,
      label: 'Machines',
      path: '/machines-list',
      key: 'List of machines',
    },
    {
      icon: Settings,
      label: 'Add New Machine',
      path: '/machines/create',
      key: 'New machine Add',
    },
    {
      icon: ClipboardList,
      label: 'Overall Stock',
      path: '/overall-stock',
      key: 'stocks',
    },
  ];

  return (
    <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-screen overflow-hidden">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Factory className="h-8 w-8 text-cyan-500" />
          <h2 className="text-xl font-semibold text-white tracking-tight">Manufacturing</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              active === item.key
                ? 'bg-cyan-900/40 text-cyan-300 border-l-4 border-cyan-500'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800 mt-auto">
        <button
          onClick={() => navigate('/logout')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 transition text-sm font-medium"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default function ManufacturingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    manufacturingOrders: 0,
    plannedOrders: 0,
    runningProduction: 0,
    completedProduction: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [poRes, moRes] = await Promise.all([
        api.get('/production/planned-orders/'),
        api.get('/production/manufacturing-orders/'),
      ]);

      const moData = moRes.data || [];

      setStats({
        manufacturingOrders: moData.length,
        plannedOrders: poRes.data?.length || 0,
        runningProduction: moData.filter((mo) => mo.status === 'in_progress').length,
        completedProduction: moData.filter((mo) => mo.status === 'done').length,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading]);

  const handleRunMRP = async () => {
    if (!window.confirm('Execute global MRP run?\n\nThis will analyze open demand, explode BOMs, and generate planned orders.')) {
      return;
    }

    try {
      const response = await api.post('/production/run-mrp/');
      alert(response.data.detail || 'MRP run completed successfully');
      fetchDashboardData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'MRP execution failed.';
      alert(msg);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="animate-spin h-14 w-14 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <p className="text-cyan-400 font-medium text-lg">Loading Manufacturing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar active="dashboard" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 md:px-10 py-5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <Factory className="h-10 w-10 text-cyan-500 flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-cyan-300 tracking-tight">
                Manufacturing Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">
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
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-6 py-3 rounded-lg font-medium shadow-lg transition-all transform hover:scale-105"
          >
            <Zap size={18} />
            Run MRP Now
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
          {error && (
            <div className="bg-red-950/70 border border-red-800 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Manufacturing Orders */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:border-cyan-700/50 transition-all duration-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  Manufacturing Orders
                </p>
                <PlayCircle className="h-6 w-6 text-cyan-500 opacity-80" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {stats.manufacturingOrders}
              </p>
            </div>

            {/* Planned Orders */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:border-purple-700/50 transition-all duration-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  Planned Orders
                </p>
                <Package className="h-6 w-6 text-purple-500 opacity-80" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {stats.plannedOrders}
              </p>
            </div>

            {/* Running Production */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:border-amber-700/50 transition-all duration-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  Running Production
                </p>
                <Clock className="h-6 w-6 text-amber-500 opacity-80" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {stats.runningProduction}
              </p>
            </div>

            {/* Completed Production */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:border-emerald-700/50 transition-all duration-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  Completed Orders
                </p>
                <CheckCircle2 className="h-6 w-6 text-emerald-500 opacity-80" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {stats.completedProduction}
              </p>
            </div>
          </div>

          {/* MRP Quick Action Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-cyan-300 mb-2">
                  Material Requirements Planning
                </h2>
                <p className="text-slate-400 max-w-2xl">
                  Run MRP to analyze sales demand, check stock levels, explode BOMs, and generate planned orders automatically.
                </p>
              </div>

              <button
                onClick={handleRunMRP}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-10 py-4 rounded-xl font-medium text-lg shadow-xl transition-all transform hover:scale-105 min-w-[240px]"
              >
                <Zap size={22} />
                Execute MRP Run
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}