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
  CreditCard,      // New icon for payments
  FileCheck,       // New icon for invoices
} from "lucide-react";
import api from "../../../../services/api";

export default function SalesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-900/80 p-10 rounded-2xl border border-red-900/40 text-center">
          <h2 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300">You don't have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xl">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">
              Sales Dashboard
              {isHead && <span className="ml-2 text-lg text-cyan-500/70">(Management)</span>}
            </h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-IN")} • {user?.username || "User"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase">Role</p>
          <p className="text-cyan-300 font-medium">
            {isHead ? "Sales Head / Admin" : "Sales Executive"}
          </p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/60 flex flex-col">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-cyan-300">Sales</h2>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <button
              onClick={() => navigate("/sales/qualifiedleads")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Users className="h-5 w-5 text-cyan-400" />
              <span>Leads</span>
            </button>

            <button
              onClick={() => navigate("/sales/customers")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Briefcase className="h-5 w-5 text-teal-400" />
              <span>Customers</span>
            </button>

            <button
              onClick={() => navigate("/sale/orders/create")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Briefcase className="h-5 w-5 text-teal-400" />
              <span>Sales Orders</span>
            </button>

            <button
              onClick={() => navigate("/sale/list")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Briefcase className="h-5 w-5 text-teal-400" />
              <span>Sales List</span>
            </button>

            <button
              onClick={() => navigate("/sales/quotations")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FileText className="h-5 w-5 text-purple-400" />
              <span>Quotations</span>
            </button>

            {/* ==================== FINANCE SECTION ==================== */}
            <div className="pt-6 mt-6 border-t border-gray-800">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Finance
              </h3>

              <button
                onClick={() => navigate("/vendor-invoice")}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
              >
                <FileCheck className="h-5 w-5 text-amber-400" />
                <span>Vendor Invoices</span>
              </button>

              <button
                onClick={() => navigate("/vendor-payment")}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
              >
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <span>Vendor Payments</span>
              </button>
            </div>
            {/* ========================================================= */}

            {/* Uncomment if needed later */}
            {/* 
            <button
              onClick={() => navigate("/sales/reports")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              <span>Reports</span>
            </button>
            */}
          </nav>

          <div className="p-4 border-t border-gray-800 mt-auto">
            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content - Unchanged */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {dashboardLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-400 animate-pulse flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                Loading dashboard...
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards - Unchanged */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-lg hover:shadow-cyan-900/20 transition">
                  <p className="text-sm text-cyan-400/80 uppercase mb-1">Leads Today</p>
                  <p className="text-4xl font-bold text-cyan-300">{summary.leadsToday}</p>
                </div>

                <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-lg hover:shadow-cyan-900/20 transition">
                  <p className="text-sm text-teal-400/80 uppercase mb-1">Active Opportunities</p>
                  <p className="text-4xl font-bold text-teal-300">{summary.activeOpportunities}</p>
                </div>

                <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-lg hover:shadow-cyan-900/20 transition">
                  <p className="text-sm text-purple-400/80 uppercase mb-1">Quotations Today</p>
                  <p className="text-4xl font-bold text-purple-300">{summary.quotationsSentToday}</p>
                </div>

                <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-lg hover:shadow-cyan-900/20 transition">
                  <p className="text-sm text-emerald-400/80 uppercase mb-1">Pipeline Value</p>
                  <p className="text-4xl font-bold text-emerald-300">{summary.pipelineValue}</p>
                </div>
              </div>

              {/* Role-based content - Unchanged */}
              {isHead ? (
                <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                    <Users className="h-6 w-6" /> Team Performance
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="py-4 px-5 text-left text-gray-300">Name</th>
                          <th className="py-4 px-5 text-left text-gray-300">Leads</th>
                          <th className="py-4 px-5 text-left text-gray-300">Opps</th>
                          <th className="py-4 px-5 text-left text-gray-300">Won</th>
                          <th className="py-4 px-5 text-left text-gray-300">Pipeline</th>
                          <th className="py-4 px-5 text-left text-gray-300">Achieved</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamPerformance.map((member) => (
                          <tr key={member.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="py-4 px-5 font-medium text-gray-200">{member.name}</td>
                            <td className="py-4 px-5 text-gray-300">{member.leads}</td>
                            <td className="py-4 px-5 text-gray-300">{member.opps}</td>
                            <td className="py-4 px-5 text-gray-300">{member.won}</td>
                            <td className="py-4 px-5 text-gray-300">{member.pipeline}</td>
                            <td className="py-4 px-5">
                              <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm">
                                {member.achievement}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {teamPerformance.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No team data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                      <Target className="h-6 w-6" /> My Items
                    </h2>

                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="py-4 px-5 text-left text-gray-300">Name</th>
                            <th className="py-4 px-5 text-left text-gray-300">Type</th>
                            <th className="py-4 px-5 text-left text-gray-300">Status</th>
                            <th className="py-4 px-5 text-left text-gray-300">Next Action</th>
                            <th className="py-4 px-5 text-left text-gray-300">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myItems.map((item, i) => (
                            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="py-4 px-5 font-medium text-gray-200">{item.name}</td>
                              <td className="py-4 px-5 text-gray-300">{item.type}</td>
                              <td className="py-4 px-5 text-gray-300">{item.status}</td>
                              <td className="py-4 px-5 text-gray-300">{item.next}</td>
                              <td className="py-4 px-5 text-emerald-400 font-medium">{item.value}</td>
                            </tr>
                          ))}
                          {myItems.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-gray-500">
                                No assigned items yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 text-center shadow-lg">
                      <Target className="h-10 w-10 mx-auto mb-3 text-cyan-400" />
                      <p className="text-sm text-gray-400 uppercase mb-1">Target</p>
                      <p className="text-3xl font-bold text-cyan-300">{summary.targetAchievement}</p>
                    </div>

                    <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 text-center shadow-lg">
                      <BarChart3 className="h-10 w-10 mx-auto mb-3 text-teal-400" />
                      <p className="text-sm text-gray-400 uppercase mb-1">Pipeline</p>
                      <p className="text-3xl font-bold text-teal-300">{summary.pipelineValue}</p>
                    </div>

                    <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 text-center shadow-lg">
                      <Handshake className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                      <p className="text-sm text-gray-400 uppercase mb-1">Won</p>
                      <p className="text-3xl font-bold text-emerald-300">{summary.wonThisMonth}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}