import React, { useEffect, useState } from "react";
import {
  fetchReimbursements,
  approveReimbursement,
  rejectReimbursement,
} from "../../../../../src/pages/modules/hr/api/hrApi";
import { IndianRupee } from "lucide-react";

export default function Reimbursement() {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadReimbursements();
  }, []);

  const loadReimbursements = async () => {
    try {
      setLoading(true);
      const res = await fetchReimbursements();

      console.log("Reimbursements API response 👉", res.data);

      // Defensive check + pending-only filter
      const pending = Array.isArray(res.data)
        ? res.data.filter((r) => r.status === "pending")
        : [];

      setReimbursements(pending);
    } catch (err) {
      console.error("Failed to load reimbursements", err);
      setReimbursements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await approveReimbursement(id);
      await loadReimbursements(); // reload fresh data
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(id);
      await rejectReimbursement(id);
      await loadReimbursements(); // reload fresh data
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300 font-mono">
        Loading reimbursement requests...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono p-6">
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-cyan-800 pb-4 mb-6">
        <IndianRupee className="w-6 h-6 text-cyan-400" />
        <h1 className="text-pink-400 text-xl font-bold">
          Reimbursement Requests
        </h1>
      </header>

      {/* EMPTY STATE */}
      {reimbursements.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          No pending reimbursement requests
        </div>
      ) : (
        <div className="space-y-4">
          {reimbursements.map((req) => (
            <div
              key={req.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-900/30 border border-cyan-900 rounded-xl p-5 gap-4"
            >
              {/* LEFT INFO */}
              <div>
                <p className="text-cyan-300 font-semibold">
                 Employee ID:  {req.employee || "Employee"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  ₹{req.amount} • {req.reason}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Date: {req.date}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleApprove(req.id)}
                  className="px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500 rounded hover:bg-green-500/30 disabled:opacity-50"
                >
                  {actionLoading === req.id ? "Approving..." : "Approve"}
                </button>

                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleReject(req.id)}
                  className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500 rounded hover:bg-red-500/30 disabled:opacity-50"
                >
                  {actionLoading === req.id ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
