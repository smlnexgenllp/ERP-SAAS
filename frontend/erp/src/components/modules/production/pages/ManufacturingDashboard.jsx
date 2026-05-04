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
    { icon: BarChart3, label: 'Dashboard', path: '/production/dashboard', key: 'dashboard' },
    { icon: ClipboardList, label: 'MRP & Demand', path: '/production/pending-sales-orders', key: 'plans' },
    { icon: Package, label: 'Planned Orders', path: '/planned-orders', key: 'planned-orders' },
    { icon: PlayCircle, label: 'Manufacturing Orders', path: '/manufacture-orders', key: 'manufacturing-orders' },
    { icon: Truck, label: 'Material Transfer', path: '/department-transaction', key: 'Transactions' },
    { icon: History, label: 'Transfer History', path: '/transaction-history', key: 'History' },
    { icon: Settings, label: 'Machines', path: '/machines-list', key: 'List of machines' },
    { icon: Settings, label: 'Add New Machine', path: '/machines/create', key: 'New machine Add' },
    { icon: ClipboardList, label: 'Overall Stock', path: '/overall-stock', key: 'stocks' },
  ];

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen overflow-hidden">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-2xl flex items-center justify-center">
            <Factory className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Manufacturing</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all text-sm font-medium ${
              active === item.key
                ? 'bg-zinc-800 text-white border-l-4 border-zinc-400'
                : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800 mt-auto">
        <button
          onClick={() => navigate('/logout')}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-950/70 hover:bg-red-900/80 text-red-300 hover:text-red-200 transition text-sm font-medium"
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading Manufacturing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar active="dashboard" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
              <Factory className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Manufacturing Dashboard
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} • {user?.username || 'User'}
              </p>
            </div>
          </div>

          {/* MRP Button - Uncomment when ready */}
          {/* 
          <button
            onClick={handleRunMRP}
            className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3.5 rounded-2xl font-medium transition shadow-sm"
          >
            <Zap size={20} />
            Run MRP Now
          </button>
          */}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <AlertTriangle size={22} />
              <span>{error}</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">Manufacturing Orders</p>
                <PlayCircle className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-5xl font-bold text-zinc-900 tracking-tighter">
                {stats.manufacturingOrders}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">Planned Orders</p>
                <Package className="h-7 w-7 text-purple-600" />
              </div>
              <p className="text-5xl font-bold text-zinc-900 tracking-tighter">
                {stats.plannedOrders}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">Running Production</p>
                <Clock className="h-7 w-7 text-amber-600" />
              </div>
              <p className="text-5xl font-bold text-zinc-900 tracking-tighter">
                {stats.runningProduction}
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-medium text-zinc-500">Completed Orders</p>
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <p className="text-5xl font-bold text-zinc-900 tracking-tighter">
                {stats.completedProduction}
              </p>
            </div>
          </div>

          {/* MRP Quick Action Panel */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
                  Material Requirements Planning (MRP)
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  Run MRP to analyze open sales demand, check current stock levels, explode BOMs, 
                  and automatically generate planned orders for production.
                </p>
              </div>

              {/* Uncomment when you want to enable MRP button */}
              {/* 
              <button
                onClick={handleRunMRP}
                className="flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white px-12 py-4 rounded-3xl font-medium text-lg shadow-sm transition min-w-[260px]"
              >
                <Zap size={24} />
                Execute MRP Run
              </button>
              */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}