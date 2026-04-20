// src/pages/modules/crm/CRMDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  CalendarCheck2,
  DollarSign,
  FileText,
  MessageSquare,
  BarChart3,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function CRMDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    interested: 0,
    customers: 0,
    openDeals: 0,
    wonDeals: 0,
    pipelineValue: 0,
    dueFollowups: 0,
  });

  const [dueFollowups, setDueFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [contactsRes, oppsRes, followRes] = await Promise.all([
          fetch("/api/crm/contacts/"),
          fetch("/api/crm/opportunities/"),
          fetch("/api/crm/contacts/due_followups/"),
        ]);

        if (!contactsRes.ok || !oppsRes.ok || !followRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const contactsData = await contactsRes.json();
        const oppsData = await oppsRes.json();
        const followData = await followRes.json();

        const contacts = Array.isArray(contactsData) ? contactsData : contactsData.results || [];
        const opportunities = Array.isArray(oppsData) ? oppsData : oppsData.results || [];
        const followupsArray = Array.isArray(followData) ? followData : followData.items || [];

        const newLeadsCount = contacts.filter((c) => c.status?.toLowerCase() === "new").length;
        const interestedCount = contacts.filter((c) => c.status?.toLowerCase() === "interested").length;
        const customersCount = contacts.filter((c) => c.status?.toLowerCase() === "customer").length;

        const openDealsCount = opportunities.filter(
          (o) => !["won", "lost"].includes(o.stage?.toLowerCase() || "")
        ).length;

        const wonDealsCount = opportunities.filter((o) => o.stage?.toLowerCase() === "won").length;

        const pipelineVal = opportunities
          .filter((o) => !["won", "lost"].includes(o.stage?.toLowerCase() || ""))
          .reduce((sum, o) => sum + Number(o.value || 0), 0);

        setStats({
          totalLeads: contacts.length,
          newLeads: newLeadsCount,
          interested: interestedCount,
          customers: customersCount,
          openDeals: openDealsCount,
          wonDeals: wonDealsCount,
          pipelineValue: pipelineVal,
          dueFollowups: followupsArray.length,
        });

        const sortedFollowups = [...followupsArray].sort((a, b) => 
          new Date(a.next_follow_up) - new Date(b.next_follow_up)
        );

        setDueFollowups(sortedFollowups);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const showToast = (msg) => {
    setAlertMessage(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const cmd = command.trim().toLowerCase();
    setCommand("");

    if (!cmd) return;

    if (["help", "commands"].includes(cmd)) {
      showToast("Available commands: contacts, add contact, opportunities, followups, clear");
      return;
    }

    if (["contacts", "leads"].includes(cmd)) navigate("/crm/contacts-test");
    else if (["add contact", "new contact"].includes(cmd)) navigate("/crm/contacts/new-test");
    else if (["opportunities", "deals", "pipeline"].includes(cmd)) navigate("/crm/opportunities-test");
    else if (["followups", "due followups"].includes(cmd)) {
      showToast(`You have ${stats.dueFollowups} due follow-up${stats.dueFollowups !== 1 ? "s" : ""}`);
    }
    else if (cmd === "clear") showToast("Terminal cleared ✓");
    else showToast(`Unknown command: ${cmd}`);
  };

  const quickActions = [
    { icon: Users, label: "All Contacts", desc: "View & manage all leads", action: () => navigate("/crm/contacts-test") },
    { icon: UserPlus, label: "Add Contact", desc: "Create a new lead", action: () => navigate("/crm/contacts/new-test") },
    // { icon: FileText, label: "Opportunities", desc: "Manage deals & pipeline", action: () => navigate("/crm/opportunities-test") },
    { icon: CalendarCheck2, label: "Follow-ups", desc: "View pending reminders", action: () => showToast(`You have ${stats.dueFollowups} due follow-ups`) },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4 text-lg font-medium">Loading CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 max-w-md text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</h2>
          <p className="text-zinc-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-zinc-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-screen-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">CRM Dashboard</h1>
              <p className="text-zinc-500 text-sm">Customer Relationship Overview</p>
            </div>
          </div>

          <div className="px-5 py-2 bg-white border border-zinc-200 rounded-3xl text-sm flex items-center gap-2 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Live • Updated just now
          </div>
        </header>

        {/* Stats Grid - Smaller Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
          {[
            { label: "Total Leads", value: stats.totalLeads, icon: Users, accent: "zinc" },
            { label: "New Leads", value: stats.newLeads, icon: UserPlus, accent: "emerald" },
            { label: "Interested", value: stats.interested, icon: MessageSquare, accent: "amber" },
            { label: "Customers", value: stats.customers, icon: Users, accent: "blue" },
            { label: "Open Deals", value: stats.openDeals, icon: FileText, accent: "violet" },
            { label: "Won Deals", value: stats.wonDeals, icon: TrendingUp, accent: "emerald" },
            { label: "Due Follow-ups", value: stats.dueFollowups, icon: CalendarCheck2, accent: "rose" },
            {
              label: "Pipeline Value",
              value: `₹${stats.pipelineValue.toLocaleString("en-IN")}`,
              icon: DollarSign,
              accent: "zinc",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 shadow-sm hover:shadow transition-all duration-300 group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 transition-colors
                ${stat.accent === "zinc" ? "bg-zinc-100 group-hover:bg-zinc-200" : ""}
                ${stat.accent === "emerald" ? "bg-emerald-100 group-hover:bg-emerald-200" : ""}
                ${stat.accent === "amber" ? "bg-amber-100 group-hover:bg-amber-200" : ""}
                ${stat.accent === "blue" ? "bg-blue-100 group-hover:bg-blue-200" : ""}
                ${stat.accent === "violet" ? "bg-violet-100 group-hover:bg-violet-200" : ""}
                ${stat.accent === "rose" ? "bg-rose-100 group-hover:bg-rose-200" : ""}
              `}>
                <stat.icon className={`w-6 h-6 
                  ${stat.accent === "zinc" ? "text-zinc-700" : ""}
                  ${stat.accent === "emerald" ? "text-emerald-600" : ""}
                  ${stat.accent === "amber" ? "text-amber-600" : ""}
                  ${stat.accent === "blue" ? "text-blue-600" : ""}
                  ${stat.accent === "violet" ? "text-violet-600" : ""}
                  ${stat.accent === "rose" ? "text-rose-600" : ""}
                `} />
              </div>

              <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2 tracking-tighter">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Quick Actions */}
          <div className="xl:col-span-3 bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-7">Quick Actions</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="group flex items-center gap-5 p-6 bg-zinc-50 hover:bg-white border border-zinc-100 hover:border-zinc-300 rounded-3xl transition-all duration-300 text-left"
                >
                  <div className="w-14 h-14 bg-white border border-zinc-200 group-hover:border-zinc-300 rounded-2xl flex items-center justify-center shadow-sm transition-all">
                    <item.icon className="w-7 h-7 text-zinc-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-zinc-900 group-hover:text-black">
                      {item.label}
                    </p>
                    <p className="text-zinc-500 text-sm mt-1.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Due Follow-ups */}
          <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-2xl font-semibold text-zinc-900 flex items-center gap-3">
                <CalendarCheck2 className="w-6 h-6 text-zinc-700" />
                Due Follow-ups
              </h2>
              {stats.dueFollowups > 0 && (
                <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  {stats.dueFollowups} pending
                </span>
              )}
            </div>

            {dueFollowups.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center py-10">
                <AlertCircle className="w-16 h-16 text-zinc-300 mb-4" />
                <p className="text-xl font-medium text-zinc-400">All caught up!</p>
                <p className="text-zinc-500 mt-2">No follow-ups due right now</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scroll">
                {dueFollowups.map((followup) => {
                  const followDate = new Date(followup.next_follow_up);
                  return (
                    <div
                      key={followup.id}
                      onClick={() => navigate(`/crm/contacts-test/${followup.id}`)}
                      className="bg-zinc-50 hover:bg-white border border-zinc-100 hover:border-zinc-300 p-5 rounded-3xl cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {followup.first_name} {followup.last_name || ""}
                          </p>
                          <p className="text-sm text-zinc-500 mt-1">
                            {followup.company || "No company"} • {followup.status || "N/A"}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-zinc-600 whitespace-nowrap">
                          {followDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-8 py-5 flex items-center shadow-2xl z-50"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-zinc-400 font-bold text-2xl mr-4 font-mono">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, contacts, add contact, opportunities, followups..."
          className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-400 text-zinc-700"
          spellCheck={false}
        />
      </div>

      {/* Toast */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-lg text-zinc-800 px-7 py-3.5 rounded-2xl text-sm z-50 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          {alertMessage}
        </div>
      )}
    </div>
  );
}