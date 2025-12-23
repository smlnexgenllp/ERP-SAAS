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
  Clock,
} from "lucide-react";
export default function HRDashboardTailwind() {
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
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const quickActions = [
    {
      icon: Users,
      label: "Employee List",
      description: "View all employees",
      action: () => navigate("/hr/employees"),
    },
    {
      icon: Users,
      label: "Employee Reimbursement",
      description: "Check the reimbursements",
      action: () => navigate("/hr/reimbursements"),
    },
    {
      icon: UserPlus,
      label: "Employee Add",
      description: "Add new employee",
      action: () => navigate("/hr/employees/add"),
    },
    {
      icon: CalendarDays,
      label: "Leave Management",
      description: "Manage leave requests",
      action: () => navigate("/hr/leaves"),
    },
    {
      icon: FileText,
      label: "Organization Tree",
      description: "Employees structure",
      action: () => navigate("/hr/org-tree"),
    },
    {
      icon: FileText,
      label: "Payroll Management",
      description: "Manage Salary",
      action: () => navigate("/hr/payroll"),
    },

  ];
  // === COMMAND HANDLER ===
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
    // Available HR commands
    if (["help", "?", "commands"].includes(cmd)) {
      showAlert(
        "HR Commands: employees, add employee, leaves, org-tree, payroll, recruit, clear, help"
      );
      return;
    }
    if (["employees", "employee list", "list employees"].includes(cmd)) {
      navigate("/hr/employees");
      return;
    }
    if (["add employee", "new employee", "hire"].includes(cmd)) {
      navigate("/hr/employees/add");
      return;
    }
    if (["leaves", "leave", "leave management"].includes(cmd)) {
      navigate("/hr/leaves");
      return;
    }

    if (["org-tree", "organization", "org tree", "structure"].includes(cmd)) {
      navigate("/hr/org-tree");
      return;
    }

    if (["payroll", "salary", "monthly payroll"].includes(cmd)) {
      showAlert(`Current monthly payroll: ₹${stats.totalPayroll.toLocaleString()}`);
      return;
    }

    if (["recruit", "recruitment", "hiring", "jobs"].includes(cmd)) {
      showAlert(`Active recruitments: ${stats.activeRecruitments} positions open`);
      return;
    }

    if (cmd === "clear") {
      showAlert("Terminal cleared.");
      return;
    }
    if (cmd === "status" || cmd === "stats") {
      showAlert(
        `Employees: ${stats.totalEmployees} | Recruitments: ${stats.activeRecruitments} | Pending Leaves: ${stats.pendingLeaves}`
      );
      return;
    }
    showAlert(`Unknown command: "${cmd}". Type "help" for available commands.`);
  };
  const handleCommandBarClick = () => {
    inputRef.current?.focus();
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-cyan-300 text-xl font-mono">
        Loading HR Dashboard...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-6">
          {/* HEADER */}
          <header className="border-b border-cyan-800 pb-3 mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow shadow-cyan-400/50"></div>
            <h1 className="text-pink-400 text-lg font-bold">
              ALU-CORE: HR DASHBOARD
            </h1>
            <span className="ml-auto text-gray-400 text-sm">
              [ {organization?.name} ] • [ {user?.first_name} ]
            </span>
          </header>
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              { label: "Total Employees", value: stats.totalEmployees, icon: Users },
              { label: "Active Recruitments", value: stats.activeRecruitments, icon: UserPlus },
              { label: "Pending Leaves", value: stats.pendingLeaves, icon: Calendar },
              { label: "Monthly Payroll", value: `₹${stats.totalPayroll.toLocaleString()}`, icon: DollarSign },
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
            <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
              <h3 className="text-pink-400 text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((a, i) => (
                  <button
                    key={i}
                    onClick={a.action}
                    className="flex items-center gap-3 p-4 border border-cyan-900 rounded-xl hover:shadow-md transition bg-gray-900/20 hover:bg-gray-800/40"
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
            <div className="bg-gray-900/30 border border-cyan-900 p-6 rounded-xl">
              <h3 className="text-pink-400 text-xl font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className="bg-gray-900/20 p-2 rounded-full">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-cyan-300 text-sm">{act.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 bg-gray-900/30 border border-cyan-900 rounded-xl shadow p-6 text-center">
            <Calendar className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
            <p className="text-gray-400 mb-2">No upcoming events</p>
            <button className="bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 py-2 px-4 rounded font-bold hover:opacity-90 transition">
              Schedule an event
            </button>
          </div>
        </div>
      </div>
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center cursor-text shadow-2xl"
        onClick={handleCommandBarClick}
      >
        <span className="text-green-400 font-bold mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, employees, leaves, add employee..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono">
          {alertMessage}
        </div>
      )}
    </div>
  );
}