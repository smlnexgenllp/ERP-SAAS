// src/pages/modules/inventory/InventoryDashboard.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  ClipboardList,
  Boxes,
  LogOut,
  AlertTriangle,
  ArrowRight,
  Activity,
  PackageCheck,
} from "lucide-react";
import api from "../../services/api";

const Sidebar = ({ active = "overview" }) => {
  const navigate = useNavigate();

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Overview",
      path: "/inventory/dashboard",
      key: "overview",
    },
    {
      icon: Package,
      label: "Create Item",
      path: "/items/create",
      key: "create-item",
    },
    {
      icon: Boxes,
      label: "Stock",
      path: "/inventory/items",
      key: "stock",
    },
    {
      icon: ShoppingCart,
      label: "Create PO",
      path: "/purchase-orders",
      key: "create-po",
    },
     {
      icon: ShoppingCart,
      label: "Pending-PO",
      path: "/Pending-PO",
      key: "pending-po",
    },
    {
      icon: FileText,
      label: "Purchase Orders",
      path: "/purchase/orders",
      key: "po-list",
    },
    {
      icon: Box,
      label: "Gate Entry",
      path: "/gate-entry",
      key: "gate-entry",
    },
    {
      icon: Box,
      label: "QC",
      path: "/QC",
      key: "QC",
    },
    {
      icon: Box,
      label: "QC List",
      path: "/QC-list",
      key: "QC-list",
    },
    {
      icon: ClipboardList,
      label: "GRN",
      path: "/grns/create",
      key: "grn",
    },
    {
      icon: ClipboardList,
      label: "GRN Approval",
      path: "/grn/pending-approval",
      key: "grn-approval",
    },
    {
      icon: FileText,
      label: "Purchase Return",
      path: "/purchase-return",
      key: "return",
    },
  ];

  return (
    <div className="w-72 bg-white border-r border-zinc-200 flex flex-col h-screen fixed left-0 top-0 overflow-hidden z-50">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-sm">
            <Box className="h-6 w-6 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Inventory
            </h2>

            <p className="text-xs text-zinc-500 mt-1">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`group w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 text-sm font-medium ${
              active === item.key
                ? "bg-zinc-900 text-white shadow-lg"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </div>

            <ArrowRight
              className={`h-4 w-4 transition-all ${
                active === item.key
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-200 mt-auto">
        <button
          onClick={() => navigate("/logout")}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition text-sm font-semibold"
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
  const [command, setCommand] = useState("");

  const inputRef = useRef(null);

  const isOverviewPage =
    location.pathname === "/inventory/dashboard";

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isOverviewPage) return;

      try {
        setLoading(true);

        const response = await api.get(
          "/inventory/dashboard-stats/"
        );

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
    if (e.key === "Enter" && command.trim()) {
      const cmd = command.trim().toLowerCase();

      switch (cmd) {
        case "help":
          alert(
            "Available commands:\n• stock → Go to Stock\n• po → Create Purchase Order\n• vendors → Vendor List\n• grn → Create GRN\n• dashboard → Overview\n• logout → Sign Out"
          );
          break;

        case "stock":
          navigate("/inventory/items");
          break;

        case "po":
          navigate("/purchase-orders");
          break;

        case "vendors":
          navigate("/finance/vendors");
          break;

        case "grn":
          navigate("/grns/create");
          break;

        case "dashboard":
          navigate("/inventory/dashboard");
          break;

        case "logout":
          navigate("/logout");
          break;

        default:
          alert(
            `Unknown command: ${cmd}\nType "help" for available commands.`
          );
      }

      setCommand("");
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
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>

          <p className="text-zinc-600 mt-6 text-lg font-medium">
            Loading Inventory Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar active={isOverviewPage ? "overview" : ""} />

      {/* Main */}
      <div className="flex-1 flex flex-col ml-72 overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center shadow-sm z-40">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-sm">
              <Box className="h-8 w-8 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Inventory Dashboard
              </h1>

              <p className="text-zinc-500 text-sm mt-1">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" • "}
                {user?.username || user?.name || "User"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/inventory/items")}
              className="px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 font-medium transition"
            >
              View Stock
            </button>

            <button
              onClick={() => navigate("/purchase-orders")}
              className="px-5 py-3 bg-zinc-900 hover:bg-black rounded-2xl text-white font-medium transition"
            >
              Create PO
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <AlertTriangle size={22} />
              <span>{error}</span>
            </div>
          )}

          {isOverviewPage ? (
            <div className="space-y-10">
              
              {/* Welcome */}
              {/* <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">
                      Welcome back,
                      {" "}
                      {user?.name?.split(" ")[0] || "User"} 👋
                    </h2>

                    <p className="text-zinc-500 mt-3 text-lg">
                      Here's what's happening in your inventory today.
                    </p>
                  </div>

                  <div className="hidden lg:flex w-20 h-20 bg-zinc-100 rounded-3xl items-center justify-center">
                    <Activity className="w-10 h-10 text-zinc-700" />
                  </div>
                </div>
              </div> */}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card */}
                <div className="group bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Total Items
                      </p>

                      <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-3">
                        {loading
                          ? "..."
                          : formatNumber(stats?.totalItems)}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Boxes className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Inventory products
                    </span>

                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition" />
                  </div>
                </div>

                {/* Card */}
                <div className="group bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Low Stock
                      </p>

                      <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-3">
                        {loading
                          ? "..."
                          : formatNumber(stats?.lowStock)}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <AlertTriangle className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Needs refill
                    </span>

                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition" />
                  </div>
                </div>

                {/* Card */}
                <div className="group bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Out of Stock
                      </p>

                      <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-3">
                        {loading
                          ? "..."
                          : formatNumber(stats?.outOfStock)}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Critical items
                    </span>

                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition" />
                  </div>
                </div>

                {/* Card */}
                <div className="group bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Inventory Value
                      </p>

                      <p className="text-4xl font-bold text-zinc-900 tracking-tight mt-3">
                        {loading
                          ? "..."
                          : formatCurrency(
                              stats?.inventoryValue
                            )}
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <PackageCheck className="h-7 w-7 text-emerald-600" />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      Total stock value
                    </span>

                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

        {/* Command Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/95 backdrop-blur border-t border-zinc-200 px-6 py-4 flex items-center z-50 shadow-xl">
          <span className="text-zinc-400 font-bold mr-4 text-xl">
            &gt;
          </span>

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