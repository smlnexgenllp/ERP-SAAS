 import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default function LeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const leaveRes = await api.get("/hr/leave-requests/");
      setLeaveRequests(leaveRes.data);

      const permRes = await api.get("/hr/permission/");
      setPermissionRequests(permRes.data);
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
    } 
    else if (type === "permission") {
      endpoint = `/hr/permission/${id}/${action}/`;
    }

    const res = await api.post(endpoint);

    if (res.status === 200) {
      if (type === "leave-requests") {
        setLeaveRequests(prev =>
          prev.map(req => req.id === id ? { ...req, status: action } : req)
        );
      }

      if (type === "permission") {
        setPermissionRequests(prev =>
          prev.map(req => req.id === id ? { ...req, status: action } : req)
        );
      }
    } else {
      setError("Failed to update request");
    }
  } catch (err) {
    alert("ERROR: " + JSON.stringify(err.response?.data || err.message));
    console.error("Update error:", err);
    setError("Failed to update request");
} 
 finally {
    setUpdatingId(null);
  }
};



  const renderTable = (data, type) => (
    <div className="overflow-x-auto border border-cyan-900 bg-gray-900/40 rounded-xl shadow">
      <table className="min-w-full text-cyan-300">
        <thead className="bg-gray-900/60 border-b border-cyan-800">
          <tr>
            <th className="p-3 text-left">Employee</th>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">From</th>
            <th className="p-3 text-left">To</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-gray-500 italic"
              >
                No {type === "leave-requests" ? "leave" : "permission"} requests
              </td>
            </tr>
          ) : (
            data.map((req) => (
              <tr
                key={req.id}
                className="border-b border-gray-800 hover:bg-gray-900/50 transition"
              >
                <td className="p-3">
                  {req.employee_name || req.employee?.full_name}
                </td>
                <td className="p-3">
                  {req.leave_type || req.permission_type}
                </td>
                <td className="p-3">{req.start_date || req.date || "-"}</td>
                <td className="p-3">{req.end_date || req.date || "-"}</td>

                <td
                  className={`p-3 font-semibold ${
                    req.status === "approved"
                      ? "text-green-400"
                      : req.status === "rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {req.status}
                </td>

                <td className="p-3 text-center">
                  {req.status.toLowerCase() === "pending" ? (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() =>
                          updateRequestStatus(req.id, type, "approve")
                        }
                        disabled={updatingId === req.id}
                        className="px-3 py-1 bg-green-600/20 border border-green-500 rounded-lg text-green-400 hover:bg-green-600/30"
                      >
                        {updatingId === req.id ? "..." : "Approve"}
                      </button>

                      <button
                        onClick={() =>
                          updateRequestStatus(req.id, type, "reject")
                        }
                        disabled={updatingId === req.id}
                        className="px-3 py-1 bg-red-600/20 border border-red-500 rounded-lg text-red-400 hover:bg-red-600/30"
                      >
                        {updatingId === req.id ? "..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-500">No actions</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      {/* HEADER */}
      <div className="border-b border-cyan-900 pb-3 mb-6 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-cyan-400" />
        <h1 className="text-pink-400 text-lg font-bold">
          LEAVE & PERMISSION MANAGEMENT
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : (
        <>
          {/* Leave Requests */}
          <div className="mb-8">
            <h2 className="text-pink-400 text-xl font-bold mb-3">
              Leave Requests
            </h2>
            {renderTable(leaveRequests, "leave-requests")}
          </div>

          {/* Permission Requests */}
          <div>
            <h2 className="text-pink-400 text-xl font-bold mb-3">
              Permission Requests
            </h2>
            {renderTable(permissionRequests, "permission")}
          </div>
        </>
      )}
    </div>
  );
}
