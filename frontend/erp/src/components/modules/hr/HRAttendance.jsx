import React, { useEffect, useState, useRef } from "react";
import api from "../../../services/api";
import { Clock, Calendar, AlertCircle, CheckCircle, FileText } from "lucide-react";

// Format time to "9:00 AM" or "5:30 PM"
const formatTime = (timeString) => {
  if (!timeString) return "-";
  return new Date(timeString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Calculate total working hours (e.g., "8h 30m")
const calculateWorkingHours = (punchIn, punchOut) => {
  if (!punchIn || !punchOut) return "-";

  const inTime = new Date(punchIn);
  const outTime = new Date(punchOut);

  let diffMs = outTime - inTime;
  if (diffMs < 0) return "-";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0 && minutes === 0) return "< 1m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export default function HRAttendance() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [attendanceList, setAttendanceList] = useState([]);
  const [lateRequests, setLateRequests] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [permissionList, setPermissionList] = useState([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [command, setCommand] = useState("");
  const inputRef = useRef(null);        

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/hr/attendance/");
      setAttendanceList(res.data);
    } catch {
      showAlert("Failed to load attendance list");
    }
  };

  const fetchLateRequests = async () => {
    try {
      const res = await api.get("/hr/attendance/late-requests/");
      setLateRequests(res.data);
    } catch {
      showAlert("Failed to load late requests");
    }
  };

  const fetchMonthlyReport = async () => {
    if (!month) return showAlert("Select a month first");
    try {
      const res = await api.get(`/hr/attendance/monthly/?month=${month}`);
      setMonthlyReport(res.data);
    } catch {
      showAlert("Failed to load monthly report");
    }
  };

  const fetchLeaveList = async () => {
    try {
      const res = await api.get("/hr/leave-requests/");
      setLeaveList(res.data);
    } catch {
      showAlert("Failed to load leave list");
    }
  };

  const fetchPermissionList = async () => {
    try {
      const res = await api.get("/hr/permission/");
      setPermissionList(res.data);
    } catch {
      showAlert("Failed to load permission list");
    }
  };

  const handleLateAction = async (id, action) => {
    setLoading(true);
    try {
      await api.post(`/hr/attendance/late-requests/${id}/`, { action });
      showAlert(`Late punch ${action.toLowerCase()}d successfully`);
      fetchLateRequests();
      fetchAttendance();
    } catch {
      showAlert("Action failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setShowAlerts(true);
    setTimeout(() => setShowAlerts(false), 4000);
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert("Attendance Commands: attendance, late, monthly, leave, permission, clear, help");
      return;
    }
    if (["attendance", "attend"].includes(cmd)) {
      setActiveTab("attendance");
      return;
    }
    if (["late", "late requests", "late punch"].includes(cmd)) {
      setActiveTab("late");
      return;
    }
    if (["monthly", "report"].includes(cmd)) {
      setActiveTab("monthly");
      return;
    }
    if (["leave", "leaves"].includes(cmd)) {
      setActiveTab("leave");
      return;
    }
    if (["permission", "permissions"].includes(cmd)) {
      setActiveTab("permission");
      return;
    }
    if (cmd === "clear") {
      showAlert("Screen cleared.");
      return;
    }

    showAlert(`Unknown command: "${cmd}". Type "help" for commands.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      if (activeTab === "attendance") await fetchAttendance();
      if (activeTab === "late") await fetchLateRequests();
      if (activeTab === "leave") await fetchLeaveList();
      if (activeTab === "permission") await fetchPermissionList();
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  if (loading && attendanceList.length === 0 && activeTab === "attendance") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-cyan-300 text-xl font-mono">
        Loading Attendance System...
      </div>
    );
  }

  const tabs = [
    { key: "attendance", label: "Attendance Log", icon: Calendar },
    { key: "late", label: "Late Requests", icon: Clock },
    { key: "monthly", label: "Monthly Report", icon: AlertCircle },
    { key: "leave", label: "Leave Requests", icon: FileText },
    { key: "permission", label: "Permissions", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <header className="border-b border-cyan-800 pb-4 mb-8 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/70 "></div>
            <h1 className="text-2xl font-bold text-blue-300">ALU-CORE: ATTENDANCE SYSTEM</h1>
            <div className="ml-auto text-sm text-gray-400">
              <span className="text-cyan-400">● ONLINE</span> | {new Date().toLocaleDateString()}
            </div>
          </header>

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all font-semibold
                  ${activeTab === tab.key
                    ? "bg-cyan-900/40 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/30"
                    : "border-cyan-900/50 bg-gray-900/30 hover:border-cyan-700 hover:bg-gray-800/40"
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Cards */}
          <div className="space-y-8">
            {/* Attendance List */}
            {activeTab === "attendance" && (
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 px-6 py-4 border-b border-cyan-800">
                  <h3 className="text-xl font-bold text-cyan-200">Today's Attendance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr className="text-left text-cyan-400 text-sm">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Punch In</th>
                        <th className="px-6 py-4">Punch Out</th>
                        <th className="px-6 py-4 text-center">Working Hours</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30">
                      {attendanceList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-500">
                            No attendance records today
                          </td>
                        </tr>
                      ) : (
                        attendanceList.map((a) => (
                          <tr key={a.id} className="hover:bg-cyan-900/10 transition">
                            <td className="px-6 py-4 font-medium">{a.employee_name}</td>
                            <td className="px-6 py-4">{a.date}</td>
                            <td className="px-6 py-4 font-mono">{formatTime(a.punch_in)}</td>
                            <td className="px-6 py-4 font-mono">{formatTime(a.punch_out)}</td>
                            <td className="px-6 py-4 text-center font-bold text-yellow-300">
                              {calculateWorkingHours(a.punch_in, a.punch_out)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold
                                  ${a.status === "PRESENT"
                                    ? "bg-green-900/50 text-green-300"
                                    : a.status === "LEAVE"
                                    ? "bg-red-900/50 text-red-300"
                                    : a.status === "PENDING"
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-gray-700 text-gray-300"}`}
                              >
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Late Requests */}
            {activeTab === "late" && (
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-900/30 to-red-900/20 px-6 py-4 border-b border-cyan-800">
                  <h3 className="text-xl font-bold text-orange-300">Pending Late Punch Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr className="text-left text-cyan-400 text-sm">
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30">
                      {lateRequests.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-12 text-gray-500">
                            No pending late requests
                          </td>
                        </tr>
                      ) : (
                        lateRequests.map((r) => (
                          <tr key={r.id} className="hover:bg-orange-900/10 transition">
                            <td className="px-6 py-4 font-medium">{r.employee_name}</td>
                            <td className="px-6 py-4">{r.date}</td>
                            <td className="px-6 py-4 text-gray-400 max-w-md truncate">
                              {r.reason || "No reason provided"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleLateAction(r.id, "APPROVE")}
                                disabled={loading}
                                className="mx-2 px-4 py-2 bg-green-900/60 hover:bg-green-800 border border-green-600 rounded-lg text-sm font-bold transition disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLateAction(r.id, "REJECT")}
                                disabled={loading}
                                className="mx-2 px-4 py-2 bg-red-900/60 hover:bg-red-800 border border-red-600 rounded-lg text-sm font-bold transition disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monthly Report - Now Properly Displays Present, Late, Leave */}
            {activeTab === "monthly" && (
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-blue-300 mb-6">Monthly Attendance Summary</h3>
                <div className="flex gap-4 mb-8 items-center">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-4 py-3 bg-gray-900/50 border border-cyan-800 rounded-lg text-cyan-300 focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={fetchMonthlyReport}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold hover:opacity-90 transition shadow-lg"
                  >
                    Load Report
                  </button>
                </div>

                {monthlyReport.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {month ? "No data for selected month" : "Select a month to view report"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900/50 text-cyan-400">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold">Employee</th>
                          <th className="px-6 py-4 text-center text-green-400">Present Days</th>
                          <th className="px-6 py-4 text-center text-orange-400">Late Days</th>
                          <th className="px-6 py-4 text-center text-red-400">Leave Days</th>
                          <th className="px-6 py-4 text-center text-yellow-300">Total Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/30">
                        {monthlyReport.map((r, i) => {
                          const total = (r.present || 0) + (r.late || 0) + (r.leave || 0);
                          return (
                            <tr key={i} className="hover:bg-cyan-900/10 transition">
                              <td className="px-6 py-4 font-medium">{r.employee_name}</td>
                              <td className="px-6 py-4 text-center text-green-300 font-bold">{r.present || 0}</td>
                              <td className="px-6 py-4 text-center text-orange-300 font-bold">{r.late || 0}</td>
                              <td className="px-6 py-4 text-center text-red-300 font-bold">{r.leave || 0}</td>
                              <td className="px-6 py-4 text-center text-yellow-300 font-bold">{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Leave Requests */}
            {activeTab === "leave" && (
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 px-6 py-4 border-b border-cyan-800">
                  <h3 className="text-xl font-bold text-purple-300">Leave Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 text-cyan-400">
                      <tr>
                        <th className="px-6 py-4 text-left">Employee</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">From</th>
                        <th className="px-6 py-4">To</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30">
                      {leaveList.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-500">
                            No leave requests
                          </td>
                        </tr>
                      ) : (
                        leaveList.map((l) => (
                          <tr key={l.id} className="hover:bg-purple-900/10">
                            <td className="px-6 py-4 font-medium">{l.employee?.full_name || "Unknown"}</td>
                            <td className="px-6 py-4">{l.leave_type || "-"}</td>
                            <td className="px-6 py-4">{l.start_date || l.from_date}</td>
                            <td className="px-6 py-4">{l.end_date || l.to_date}</td>
                            <td className="px-6 py-4 text-gray-400 truncate max-w-xs">{l.reason || "-"}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold
                                  ${l.status === "APPROVED"
                                    ? "bg-green-900/50 text-green-300"
                                    : l.status === "REJECTED"
                                    ? "bg-red-900/50 text-red-300"
                                    : "bg-yellow-900/50 text-yellow-300"}`}
                              >
                                {l.status || "PENDING"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Permission Requests */}
            {activeTab === "permission" && (
              <div className="bg-gray-900/30 border border-cyan-900 rounded-xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-teal-900/30 to-cyan-900/20 px-6 py-4 border-b border-cyan-800">
                  <h3 className="text-xl font-bold text-teal-300">Permission Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 text-cyan-400">
                      <tr>
                        <th className="px-6 py-4 text-left">Employee</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Reason</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-900/30">
                      {permissionList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-12 text-gray-500">
                            No permission requests
                          </td>
                        </tr>
                      ) : (
                        permissionList.map((p) => (
                          <tr key={p.id} className="hover:bg-teal-900/10">
                            <td className="px-6 py-4 font-medium">{p.employee?.full_name || "Unknown"}</td>
                            <td className="px-6 py-4">{p.date}</td>
                            <td className="px-6 py-4">{p.time_from || p.from_time} - {p.time_to || p.to_time}</td>
                            <td className="px-6 py-4 text-gray-400">{p.reason || "-"}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold
                                  ${p.status === "APPROVED"
                                    ? "bg-green-900/50 text-green-300"
                                    : p.status === "REJECTED"
                                    ? "bg-red-900/50 text-red-300"
                                    : "bg-yellow-900/50 text-yellow-300"}`}
                              >
                                {p.status || "PENDING"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Command Bar */}
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
          placeholder="Type command: attendance, late, monthly, leave, help..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {/* Alert Toast */}
      {showAlerts && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-2xl text-sm font-mono z-50 ">
          {alertMessage}
        </div>
      )}
    </div>
  );
}