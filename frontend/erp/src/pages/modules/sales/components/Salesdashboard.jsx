// src/pages/sales/SalesDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  BarChart3,
  Users,
  FileText,
  Briefcase,
  Target,
  Handshake,
  LogOut,
  CreditCard,
  FileCheck,
  Package,
  Menu,
  X,
} from "lucide-react";
import api from "../../../../services/api";

export default function SalesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [summary, setSummary] = useState({
    leadsToday: 0,
    activeOpportunities: 0,
    quotationsSentToday: 0,
    pipelineValue: "₹0",
    wonThisMonth: 0,
    targetAchievement: "0%",
  });

  const [teamPerformance, setTeamPerformance] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Role checks
  const isSuperAdmin = user?.role === "super_admin";
  const isSubOrgAdmin = user?.role === "sub_org_admin";
  const isSalesHead = user?.org_role === "Sales Head";
  const canAccess = isSuperAdmin || isSubOrgAdmin || isSalesHead;
  const isHead = canAccess;

  // Close sidebar on window resize (if screen becomes large)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!canAccess || authLoading) return;

    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);

        const [summaryRes, myItemsRes, teamRes] = await Promise.all([
          api.get("/sale/dashboard/summary/"),
          api.get("/sale/dashboard/my-items/"),
          isHead ? api.get("/sale/dashboard/team-performance/") : Promise.resolve({ data: [] }),
        ]);

        setSummary(summaryRes.data || summary);
        setMyItems(myItemsRes.data || []);
        setTeamPerformance(teamRes.data || []);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [canAccess, isHead, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-3xl font-semibold text-zinc-900 mb-3">Access Denied</h2>
          <p className="text-zinc-600">You don't have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { label: "Leads", icon: Users, path: "/sales/qualifiedleads", color: "text-cyan-600" },
    { label: "Customers", icon: Briefcase, path: "/sales/customers", color: "text-teal-600" },
    { label: "Create Sales Order", icon: Briefcase, path: "/sale/orders/create", color: "text-teal-600" },
    { label: "Sales List", icon: Briefcase, path: "/sale/list", color: "text-teal-600" },
    { label: "Quotations", icon: FileText, path: "/sales/quotations", color: "text-purple-600" },
  ];

  const financeItems = [
    { label: "Vendor Invoices", icon: FileCheck, path: "/vendor-invoice", color: "text-amber-600" },
    { label: "Vendor Payments", icon: CreditCard, path: "/vendor-payment", color: "text-emerald-600" },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex items-center justify-between mb-8 lg:mb-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">SALES</h2>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navigationItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              setSidebarOpen(false);
            }}
            className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-all font-medium group"
          >
            <item.icon className={`w-5 h-5 ${item.color} transition-transform group-hover:scale-105`} />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Finance Section */}
        <div className="pt-6 mt-6 border-t border-zinc-100">
          <p className="px-4 text-xs font-semibold text-zinc-500 mb-3 tracking-wider">FINANCE</p>
          {financeItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-all font-medium group"
            >
              <item.icon className={`w-5 h-5 ${item.color} transition-transform group-hover:scale-105`} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Logout Button - Fixed at bottom */}
      <div className="pt-6 mt-auto border-t border-zinc-100">
        <button
          onClick={() => navigate("/logout")}
          className="flex items-center gap-4 w-full p-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 transition-all font-medium group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:scale-105" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      {/* Mobile/Tablet Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all active:scale-95"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay for mobile/tablet */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-zinc-200 shadow-xl z-50
          flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:shadow-sm
        `}
      >
        <div className="p-6 flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
          {/* Header Section */}
          <div className="mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Spacer for mobile menu button alignment */}
                <div className="lg:hidden w-10" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-md">
                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900">
                      Sales Dashboard
                      {isHead && (
                        <span className="ml-2 text-base lg:text-lg font-medium text-zinc-500">
                          (Management)
                        </span>
                      )}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                      {new Date().toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • Welcome back, {user?.username || "User"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right pl-16 sm:pl-0">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Role</p>
                <p className="text-base sm:text-lg font-semibold text-zinc-800">
                  {isHead ? "Sales Head / Admin" : "Sales Executive"}
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          {dashboardLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-4 text-base font-medium">Loading dashboard data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 lg:mb-12">
                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Users className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-600" />
                    <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">TODAY</span>
                  </div>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                    {summary.leadsToday}
                  </p>
                  <p className="text-zinc-500 mt-2 text-sm sm:text-base">Leads Today</p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Target className="w-8 h-8 sm:w-9 sm:h-9 text-teal-600" />
                  </div>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                    {summary.activeOpportunities}
                  </p>
                  <p className="text-zinc-500 mt-2 text-sm sm:text-base">Active Opportunities</p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <FileText className="w-8 h-8 sm:w-9 sm:h-9 text-purple-600" />
                  </div>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 tracking-tight">
                    {summary.quotationsSentToday}
                  </p>
                  <p className="text-zinc-500 mt-2 text-sm sm:text-base">Quotations Today</p>
                </div>

                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Handshake className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600" />
                  </div>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600 tracking-tight">
                    {summary.pipelineValue}
                  </p>
                  <p className="text-zinc-500 mt-2 text-sm sm:text-base">Pipeline Value</p>
                </div>
              </div>

              {/* Role-specific Content */}
              {isHead ? (
                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-8 lg:p-10 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-700" />
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900">
                        Team Performance
                      </h2>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px]">
                      <table className="w-full">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Team Member
                            </th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Leads
                            </th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Opportunities
                            </th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Won
                            </th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Pipeline
                            </th>
                            <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                              Achievement
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {teamPerformance.map((member, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="py-4 px-6 font-medium text-zinc-900">{member.name}</td>
                              <td className="py-4 px-6 text-zinc-600">{member.leads}</td>
                              <td className="py-4 px-6 text-zinc-600">{member.opps}</td>
                              <td className="py-4 px-6 font-medium text-emerald-600">{member.won}</td>
                              <td className="py-4 px-6 text-zinc-600">{member.pipeline}</td>
                              <td className="py-4 px-6">
                                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                  {member.achievement}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {teamPerformance.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-16 text-center text-zinc-500">
                                No team performance data available yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 lg:space-y-10">
                  {/* My Items Table */}
                  <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 lg:p-10 border-b border-zinc-100">
                      <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-700" />
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-900">
                          My Items
                        </h2>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="min-w-[640px]">
                        <table className="w-full">
                          <thead className="bg-zinc-50">
                            <tr>
                              <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="py-4 px-6 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Next Action
                              </th>
                              <th className="py-4 px-6 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                                Value
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {myItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="py-4 px-6 font-medium text-zinc-900">{item.name}</td>
                                <td className="py-4 px-6 text-zinc-600">{item.type}</td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                    item.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                                    'bg-zinc-100 text-zinc-600'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-zinc-600">{item.next}</td>
                                <td className="py-4 px-6 text-right font-semibold text-emerald-600">
                                  {item.value}
                                </td>
                              </tr>
                            ))}
                            {myItems.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-16 text-center text-zinc-500">
                                  No assigned items yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-all">
                      <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-cyan-600" />
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                        Target Achievement
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-zinc-900">
                        {summary.targetAchievement}
                      </p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-all">
                      <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-teal-600" />
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                        Pipeline Value
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-teal-600">
                        {summary.pipelineValue}
                      </p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-sm hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                      <Handshake className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600" />
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                        Won This Month
                      </p>
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                        {summary.wonThisMonth}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// AlertCircle Component
const AlertCircle = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);