// src/pages/ManufacturingDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import {
  Factory,
  PlayCircle,
  CheckCircle2,
  Package,
  ClipboardList,
  Settings,
  LogOut,
  AlertTriangle,
  Zap,
  BarChart3,
  Clock,
  Layers,
  ArrowRightCircle,
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
      icon: ClipboardList,
      label: 'Over all Stock',
      path: '/overall-stock',
      key: 'stocks',
    },
    {
      icon: ClipboardList,
      label: 'Material Transfer',
      path: '/department-transaction',
      key: 'Transactions',
    },
    {
      icon: ClipboardList,
      label: 'Transfer History',
      path: '/transaction-history',
      key: 'History',
    },
    {
      icon: Package,
      label: 'Planned Orders',
      path: '/production/planned-orders',
      key: 'planned-orders',
    },
    {
      icon: Settings,
      label: 'Manufacturing Orders',
      path: '/production/manufacturing-orders',
      key: 'manufacturing-orders',
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
    productionPlans: 0,
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
      const [plansRes, poRes, moRes] = await Promise.all([
        api.get('/production/production-plans/'),
        api.get('/production/planned-orders/'),
        api.get('/production/manufacturing-orders/'),
      ]);

      setStats({
        productionPlans: plansRes.data?.length || 0,
        plannedOrders: poRes.data?.length || 0,
        runningProduction:
          moRes.data?.filter((mo) => mo.status === 'in_progress')?.length || 0,
        completedProduction:
          moRes.data?.filter((mo) => mo.status === 'done')?.length || 0,
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
    if (
      !window.confirm(
        'Execute global MRP run?\n\nThis will analyze open demand, explode BOMs, calculate net requirements, and generate planned orders & purchase requisitions.'
      )
    ) {
      return;
    }

    try {
      const response = await api.post('/production/run-mrp/', {
        scheduling_mode: 'basic', // can be made dynamic later
      });

      alert(response.data.detail || 'MRP run completed successfully');

      if (response.data.warnings?.length > 0) {
        alert(
          'Planning Warnings:\n' + response.data.warnings.join('\n')
        );
      }

      fetchDashboardData();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'MRP execution failed. Please check server logs.';
      alert(msg);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="animate-spin h-14 w-14 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <p className="text-cyan-400 font-medium text-lg">
            Loading Manufacturing Dashboard...
          </p>
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
                Manufacturing Cockpit
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
            <div className="bg-red-950/70 border border-red-800 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Production Plans */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:border-cyan-700/50 transition-all duration-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">
                  Production Plans
                </p>
                <ClipboardList className="h-6 w-6 text-cyan-500 opacity-80" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {stats.productionPlans}
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

            {/* In Progress */}
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

            {/* Completed */}
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-cyan-300 mb-2">
                  Material Requirements Planning
                </h2>
                <p className="text-slate-400 max-w-2xl">
                  Run MRP to generate planned production and procurement proposals based on current sales demand, stock levels, and BOM structures.
                </p>
              </div>

              <button
                onClick={handleRunMRP}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-8 py-4 rounded-xl font-medium text-lg shadow-xl transition-all transform hover:scale-105 min-w-[220px]"
              >
                <Zap size={20} />
                Execute MRP Run
              </button>
            </div>
          </div>

          {/* You can add more sections here later:
              - Recent Manufacturing Orders
              - Capacity Overview
              - Alerts & Exceptions
              - Production Progress Charts
          */}
        </main>
      </div>
    </div>
  );
}