import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  BarChart3,
  Wallet,
  Users,
  FileText,
  Activity,
} from "lucide-react";

const navItems = [
  { path: "/finance",             label: "Dashboard",          icon: BarChart3 },
  { path: "/finance/company-setup",        label: "Company Setup",      icon: Building2 },
  { path: "/finance/financial-year-setup", label: "Financial Year",     icon: CalendarDays },
  { path: "/finance/chart-of-accounts",    label: "Chart of Accounts",  icon: BarChart3 },
  { path: "/finance/opening-balances",     label: "Opening Balances",   icon: Wallet },
  { path: "/finance/master-data",          label: "Master Data",        icon: Users },
  { path: "/finance/transaction-entry",    label: "Transactions",       icon: FileText },
  { path: "/finance/reports",              label: "Reports",            icon: Activity },
];

export default function SidebarLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] fixed inset-y-0 bg-gray-900 border-r border-cyan-900">
        <div className="px-6 py-6 border-b border-cyan-900">
          <h1 className="text-blue-300 font-bold tracking-wide text-sm">
            ALU-CORE ERP
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Accounting Engine
          </p>
        </div>

        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {navItems.map(item => {
              const active = pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition
                      ${
                        active
                          ? "bg-gray-800 border-cyan-500"
                          : "border-cyan-900 hover:bg-gray-800/50"
                      }`}
                  >
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* PAGE CONTENT */}
      <main className="ml-[280px] flex-1 bg-gray-950 p-8">
        <Outlet />
      </main>
    </div>
  );
}
