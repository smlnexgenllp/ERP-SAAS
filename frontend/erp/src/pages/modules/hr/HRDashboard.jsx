// src/pages/modules/hr/HRDashboardTailwind.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  UserPlus,
  CalendarDays,
  CalendarCheck2,
  Clock,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

export default function HRDashboard() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeRecruitments: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalEmployees: 47,
        activeRecruitments: 5,
        pendingLeaves: 12,
        totalPayroll: 125000,
      });

      setRecentActivities([
        { id: 1, message: "John Doe joined as Software Engineer", time: "2 hours ago" },
        { id: 2, message: "Sarah Smith applied for leave", time: "4 hours ago" },
        { id: 3, message: "Payroll processed for March", time: "1 day ago" },
        { id: 4, message: "New position: Senior Developer", time: "2 days ago" },
        { id: 5, message: "New message in Project Alpha chat", time: "30 mins ago" },
      ]);

      setLoading(false);
    }, 800);
  }, []);

  const quickActions = [
    { icon: Users, label: "Employee List", description: "View all employees", action: () => navigate("/hr/employees") },
    { icon: Users, label: "Reimbursements", description: "Check employee reimbursements", action: () => navigate("/hr/reimbursements") },
    { icon: UserPlus, label: "Add Employee", description: "Onboard new team member", action: () => navigate("/hr/employees/add") },
    { icon: CalendarDays, label: "Leave Management", description: "Approve or reject leaves", action: () => navigate("/hr/leaves") },
    { icon: FileText, label: "Organization Tree", description: "View reporting structure", action: () => navigate("/hr/org-tree") },
    { icon: DollarSign, label: "Payroll Management", description: "Process salaries", action: () => navigate("/hr/payroll") },
    { icon: CalendarCheck2, label: "Attendance", description: "Track daily attendance", action: () => navigate("/hr/attendance") },
    { icon: UserPlus, label: "Recruitment", description: "Manage job openings & hires", action: () => navigate("/hr/jobopenings") },
    { icon: ClipboardList, label: "Task Management", description: "Assign and track tasks", action: () => navigate("/hr/tasks") },
    { icon: Users, label: "Add Department/Designation", description: "Manage departments & designations", action: () => navigate("/hr/departments") },
    { icon: MessageSquare, label: "Internal Chat", description: "Team & project communication", action: () => navigate("/hr/chat"), highlight: true },
  ];

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
      showAlert("Commands: employees, add employee, leaves, org-tree, payroll, attendance, recruit, tasks, chat, clear");
      return;
    }

    if (["chat", "messages"].includes(cmd)) { navigate("/hr/chat"); return; }
    if (["employees"].includes(cmd)) { navigate("/hr/employees"); return; }
    if (["add employee", "hire"].includes(cmd)) { navigate("/hr/employees/add"); return; }
    if (["leaves"].includes(cmd)) { navigate("/hr/leaves"); return; }
    if (["org-tree"].includes(cmd)) { navigate("/hr/org-tree"); return; }
    if (["payroll"].includes(cmd)) { showAlert(`Current monthly payroll: ₹${stats.totalPayroll.toLocaleString()}`); return; }
    if (["attendance"].includes(cmd)) { navigate("/hr/attendance"); return; }
    if (["recruit"].includes(cmd)) { navigate("/hr/jobopenings"); return; }
    if (["tasks"].includes(cmd)) { navigate("/hr/tasks"); return; }
    if (cmd === "clear") { showAlert("Terminal cleared."); return; }

    showAlert(`Unknown command: "${cmd}". Type "help" for list.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Header */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                  <Users className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-900">HR Dashboard</h1>
                  <p className="text-zinc-500 mt-1">
                    {organization?.name || "Organization"} • {user?.first_name || user?.email}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Stats Grid - Structure Same */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { label: "Total Employees", value: stats.totalEmployees, icon: Users },
              { label: "Active Recruitments", value: stats.activeRecruitments, icon: UserPlus },
              { label: "Pending Leaves", value: stats.pendingLeaves, icon: Calendar },
              { label: "Monthly Payroll", value: `₹${stats.totalPayroll.toLocaleString()}`, icon: DollarSign },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <item.icon className="w-7 h-7 text-zinc-700" />
                  </div>
                </div>
                <p className="text-zinc-500 text-sm">{item.label}</p>
                <p className="font-bold text-zinc-900 text-3xl mt-3">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions - Structure Same */}
            <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className={`flex items-center gap-4 p-6 border rounded-3xl hover:shadow transition-all text-left
                      ${a.highlight 
                        ? "border-emerald-300 bg-emerald-50" 
                        : "border-zinc-200 hover:border-zinc-300"}`}
                  >
                    <div className="bg-zinc-100 p-4 rounded-2xl">
                      <a.icon className={`w-6 h-6 ${a.highlight ? 'text-emerald-600' : 'text-zinc-700'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900">{a.label}</p>
                      <p className="text-sm text-zinc-500 mt-1">{a.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity - Structure Same */}
            <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm">
              <h3 className="text-2xl font-semibold text-zinc-900 mb-6">Recent Activity</h3>
              <div className="space-y-5">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className="bg-zinc-100 p-3 rounded-2xl">
                      <Clock className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-zinc-700">{act.message}</p>
                      <p className="text-zinc-500 text-sm mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Command Bar - Light Theme */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-6 py-4 flex items-center z-50 shadow-lg cursor-text"
        onClick={handleCommandBarClick}
      >
        <span className="text-zinc-400 font-bold mr-4 text-xl">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, employees, chat, leaves, tasks..."
          className="flex-1 bg-transparent text-zinc-700 outline-none font-mono text-base placeholder-zinc-400"
          spellCheck={false}
        />
      </div>

      {/* Alert Toast */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-3 rounded-2xl shadow-xl text-sm z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
}