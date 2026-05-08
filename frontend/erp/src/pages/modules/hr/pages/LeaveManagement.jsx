import React, { useEffect, useState, useRef } from "react";
import api from "../../../../services/api";
import { Calendar, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [leaveTab, setLeaveTab] = useState("pending");
  const [permissionTab, setPermissionTab] = useState("pending");
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  const isPending = (req) => !req.status || req.status === "pending";
  const isProcessed = (req) => req.status === "approved" || req.status === "rejected";

  const getStatusIcon = (status) => {
    if (status === "approved") return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (status === "rejected") return <XCircle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-amber-600" />;
  };

  const getStatusText = (status) => {
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending";
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const [leaveRes, permRes] = await Promise.all([
        api.get("/hr/leave-requests/"),
        api.get("/hr/permission/"),
      ]);

      setLeaveRequests(leaveRes.data.results || leaveRes.data || []);
      setPermissionRequests(permRes.data.results || permRes.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateRequestStatus = async (id, type, action) => {
    try {
      setUpdatingId(id);
      setError("");

      const endpoint = type === "leave-requests"
        ? `/hr/leave-requests/${id}/${action}/`
        : `/hr/permission/${id}/${action}/`;

      await api.post(endpoint);

      const newStatus = action === "approve" ? "approved" : "rejected";

      if (type === "leave-requests") {
        setLeaveRequests(prev =>
          prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
        );
      } else {
        setPermissionRequests(prev =>
          prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
        );
      }
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const renderTable = (data, type) => (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-6 py-5 text-left font-semibold text-zinc-600">Employee</th>
            <th className="px-6 py-5 text-left font-semibold text-zinc-600">Type</th>
            <th className="px-6 py-5 text-left font-semibold text-zinc-600">From</th>
            <th className="px-6 py-5 text-left font-semibold text-zinc-600">To</th>
            <th className="px-6 py-5 text-left font-semibold text-zinc-600">Status</th>
            <th className="px-6 py-5 text-center font-semibold text-zinc-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-20 text-center text-zinc-500">
                No {type === "leave-requests" ? "leave" : "permission"} requests found
              </td>
            </tr>
          ) : (
            data.map((req) => (
              <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-5 font-medium text-zinc-900">
                  {req.employee_name || req.employee?.full_name || "—"}
                </td>
                <td className="px-6 py-5 text-zinc-700 capitalize">
                  {type === "leave-requests" ? req.leave_type : "Permission"}
                </td>
                <td className="px-6 py-5 text-zinc-700">
                  {type === "leave-requests" ? req.start_date : req.date}
                </td>
                <td className="px-6 py-5 text-zinc-700">
                  {type === "leave-requests"
                    ? req.end_date
                    : `${req.time_from || "-"} - ${req.time_to || "-"}`}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(req.status)}
                    <span className={`font-medium ${
                      req.status === "approved" ? "text-emerald-700" :
                      req.status === "rejected" ? "text-red-700" : "text-amber-700"
                    }`}>
                      {getStatusText(req.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  {isPending(req) ? (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => updateRequestStatus(req.id, type, "approve")}
                        disabled={updatingId === req.id}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition disabled:opacity-50"
                      >
                        {updatingId === req.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => updateRequestStatus(req.id, type, "reject")}
                        disabled={updatingId === req.id}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition disabled:opacity-50"
                      >
                        {updatingId === req.id ? "..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">Processed</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Command Handler
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    const showAlert = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3500);
    };

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert("Commands: pending leaves, pending permissions, processed, refresh, back, help");
      return;
    }
    if (["pending leaves", "leaves pending", "leave pending"].includes(cmd)) {
      setLeaveTab("pending");
      showAlert("Switched to Pending Leave Requests");
      return;
    }
    if (["pending permissions", "permission pending", "permissions pending"].includes(cmd)) {
      setPermissionTab("pending");
      showAlert("Switched to Pending Permission Requests");
      return;
    }
    if (["processed", "approved", "done"].includes(cmd)) {
      setLeaveTab("processed");
      setPermissionTab("processed");
      showAlert("Showing Processed Requests");
      return;
    }
    if (["refresh", "reload"].includes(cmd)) {
      fetchRequests();
      showAlert("Refreshing data...");
      return;
    }
    if (cmd === "back") {
      navigate("/hr/dashboard");
      return;
    }

    showAlert(`Unknown command: "${cmd}". Type "help" for list.`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

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
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Leave & Permission
                </h1>
                <p className="text-zinc-500">Manage employee leave and permission requests</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto"></div>
            <p className="text-zinc-500 mt-4">Loading requests...</p>
          </div>
        ) : (
          <>
            {/* Leave Requests Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                <Calendar className="w-7 h-7 text-emerald-600" />
                Leave Requests
              </h2>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setLeaveTab("pending")}
                  className={`px-6 py-3 rounded-2xl font-medium transition ${
                    leaveTab === "pending"
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setLeaveTab("processed")}
                  className={`px-6 py-3 rounded-2xl font-medium transition ${
                    leaveTab === "processed"
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Processed
                </button>
              </div>

              {renderTable(
                leaveTab === "pending"
                  ? leaveRequests.filter(isPending)
                  : leaveRequests.filter(isProcessed),
                "leave-requests"
              )}
            </div>

            {/* Permission Requests Section */}
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                <Clock className="w-7 h-7 text-amber-600" />
                Permission Requests
              </h2>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setPermissionTab("pending")}
                  className={`px-6 py-3 rounded-2xl font-medium transition ${
                    permissionTab === "pending"
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setPermissionTab("processed")}
                  className={`px-6 py-3 rounded-2xl font-medium transition ${
                    permissionTab === "processed"
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  Processed
                </button>
              </div>

              {renderTable(
                permissionTab === "pending"
                  ? permissionRequests.filter(isPending)
                  : permissionRequests.filter(isProcessed),
                "permission"
              )}
            </div>
          </>
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
          placeholder="Type command: help, pending leaves, processed, refresh, back..."
          className="flex-1 bg-transparent outline-none text-zinc-700 placeholder-zinc-400 font-medium"
          spellCheck={false}
        />
      </div>

      {/* Alert Toast */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-xl text-sm z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
}