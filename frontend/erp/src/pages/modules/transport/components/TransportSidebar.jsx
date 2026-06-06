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
} from "lucide-react";

export default function TransportSidebar({
  active = "dashboard",
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
      label: "Trips",
      path: "/transport/trips",
      key: "trips",
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
  ];

  return (
    <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">

      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>

          <div>
            <h2 className="text-white text-2xl font-semibold">
              Transport
            </h2>

            <p className="text-zinc-500 text-xs">
              ERP Module
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium transition-all ${
              active === item.key
                ? "bg-zinc-800 text-white border-l-4 border-blue-500"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
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
  );
}