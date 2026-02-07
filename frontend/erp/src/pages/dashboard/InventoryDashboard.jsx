// src/pages/modules/inventory/InventoryDashboard.tsx
import React, { useState } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Box,
  ClipboardList,
} from "lucide-react"; // npm install lucide-react

// If you prefer react-icons/fi:
// import { FiHome, FiBox, FiShoppingCart, FiFileText, FiUsers, FiSettings } from "react-icons/fi";

const InventoryDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      path: "/inventory",
    },
    {
      label: "Create Item",
      icon: Package,
      path: "/inventory/create-item",
    },
    {
      label: "Items List",
      icon: ClipboardList,
      path: "/inventory/items", // ← placeholder – implement later
    },
    {
      label: "Create PO",
      icon: ShoppingCart,
      path: "/purchase/create-po",
    },
    {
      label: "Purchase Orders",
      icon: FileText,
      path: "/purchase/orders", // ← placeholder – list view later
    },
    {
      label: "Vendors",
      icon: Users,
      path: "/vendors",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
    },
    
  ];

  // Simple way to decide if we show full page content or child route content
  const isOverviewPage = location.pathname === "/inventory/dashboard";

  return (
    <div className="flex min-h-screen bg-gray-950 text-cyan-300">
      {/* ─── SIDEBAR ──────────────────────────────────────────────── */}
      <aside
        className={`bg-gray-900 border-r border-cyan-900/50 transition-all duration-300 h-screen overflow-y-auto
          ${isCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Header + Collapse Button */}
        <div className="p-4 flex items-center justify-between border-b border-cyan-800/40">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Box size={24} className="text-blue-400" />
              <h2 className="text-xl font-bold text-cyan-300">Inventory</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-cyan-400 hover:text-cyan-200 p-1 rounded hover:bg-gray-800"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? "bg-cyan-900/50 text-cyan-100 font-medium"
                    : "text-cyan-400 hover:bg-gray-800 hover:text-cyan-200"}`
                }
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ─── MAIN CONTENT AREA ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar (optional) */}
        <header className="bg-gray-900 border-b border-cyan-900/50 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {isOverviewPage ? "Inventory Overview" : "Inventory Module"}
          </h1>
          <div className="text-sm text-cyan-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {isOverviewPage ? (
            // ─── DASHBOARD OVERVIEW CONTENT ─────────────────────────
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-blue-300">Welcome to Inventory Dashboard</h2>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6">
                  <p className="text-cyan-500 text-sm">Total Items</p>
                  <p className="text-3xl font-bold text-cyan-200 mt-2">248</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6">
                  <p className="text-cyan-500 text-sm">Low Stock Items</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">17</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6">
                  <p className="text-cyan-500 text-sm">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">9</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6">
                  <p className="text-cyan-500 text-sm">Inventory Value</p>
                  <p className="text-3xl font-bold text-green-400 mt-2">₹ 8.42 Cr</p>
                </div>
              </div>

              {/* Placeholder for charts / tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 h-80">
                  <h3 className="text-lg font-semibold mb-4">Stock Status</h3>
                  <p className="text-cyan-500">[Pie chart placeholder]</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 h-80">
                  <h3 className="text-lg font-semibold mb-4">Reorder Suggestions</h3>
                  <p className="text-cyan-500">[Table placeholder]</p>
                </div>
              </div>

              <p className="text-cyan-600 text-center mt-12">
                → Start by creating items or purchase orders from the sidebar
              </p>
            </div>
          ) : (
            // Render child pages (Create Item, Create PO, etc.)
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default InventoryDashboard;