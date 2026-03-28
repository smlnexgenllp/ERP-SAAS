// src/pages/modules/crm/CRMDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Users,
  UserPlus,
  CalendarDays,
  CalendarCheck2,
  DollarSign,
  FileText,
  MessageSquare,
  ClipboardList,
  Clock,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export default function CRMDashboard() {
  const { user, organization } = useAuth();
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
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = localStorage.getItem("token") || "";
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [contactsRes, oppsRes, followRes] = await Promise.all([
          fetch("/api/crm/contacts/", { headers }),
          fetch("/api/crm/opportunities/", { headers }),
          fetch("/api/crm/contacts/due_followups/", { headers }),
        ]);

        if (!contactsRes.ok) throw new Error(`Contacts failed: ${contactsRes.status}`);
        if (!oppsRes.ok) throw new Error(`Opportunities failed: ${oppsRes.status}`);
        if (!followRes.ok) throw new Error(`Due follow-ups failed: ${followRes.status}`);

        const contactsData = await contactsRes.json();
        const oppsData = await oppsRes.json();
        const followData = await followRes.json();

        // Handle both paginated ({ results: [...] }) and flat array responses
        const contacts = Array.isArray(contactsData) ? contactsData : contactsData.results || contactsData || [];
        const opportunities = Array.isArray(oppsData) ? oppsData : oppsData.results || oppsData || [];
        const followupsArray = Array.isArray(followData) ? followData : followData.items || followData || [];

        // Calculate stats
        const newLeadsCount = contacts.filter(c => c.status?.toLowerCase() === "new").length;
        const interestedCount = contacts.filter(c => c.status?.toLowerCase() === "interested").length;
        const customersCount = contacts.filter(c => c.status?.toLowerCase() === "customer").length;
        const openDealsCount = opportunities.filter(o => !["won", "lost"].includes(o.stage?.toLowerCase() || "")).length;
        const wonDealsCount = opportunities.filter(o => o.stage?.toLowerCase() === "won").length;
        const pipelineVal = opportunities
          .filter(o => !["won", "lost"].includes(o.stage?.toLowerCase() || ""))
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

        // Sort due follow-ups: overdue first, then by date
        const sortedFollowups = [...followupsArray].sort((a, b) => {
          const da = new Date(a.next_follow_up);
          const db = new Date(b.next_follow_up);
          const now = new Date();
          const aOverdue = da < now ? -1 : 0;
          const bOverdue = db < now ? -1 : 0;
          if (aOverdue !== bOverdue) return aOverdue - bOverdue;
          return da - db;
        });

        setDueFollowups(sortedFollowups);

        console.log("CRM Dashboard loaded:", {
          totalContacts: contacts.length,
          dueCount: followupsArray.length,
          firstDue: followupsArray[0] ? `${followupsArray[0].first_name} - ${followupsArray[0].next_follow_up}` : "none"
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setErrorMsg("Failed to load dashboard data. Please check your connection or login.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Command handler (same futuristic style as HR dashboard)
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    const showAlert = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert("Commands: contacts, add contact, opportunities, followups, deals, pipeline, chat, tasks, clear");
      return;
    }
    if (["chat", "messages", "team chat"].includes(cmd)) {
      navigate("/crm/chat");
      return;
    }
    if (["contacts", "leads", "lead list"].includes(cmd)) {
      navigate("/crm/contacts");
      return;
    }
    if (["add contact", "new contact", "create lead"].includes(cmd)) {
      navigate("/crm/contacts/new");
      return;
    }
    if (["opportunities", "deals", "pipeline"].includes(cmd)) {
      navigate("/crm/opportunities");
      return;
    }
    if (["followups", "due followups", "follow-up"].includes(cmd)) {
      showAlert(`You have ${stats.dueFollowups} due follow-ups`);
      return;
    }
    if (["tasks", "my tasks"].includes(cmd)) {
      navigate("/crm/tasks");
      return;
    }
    if (cmd === "clear") {
      showAlert("Terminal cleared.");
      return;
    }

    showAlert(`Unknown command: "${cmd}". Type "help" for commands.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-cyan-300 text-xl font-mono">
        Loading CRM Dashboard...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/60 border border-red-700 rounded-xl p-8 max-w-lg text-center">
          <h2 className="text-red-300 text-2xl mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const quickActions = [
    { icon: Users, label: "All Contacts", description: "View & manage leads", action: () => navigate("/crm/contacts") },
    { icon: UserPlus, label: "Add Contact", description: "Create new lead", action: () => navigate("/crm/contacts/new") },
    // { icon: CalendarDays, label: "Follow-ups", description: "Due reminders",  },
    // { icon: FileText, label: "Opportunities", description: "Deals & pipeline", },
    // { icon: DollarSign, label: "Pipeline Value", description: `₹${stats.pipelineValue.toLocaleString("en-IN")}`,  },
    // { icon: ClipboardList, label: "Tasks", description: "Assign & track tasks",  },
    // { icon: MessageSquare, label: "CRM Chat", description: "Team communication",  highlight: true },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          <header className="border-b border-cyan-800 pb-3 mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow shadow-cyan-400/50"></div>
            <h1 className="text-blue-300 text-lg font-bold">ALU-CORE: CRM DASHBOARD</h1>
            <span className="ml-auto text-gray-400 text-sm">
              [ {organization?.name || "Your Org"} ] • [ {user?.first_name || user?.email} ]
            </span>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { label: "Total Leads", value: stats.totalLeads, icon: Users },
              { label: "New Leads", value: stats.newLeads, icon: UserPlus },
              { label: "Interested", value: stats.interested, icon: MessageSquare },
              { label: "Customers", value: stats.customers, icon: Users },
              { label: "Open Deals", value: stats.openDeals, icon: FileText },
              { label: "Won Deals", value: stats.wonDeals, icon: DollarSign },
              { label: "Due Follow-ups", value: stats.dueFollowups, icon: CalendarCheck2 },
              { label: "Pipeline Value", value: `₹${stats.pipelineValue.toLocaleString("en-IN")}`, icon: BarChart3 },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow p-6 flex items-center gap-4 hover:shadow-cyan-800/50 transition"
              >
                <div className="bg-gray-900/20 p-3 rounded-lg">
                  <item.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{item.label}</p>
                  <p className="font-bold text-cyan-300 text-2xl">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
              <h3 className="text-blue-300 text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className={`flex items-center gap-3 p-4 border rounded-xl hover:shadow-md transition bg-gray-900/20 hover:bg-gray-800/40
                      ${a.highlight ? "border-cyan-500 shadow-lg shadow-cyan-500/20" : "border-cyan-900"}`}
                  >
                    <div className="bg-gray-900/20 p-3 rounded-lg">
                      <a.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-cyan-300 font-semibold">{a.label}</p>
                      <p className="text-gray-400 text-sm">{a.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Due Follow-ups as Recent Activity */}
            <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
              <h3 className="text-blue-300 text-xl font-bold mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="w-5 h-5" />
                  Due Follow-ups
                </div>
                {stats.dueFollowups > 0 && (
                  <span className="text-sm bg-yellow-900/60 px-3 py-1 rounded-full">
                    {stats.dueFollowups}
                  </span>
                )}
              </h3>

              {dueFollowups.length === 0 ? (
                <div className="text-gray-400 text-center py-10 flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 opacity-50" />
                  No follow-ups due right now
                  <p className="text-sm opacity-80">Schedule follow-ups on contact details to stay on top</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {dueFollowups.map((followup) => {
                    const followDate = followup.next_follow_up ? new Date(followup.next_follow_up) : null;
                    const isOverdue = followDate && followDate < new Date();
                    const isToday = followDate && followDate.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={followup.id}
                        onClick={() => navigate(`/crm/contacts/${followup.id}`)}
                        className={`p-4 rounded-xl cursor-pointer transition hover:scale-[1.02] ${
                          isOverdue
                            ? "bg-red-950/40 border-l-4 border-red-500"
                            : isToday
                            ? "bg-yellow-950/40 border-l-4 border-yellow-500"
                            : "bg-gray-800/40 border-l-4 border-cyan-600"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-base">
                              {followup.first_name} {followup.last_name || ""}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {followup.company || "No company"} • {followup.status?.toUpperCase() || "—"}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-medium ${isOverdue ? "text-red-400" : isToday ? "text-yellow-400" : "text-gray-300"}`}>
                              {followDate ? followDate.toLocaleDateString("en-IN") : "—"}
                            </p>
                            {isOverdue && <p className="text-xs text-red-400 mt-1">Overdue</p>}
                            {isToday && <p className="text-xs text-yellow-400 mt-1">Due Today</p>}
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
      </div>

      {/* Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center cursor-text shadow-2xl"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-green-400 font-bold mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, contacts, add contact, opportunities, followups, chat, tasks, clear..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {/* Alert Toast */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
}