// src/pages/modules/inventory/InventoryDashboard.tsx
import React, { useState } from "react";
import { NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
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
  LogOut,
  UserCircle,
  Boxes,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext"; // Adjust path if your AuthContext is in a different folder

const InventoryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { label: "Overview",        icon: LayoutDashboard,    path: "/inventory/dashboard" },
    { label: "Create Item",     icon: Package,            path: "/inventory/items/create" },
    { label: "Items List",      icon: ClipboardList,      path: "/inventory/items" },
    { label: "Stock",           icon: Boxes,           path: "/stockdash" },
    { label: "Create PO",       icon: ShoppingCart,       path: "/inventory/purchase-orders/create" },
    { label: "Purchase Orders", icon: FileText,           path: "/inventory/purchase-orders" },
    { label: "Gate Entry",      icon: Box,                path: "/inventory/gate-entry" },
    { label: "GRN",             icon: ClipboardList,      path: "/inventory/grns/create" },
    { label: "Settings",        icon: Settings,           path: "/inventory/settings" },
  ];

  const isOverviewPage = location.pathname === "/inventory/dashboard";

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    console.log("Logout initiated...");

    try {
      console.log("Calling backend logout...");
      await logout();  // This should call the API and clear frontend state
      console.log("Logout successful – redirecting to login");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please check your connection and try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Safety net: if somehow user is null but page is rendered
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300">
        <div className="text-xl">Session expired. Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-cyan-300">
      {/* LEFT SIDEBAR */}
      <aside
        className={`bg-gray-900 border-r border-cyan-900/50 transition-all duration-300 h-screen overflow-y-auto
          ${isCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Logo / Title + Collapse toggle */}
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
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
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

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-cyan-900/50 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {isOverviewPage ? "Inventory Overview" : "Inventory Module"}
          </h1>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <UserCircle size={28} className="text-cyan-400" />
              <div className="text-right">
                <div className="font-medium text-cyan-100">
                  {user?.name || user?.username || "User"}
                </div>
                <div className="text-xs text-cyan-500">
                  {user?.role || user?.org_role || "—"}
                </div>
              </div>
            </div>

           <button
  onClick={handleLogout}
  disabled={isLoggingOut}
  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
    ${isLoggingOut
      ? "bg-gray-700 cursor-not-allowed opacity-70"
      : "bg-red-600 hover:bg-red-700 text-white"
    }`}
>
  <LogOut size={18} />
  {isLoggingOut ? "Logging out..." : "Logout"}
</button>

          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          {isOverviewPage ? (
            <div className="space-y-10">
              <h2 className="text-3xl font-bold text-blue-300">
                Welcome back, {user?.name?.split(" ")[0] || "User"}!
              </h2>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 shadow-sm">
                  <p className="text-cyan-500 text-sm font-medium">Total Items</p>
                  <p className="text-4xl font-bold text-cyan-200 mt-2">248</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 shadow-sm">
                  <p className="text-cyan-500 text-sm font-medium">Low Stock</p>
                  <p className="text-4xl font-bold text-yellow-400 mt-2">17</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 shadow-sm">
                  <p className="text-cyan-500 text-sm font-medium">Out of Stock</p>
                  <p className="text-4xl font-bold text-red-400 mt-2">9</p>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 shadow-sm">
                  <p className="text-cyan-500 text-sm font-medium">Inventory Value</p>
                  <p className="text-4xl font-bold text-green-400 mt-2">₹ 8.42 Cr</p>
                </div>
              </div>

              {/* Charts / Actions placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 h-96">
                  <h3 className="text-xl font-semibold mb-4 text-cyan-200">Stock Status</h3>
                  <div className="h-80 flex items-center justify-center text-cyan-600">
                    [Chart / Graph placeholder]
                  </div>
                </div>
                <div className="bg-gray-900/70 border border-cyan-800/50 rounded-xl p-6 h-96">
                  <h3 className="text-xl font-semibold mb-4 text-cyan-200">Actions Needed</h3>
                  <div className="h-80 flex items-center justify-center text-cyan-600">
                    [Pending tasks / Alerts placeholder]
                  </div>
                </div>
              </div>

              <p className="text-center text-cyan-600 mt-12 italic">
                Use the sidebar to manage items, purchase orders, gate entries, GRNs, and more.
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default InventoryDashboard;