import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  LayoutGrid,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  Briefcase,
  Target,
  Handshake,
  LogOut,
} from "lucide-react";

export default function SalesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [summary] = useState({
    leadsToday: 28,
    activeOpportunities: 42,
    quotationsSentToday: 11,
    pipelineValue: "₹ 84,50,000",
    wonThisMonth: 7,
    targetAchievement: "68%",
  });

  // Role logic
// System level roles (User model)
const isSuperAdmin = user?.role === "super_admin";
const isSubOrgAdmin = user?.role === "sub_org_admin";

// Organization level role (OrganizationUser model)
const isSalesHead = user?.org_role === "Sales Head";

// Final access control
const canAccess = isSuperAdmin || isSubOrgAdmin || isSalesHead;
const isHead = canAccess;

  // Static data
  const teamPerformance = [
    { name: "Pugal", leads: 54, opps: 18, won: 5, pipeline: "₹38,20,000", achievement: "72%" },
    { name: "Priya", leads: 47, opps: 15, won: 4, pipeline: "₹29,80,000", achievement: "65%" },
    { name: "Arjun", leads: 36, opps: 11, won: 2, pipeline: "₹19,50,000", achievement: "58%" },
  ];

  const myItems = [
    { name: "Apex Solutions", type: "Opportunity", status: "Negotiation", next: "Follow-up call", value: "₹12,50,000" },
    { name: "Rahul Sharma", type: "Lead", status: "Qualified", next: "Send quotation", value: "-" },
    { name: "TechNova", type: "Opportunity", status: "Proposal Sent", next: "Meeting 10th", value: "₹28,00,000" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl font-medium animate-pulse">Loading Dashboard...</div>
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-900/80 backdrop-blur-lg p-12 rounded-2xl border border-cyan-900/40 shadow-2xl text-center">
          <h2 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300 text-lg">Sales Dashboard is restricted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between shadow-2xl sticky top-0 z-10">
        <div className="flex items-center gap-5">
          <BarChart3 className="w-10 h-10 text-cyan-400" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-300 tracking-tight">
              Sales Dashboard
              {isHead && <span className="ml-3 text-xl font-normal text-cyan-500/70">(Management)</span>}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-IN")} • {user?.username || user?.name || "User"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Role</p>
            <p className="text-cyan-300 font-medium">
              {isHead ? "Sales Head / Admin" : "Sales Executive"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm flex flex-col">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-cyan-300">Sales Controls</h2>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-gray-800/70 transition-all duration-200 text-left group"
              onClick={() => navigate("/sales/leads")}
            >
              <Users className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300" />
              <span className="font-medium">Leads</span>
            </button>

            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-gray-800/70 transition-all duration-200 text-left group"
              onClick={() => navigate("/sales/opportunities")}
            >
              <Briefcase className="h-5 w-5 text-teal-400 group-hover:text-teal-300" />
              <span className="font-medium">Opportunities</span>
            </button>

            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-gray-800/70 transition-all duration-200 text-left group"
              onClick={() => navigate("/sales/quotations")}
            >
              <FileText className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
              <span className="font-medium">Quotations</span>
            </button>

            <button
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-gray-800/70 transition-all duration-200 text-left group"
              onClick={() => navigate("/sales/reports")}
            >
              <BarChart3 className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300" />
              <span className="font-medium">Reports & Analytics</span>
            </button>

            {isHead && (
              <button
                className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-gray-800/70 transition-all duration-200 text-left group mt-4 border-t border-gray-800 pt-4"
                onClick={() => navigate("/sales/team")}
              >
                <Users className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                <span className="font-medium">Team Management</span>
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-gray-800 mt-auto">
            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-700 hover:to-red-800 text-white transition-all duration-300 shadow-lg"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
              <p className="text-sm text-cyan-400/80 uppercase tracking-wider font-medium mb-1">Leads Today</p>
              <p className="text-4xl font-bold text-cyan-300">{summary.leadsToday}</p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
              <p className="text-sm text-teal-400/80 uppercase tracking-wider font-medium mb-1">Active Opportunities</p>
              <p className="text-4xl font-bold text-teal-300">{summary.activeOpportunities}</p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
              <p className="text-sm text-purple-400/80 uppercase tracking-wider font-medium mb-1">Quotations Today</p>
              <p className="text-4xl font-bold text-purple-300">{summary.quotationsSentToday}</p>
            </div>

            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
              <p className="text-sm text-emerald-400/80 uppercase tracking-wider font-medium mb-1">Pipeline Value</p>
              <p className="text-4xl font-bold text-emerald-300">{summary.pipelineValue}</p>
            </div>
          </div>

          {/* Role-based content */}
          {isHead ? (
            <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                <Users className="h-7 w-7" /> Team Performance Overview
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Leads</th>
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Opps</th>
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Won</th>
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Pipeline</th>
                      <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Achieved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.map((member) => (
                      <tr key={member.name} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-5 font-medium text-gray-200">{member.name}</td>
                        <td className="py-4 px-5 text-gray-300">{member.leads}</td>
                        <td className="py-4 px-5 text-gray-300">{member.opps}</td>
                        <td className="py-4 px-5 text-gray-300">{member.won}</td>
                        <td className="py-4 px-5 text-gray-300">{member.pipeline}</td>
                        <td className="py-4 px-5">
                          <span className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm font-medium">
                            {member.achievement}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
                  <Target className="h-7 w-7" /> My Assigned Items
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Name</th>
                        <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Type</th>
                        <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Next Action</th>
                        <th className="py-4 px-5 text-left text-sm font-semibold text-gray-300">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                          <td className="py-4 px-5 font-medium text-gray-200">{item.name}</td>
                          <td className="py-4 px-5 text-gray-300">{item.type}</td>
                          <td className="py-4 px-5 text-gray-300">{item.status}</td>
                          <td className="py-4 px-5 text-gray-300">{item.next}</td>
                          <td className="py-4 px-5 text-emerald-300 font-medium">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 text-center shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
                  <Target className="h-10 w-10 mx-auto mb-4 text-cyan-400" />
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Target Achieved</p>
                  <p className="text-4xl font-bold text-cyan-300">{summary.targetAchievement}</p>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 text-center shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
                  <BarChart3 className="h-10 w-10 mx-auto mb-4 text-teal-400" />
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Pipeline Value</p>
                  <p className="text-4xl font-bold text-teal-300">{summary.pipelineValue}</p>
                </div>

                <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl p-6 text-center shadow-xl hover:shadow-cyan-900/20 transition-all duration-300">
                  <Handshake className="h-10 w-10 mx-auto mb-4 text-emerald-400" />
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Won This Month</p>
                  <p className="text-4xl font-bold text-emerald-300">{summary.wonThisMonth}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}