import React, { useEffect, useState, useRef } from "react";
import api from "../../../services/api";
import { Clock, Calendar, AlertCircle, CheckCircle, FileText, Download, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Format time
const formatTime = (timeString) => {
  if (!timeString) return "-";
  return new Date(timeString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Calculate working hours
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
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("attendance");
  const [attendanceList, setAttendanceList] = useState([]);
  const [lateRequests, setLateRequests] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [leaveList, setLeaveList] = useState([]);
  const [permissionList, setPermissionList] = useState([]);

  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [alertMessage, setAlertMessage] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [command, setCommand] = useState("");
  const inputRef = useRef(null);

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setShowAlerts(true);
    setTimeout(() => setShowAlerts(false), 4000);
  };

  // Fetch Functions
  const fetchAttendance = async () => {
    try {
      const res = await api.get("/hr/attendance/");
      setAttendanceList(res.data || []);
    } catch {
      showAlert("Failed to load attendance list");
    }
  };

  const fetchLateRequests = async () => {
    try {
      const res = await api.get("/hr/attendance/late-requests/");
      setLateRequests(res.data || []);
    } catch {
      showAlert("Failed to load late requests");
    }
  };

  const fetchLeaveList = async () => {
    try {
      const res = await api.get("/hr/leave-requests/");
      setLeaveList(res.data || []);
    } catch {
      showAlert("Failed to load leave list");
    }
  };

  const fetchPermissionList = async () => {
    try {
      const res = await api.get("/hr/permission/");
      setPermissionList(res.data || []);
    } catch {
      showAlert("Failed to load permission list");
    }
  };

  const fetchMonthlyReport = async () => {
    if (!month) {
      showAlert("Please select a month first");
      return;
    }
    setTabLoading(true);
    try {
      const res = await api.get(`/hr/attendance/monthly/?month=${month}`);
      setMonthlyReport(res.data || []);
    } catch {
      showAlert("Failed to load monthly report");
      setMonthlyReport([]);
    } finally {
      setTabLoading(false);
    }
  };

  // Handle Tab Change
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setTabLoading(true);
    try {
      if (tab === "attendance") await fetchAttendance();
      if (tab === "late") await fetchLateRequests();
      if (tab === "leave") await fetchLeaveList();
      if (tab === "permission") await fetchPermissionList();
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
    }
  };

  const handleLateAction = async (id, action) => {
    setActionLoading(true);
    try {
      await api.post(`/hr/attendance/late-requests/${id}/`, { action });
      showAlert(`Late punch ${action.toLowerCase()}d successfully`);
      fetchLateRequests();
      fetchAttendance();
    } catch {
      showAlert("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadMonthlyReport = () => {
    if (monthlyReport.length === 0) {
      showAlert("No report data to download");
      return;
    }

    const headers = ["Employee", "Present Days", "Late Days", "Leave Days", "Total Days"];
    const rows = monthlyReport.map((r) => [
      r.employee_name,
      r.present || 0,
      r.late || 0,
      r.leave || 0,
      (r.present || 0) + (r.late || 0) + (r.leave || 0),
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert("Monthly report downloaded successfully");
  };

  // Command Handler
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert("Commands: attendance, late, monthly, leave, permission, help");
      return;
    }
    if (["attendance", "attend"].includes(cmd)) handleTabChange("attendance");
    else if (["late", "late requests", "late punch"].includes(cmd)) handleTabChange("late");
    else if (["monthly", "report"].includes(cmd)) handleTabChange("monthly");
    else if (["leave", "leaves"].includes(cmd)) handleTabChange("leave");
    else if (["permission", "permissions"].includes(cmd)) handleTabChange("permission");
    else showAlert(`Unknown command: "${cmd}". Type "help" for commands.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  // Initial Load
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await Promise.all([
        fetchAttendance(),
        fetchLateRequests(),
        fetchLeaveList(),
        fetchPermissionList()
      ]);
      setLoading(false);
    };
    initialLoad();
  }, []);

  const tabs = [
    { key: "attendance", label: "Attendance Log", icon: Calendar },
    { key: "late", label: "Late Requests", icon: Clock },
    { key: "monthly", label: "Monthly Report", icon: AlertCircle },
    { key: "leave", label: "Leave Requests", icon: FileText },
    { key: "permission", label: "Permissions", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Attendance Management
                </h1>
                <p className="text-zinc-500">Monitor daily attendance, late requests & reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition ${
                activeTab === tab.key
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading Indicator */}
        {(loading || tabLoading) && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-zinc-600" />
              <p className="text-zinc-500 mt-4">
                {loading ? "Loading Attendance System..." : `Loading ${activeTab} data...`}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !tabLoading && (
          <div className="space-y-8">

            {/* Attendance Log */}
            {activeTab === "attendance" && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b bg-zinc-50">
                  <h3 className="text-2xl font-semibold text-zinc-900">Today's Attendance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Date</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Punch In</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Punch Out</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Working Hours</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {attendanceList.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-16 text-zinc-500">No attendance records today</td></tr>
                      ) : (
                        attendanceList.map((a) => (
                          <tr key={a.id} className="hover:bg-zinc-50 transition">
                            <td className="px-8 py-5 font-medium">{a.employee_name}</td>
                            <td className="px-8 py-5 text-zinc-600">{a.date}</td>
                            <td className="px-8 py-5 font-mono">{formatTime(a.punch_in)}</td>
                            <td className="px-8 py-5 font-mono">{formatTime(a.punch_out)}</td>
                            <td className="px-8 py-5 text-center font-medium text-amber-600">
                              {calculateWorkingHours(a.punch_in, a.punch_out)}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-4 py-1 rounded-full text-xs font-medium
                                ${a.status === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                                  a.status === "LEAVE" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
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
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b bg-zinc-50">
                  <h3 className="text-2xl font-semibold text-zinc-900">Pending Late Punch Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Date</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Reason</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {lateRequests.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-16 text-zinc-500">No pending late requests</td></tr>
                      ) : (
                        lateRequests.map((r) => (
                          <tr key={r.id} className="hover:bg-zinc-50">
                            <td className="px-8 py-5 font-medium">{r.employee_name}</td>
                            <td className="px-8 py-5 text-zinc-600">{r.date}</td>
                            <td className="px-8 py-5 text-zinc-600">{r.reason || "No reason provided"}</td>
                            <td className="px-8 py-5 text-center space-x-3">
                              <button
                                onClick={() => handleLateAction(r.id, "APPROVE")}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLateAction(r.id, "REJECT")}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-medium disabled:opacity-50"
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

            {/* Monthly Report */}
            {activeTab === "monthly" && (
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
                <h3 className="text-2xl font-semibold text-zinc-900 mb-6">Monthly Attendance Summary</h3>
                
                <div className="flex gap-4 mb-8 flex-wrap">
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-6 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
                  />
                  <button
                    onClick={fetchMonthlyReport}
                    className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-medium hover:bg-black transition"
                  >
                    Load Report
                  </button>
                  {monthlyReport.length > 0 && (
                    <button
                      onClick={downloadMonthlyReport}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-medium hover:bg-emerald-700 flex items-center gap-2 transition"
                    >
                      <Download size={18} /> Download CSV
                    </button>
                  )}
                </div>

                {monthlyReport.length === 0 ? (
                  <div className="text-center py-16 text-zinc-500">
                    {month ? "No data available for selected month" : "Select a month to view report"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                          <th className="px-8 py-5 text-center font-semibold text-emerald-600">Present Days</th>
                          <th className="px-8 py-5 text-center font-semibold text-amber-600">Late Days</th>
                          <th className="px-8 py-5 text-center font-semibold text-red-600">Leave Days</th>
                          <th className="px-8 py-5 text-center font-semibold text-zinc-600">Total Days</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {monthlyReport.map((r, i) => {
                          const total = (r.present || 0) + (r.late || 0) + (r.leave || 0);
                          return (
                            <tr key={i} className="hover:bg-zinc-50">
                              <td className="px-8 py-5 font-medium">{r.employee_name}</td>
                              <td className="px-8 py-5 text-center font-medium text-emerald-600">{r.present || 0}</td>
                              <td className="px-8 py-5 text-center font-medium text-amber-600">{r.late || 0}</td>
                              <td className="px-8 py-5 text-center font-medium text-red-600">{r.leave || 0}</td>
                              <td className="px-8 py-5 text-center font-semibold">{total}</td>
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
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b bg-zinc-50">
                  <h3 className="text-2xl font-semibold text-zinc-900">Leave Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Type</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">From</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">To</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Reason</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {leaveList.length === 0 ? (
                        <tr><td colSpan="6" className="text-center py-16 text-zinc-500">No leave requests</td></tr>
                      ) : (
                        leaveList.map((l) => (
                          <tr key={l.id} className="hover:bg-zinc-50">
                            <td className="px-8 py-5 font-medium">{l.employee?.full_name || "Unknown"}</td>
                            <td className="px-8 py-5 capitalize">{l.leave_type || "-"}</td>
                            <td className="px-8 py-5">{l.start_date || l.from_date}</td>
                            <td className="px-8 py-5">{l.end_date || l.to_date}</td>
                            <td className="px-8 py-5 text-zinc-600 truncate max-w-xs">{l.reason || "-"}</td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-4 py-1 rounded-full text-xs font-medium
                                ${l.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                  l.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
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
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b bg-zinc-50">
                  <h3 className="text-2xl font-semibold text-zinc-900">Permission Requests</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Date</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Time</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Reason</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {permissionList.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-16 text-zinc-500">No permission requests</td></tr>
                      ) : (
                        permissionList.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50">
                            <td className="px-8 py-5 font-medium">{p.employee?.full_name || "Unknown"}</td>
                            <td className="px-8 py-5">{p.date}</td>
                            <td className="px-8 py-5">{p.time_from || p.from_time} - {p.time_to || p.to_time}</td>
                            <td className="px-8 py-5 text-zinc-600">{p.reason || "-"}</td>
                            <td className="px-8 py-5 text-center">
                              <span className={`px-4 py-1 rounded-full text-xs font-medium
                                ${p.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                  p.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
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
        )}
      </div>

      {/* Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-6 py-4 flex items-center shadow-xl cursor-text"
        onClick={handleCommandBarClick}
      >
        <span className="text-zinc-400 font-medium mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: attendance, late, monthly, leave, permission, help..."
          className="flex-1 bg-transparent outline-none text-zinc-700 placeholder-zinc-400"
          spellCheck={false}
        />
      </div>

      {/* Alert Toast */}
      {showAlerts && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-xl text-sm z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
}