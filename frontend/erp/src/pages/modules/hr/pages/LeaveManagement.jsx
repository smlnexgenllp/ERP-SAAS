import React, { useEffect, useState, useRef } from "react";
import api from "../../../../services/api";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [leaveTab, setLeaveTab] = useState("pending");
  const [permissionTab, setPermissionTab] = useState("pending");
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);
  const navigate=useNavigate()
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const leaveRes = await api.get("/hr/leave-requests/");
      setLeaveRequests(leaveRes.data || []);
      const permRes = await api.get("/hr/permission/");
      setPermissionRequests(permRes.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests");
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
      let endpoint = "";
      if (type === "leave-requests") {
        endpoint = `/hr/leave-requests/${id}/${action}/`;
      } else if (type === "permission") {
        endpoint = `/hr/permission/${id}/${action}/`;
      }
      const res = await api.post(endpoint);
      if (res.status === 200 || res.status === 201) {
        if (type === "leave-requests") {
          setLeaveRequests(prev =>
            prev.map(req => req.id === id ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req)
          );
        }
        if (type === "permission") {
          setPermissionRequests(prev =>
            prev.map(req => req.id === id ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req)
          );
        }
      }
    } catch (err) {
      alert("ERROR: " + JSON.stringify(err.response?.data || err.message));
      setError("Failed to update request");
    } finally {
      setUpdatingId(null); 
    }
  };

  const getStatusIcon = (status) => {
    if (status === "approved") return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === "rejected") return <XCircle className="w-5 h-5 text-red-400" />;
    return <Clock className="w-5 h-5 text-yellow-400" />;
  };

  const renderTable = (data, type) => (
    <div className="overflow-x-auto border border-cyan-900 bg-gray-900/40 rounded-xl shadow">
      <table className="min-w-full text-cyan-300">
        <thead className="bg-gray-900/60 border-b border-cyan-800">
          <tr>
            <th className="p-4 text-left">Employee</th>
            <th className="p-4 text-left">Type</th>
            <th className="p-4 text-left">From</th>
            <th className="p-4 text-left">To</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                No {type === "leave-requests" ? "leave" : "permission"} requests
              </td>
            </tr>
          ) : (
            data.map((req) => (
              <tr key={req.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                <td className="p-4">{req.employee_name || req.employee?.full_name || "—"}</td>
                <td className="p-4 capitalize">{req.leave_type || "-"}</td>
                <td className="p-4">{req.start_date || req.date || "-"}</td>
                <td className="p-4">{req.end_date || req.time_from || "-"}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(req.status)}
                    <span className={`font-medium ${
                      req.status === "approved" ? "text-green-400" :
                      req.status === "rejected" ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {req.status || "pending"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {req.status === "pending" ? (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => updateRequestStatus(req.id, type, "approve")}
                        disabled={updatingId === req.id}
                        className="px-4 py-2 bg-green-900/50 border border-green-700 rounded-lg text-green-400 hover:bg-green-900/70 transition font-medium flex items-center gap-2"
                      >
                        {updatingId === req.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => updateRequestStatus(req.id, type, "reject")}
                        disabled={updatingId === req.id}
                        className="px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-400 hover:bg-red-900/70 transition font-medium"
                      >
                        {updatingId === req.id ? "..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Processed</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // === COMMAND LINE HANDLER ===
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const cmd = command.trim().toLowerCase();
    setCommand("");

    const showAlert = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3500);
    };

    if (!cmd) return;

    if (["help", "?", "commands"].includes(cmd)) {
      showAlert("Commands: pending leaves, pending permissions, approved, rejected, refresh, clear, help");
      return;
    }
    if (["pending leaves", "leaves pending", "leave pending"].includes(cmd)) {
      setLeaveTab("pending");
      showAlert("Switched to: Pending Leave Requests");
      return;
    }
    if (["pending permissions", "permission pending", "permissions pending"].includes(cmd)) {
      setPermissionTab("pending");
      showAlert("Switched to: Pending Permission Requests");
      return;
    }
    if (["approved", "approved leaves", "approved permissions"].includes(cmd)) {
      setLeaveTab("updated");
      setPermissionTab("updated");
      showAlert("Showing all approved/rejected requests");
      return;
    }
    if (["rejected"].includes(cmd)) {
      showAlert("Use 'approved' to see processed requests");
      return;
    }
    if (["refresh", "reload", "update"].includes(cmd)) {
      fetchRequests();
      showAlert("Refreshing all requests...");
      return;
    }
    if (cmd === "clear") {
      showAlert("Terminal cleared.");
      return;
    }
    if(cmd==="back"){
      navigate("/hr/dashboard")
      return;
    }
    showAlert(`Unknown command: "${cmd}". Type "help" for available commands.`);
  };

  const handleCommandBarClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-6">
          <div className="border-b border-cyan-900 pb-3 mb-8 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <h1 className="text-pink-400 text-2xl font-bold">
              LEAVE & PERMISSION MANAGEMENT
            </h1>
          </div>
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 px-6 py-3 rounded-lg mb-6 text-center font-medium">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-xl text-gray-400">Loading requests...</p>
            </div>
          ) : (
            <>
              {/* LEAVE REQUESTS */}
              <div className="mb-12">
                <h2 className="text-pink-400 text-xl font-bold mb-6 flex items-center gap-3">
                  <Calendar className="w-7 h-7" /> Leave Requests
                </h2>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setLeaveTab("pending")}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${
                      leaveTab === "pending"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/50"
                        : "bg-gray-800/60 border border-cyan-800 text-gray-400 hover:bg-gray-800/80"
                    }`}
                  >
                    <Clock className="w-5 h-5" /> Pending Requests
                  </button>
                  <button
                    onClick={() => setLeaveTab("updated")}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${
                      leaveTab === "updated"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/50"
                        : "bg-gray-800/60 border border-green-800 text-gray-400 hover:bg-gray-800/80"
                    }`}
                  >
                    Updated Requests
                  </button>
                </div>
                {renderTable(
                  leaveTab === "pending"
                    ? leaveRequests.filter(r => !r.status || r.status === "pending")
                    : leaveRequests.filter(r => r.status === "approved" || r.status === "rejected"),
                  "leave-requests"
                )}
              </div>
              <div>
                <h2 className="text-pink-400 text-xl font-bold mb-6 flex items-center gap-3">
                  <Clock className="w-7 h-7" /> Permission Requests
                </h2>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setPermissionTab("pending")}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${
                      permissionTab === "pending"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50"
                        : "bg-gray-800/60 border border-purple-800 text-gray-400 hover:bg-gray-800/80"
                    }`}
                  >
                    <Clock className="w-5 h-5" /> Pending Requests
                  </button>
                  <button
                    onClick={() => setPermissionTab("updated")}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${
                      permissionTab === "updated"
                        ? "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-600/50"
                        : "bg-gray-800/60 border border-teal-800 text-gray-400 hover:bg-gray-800/80"
                    }`}
                  >
                    Updated Requests
                  </button>
                </div>
                {renderTable(
                  permissionTab === "pending"
                    ? permissionRequests.filter(r => !r.status || r.status === "pending")
                    : permissionRequests.filter(r => r.status === "approved" || r.status === "rejected"),
                  "permission"
                )}
              </div>
            </>
          )}
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
          placeholder="Type command: help, pending leaves, refresh..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
        {/* <span className="w-2 h-5 bg-green-400 inline-block animate-ping ml-1 opacity-75"></span> */}
      </div>
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
}