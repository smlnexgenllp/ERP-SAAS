import React from "react";
import { useNavigate } from "react-router-dom";

import {
  Truck,
  Route,
  Fuel,
  FileText,
  Wrench,
  Users,
  LogOut,
  BarChart3,
  Receipt,
  ClipboardCheck,
  X,
  Menu,
} from "lucide-react";

export default function TransportSidebar({
  active = "dashboard",
  isOpen = false,
  toggleSidebar,
}) {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: BarChart3,
      label: "Dashboard",
      path: "/transport/",
      key: "dashboard",
    },
    {
      icon: Truck,
      label: "Vehicles",
      path: "/transport/vehicles",
      key: "vehicles",
    },
    {
      icon: Users,
      label: "Drivers",
      path: "/transport/drivers",
      key: "drivers",
    },
    {
      icon: Route,
      label: "Routes",
      path: "/transport/routes",
      key: "routes",
    },
    {
      icon: Route,
      label: "Trips",
      path: "/transport/trips",
      key: "trips",
    },
    {
      icon: ClipboardCheck,
      label: "Delivery Proofs",
      path: "/transport/delivery-proofs",
      key: "delivery-proofs",
    },
    {
      icon: Fuel,
      label: "Fuel Entries",
      path: "/transport/fuel",
      key: "fuel",
    },
    {
      icon: Wrench,
      label: "Maintenance",
      path: "/transport/maintenance",
      key: "maintenance",
    },
    {
      icon: FileText,
      label: "Invoices",
      path: "/transport/invoices",
      key: "invoices",
    },
    {
      icon: Receipt,
      label: "Expenses",
      path: "/transport/expenses",
      key: "expenses",
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-800
        flex flex-col h-screen transition-transform duration-300 ease-in-out
        ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-semibold">
                  Transport
                </h2>
                <p className="text-zinc-500 text-xs">ERP Module</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Menu */}
        <nav
          className="flex-1 p-4 space-y-2 overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                navigate(item.path);

                if (window.innerWidth < 1024) {
                  toggleSidebar?.();
                }
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-200
              ${
                active === item.key
                  ? "bg-zinc-800 text-white border-l-4 border-blue-500"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={() => navigate("/logout")}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-950 hover:bg-red-900 text-red-300 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Hide Scrollbar */}
      <style>
        {`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </>
  );
}