// src/pages/modules/inventory/InventoryDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box, LayoutDashboard, Package, ShoppingCart, FileText,
  ClipboardList, Boxes, LogOut, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const Sidebar = ({ active = 'overview' }) => {
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/inventory/dashboard', key: 'overview' },
    { icon: Package, label: 'Create Item', path: '/items/create', key: 'create-item' },
    { icon: Boxes, label: 'Stock', path: '/inventory/items', key: 'stock' },
    { icon: ShoppingCart, label: 'Create PO', path: '/purchase-orders', key: 'create-po' },
    { icon: FileText, label: 'Purchase Orders', path: '/purchase/orders', key: 'po-list' },
    { icon: Box, label: 'Gate Entry', path: '/gate-entry', key: 'gate-entry' },
    { icon: ClipboardList, label: 'GRN', path: '/grns/create', key: 'grn' },
    { icon: ClipboardList, label: 'GRN Approval', path: '/grn/pending-approval', key: 'grn-approval' },
    { icon: FileText, label: 'Purchase Return', path: '/purchase-return', key: 'return' },
  ];

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 overflow-hidden z-50">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-2xl flex items-center justify-center">
            <Box className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Inventory</h2>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
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

export default function InventoryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Command Bar State
  const [command, setCommand] = useState('');
  const inputRef = useRef(null);

  const isOverviewPage = location.pathname === "/inventory/dashboard";

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isOverviewPage) return;
      try {
        setLoading(true);
        const response = await api.get("/inventory/dashboard-stats/");
        setStats(response.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isOverviewPage]);

  // Command Handler
  const handleCommand = (e) => {
    if (e.key === 'Enter' && command.trim()) {
      const cmd = command.trim().toLowerCase();
      
      switch (cmd) {
        case 'help':
          alert("Available commands:\n• stock → Go to Stock\n• po → Create Purchase Order\n• vendors → Vendor List\n• grn → Create GRN\n• dashboard → Overview\n• logout → Sign Out");
          break;
        case 'stock':
          navigate('/inventory/items');
          break;
        case 'po':
          navigate('/purchase-orders');
          break;
        case 'vendors':
          navigate('/finance/vendors');        // Adjust path if needed
          break;
        case 'grn':
          navigate('/grns/create');
          break;
        case 'dashboard':
          navigate('/inventory/dashboard');
          break;
        case 'logout':
          navigate('/logout');
          break;
        default:
          alert(`Unknown command: ${cmd}\nType "help" for available commands.`);
      }
      
      setCommand(''); // Clear input
    }
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    return Number(value).toLocaleString("en-IN");
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "₹ —";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading Inventory Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar active={isOverviewPage ? "overview" : ""} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-72 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center shadow-sm z-40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
              <Box className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Inventory Dashboard
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                {' • '} {user?.username || user?.name || 'User'}
              </p>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <AlertTriangle size={22} />
              <span>{error}</span>
            </div>
          )}

          {isOverviewPage ? (
            <div className="space-y-10">
              <h2 className="text-3xl font-semibold text-zinc-900">
                Welcome back, {user?.name?.split(" ")[0] || "User"}!
              </h2>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-zinc-500">Total Items</p>
                    <Boxes className="h-7 w-7 text-blue-600" />
                  </div>
                  <p className="text-4xl font-bold text-zinc-900 tracking-tighter">
                    {loading ? "..." : formatNumber(stats?.totalItems)}
                  </p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-zinc-500">Low Stock</p>
                    <AlertTriangle className="h-7 w-7 text-amber-600" />
                  </div>
                  <p className="text-4xl font-bold text-zinc-900 tracking-tighter">
                    {loading ? "..." : formatNumber(stats?.lowStock)}
                  </p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-zinc-500">Out of Stock</p>
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  </div>
                  <p className="text-4xl font-bold text-zinc-900 tracking-tighter">
                    {loading ? "..." : formatNumber(stats?.outOfStock)}
                  </p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-medium text-zinc-500">Inventory Value</p>
                    <Box className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="text-4xl font-bold text-zinc-900 tracking-tighter">
                    {loading ? "..." : formatCurrency(stats?.inventoryValue)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Bottom Command Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white border-t border-zinc-200 px-6 py-4 flex items-center z-50 shadow-lg">
          <span className="text-zinc-400 font-bold mr-4 text-xl">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleCommand}
            placeholder="Type command (help, stock, po, grn, vendors, dashboard, logout...)"
            className="flex-1 bg-transparent text-zinc-700 outline-none font-mono text-base placeholder-zinc-400"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}