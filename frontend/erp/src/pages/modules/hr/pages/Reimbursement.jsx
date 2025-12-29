import React, { useEffect, useState } from "react";
import {
  fetchReimbursements,
  approveReimbursement,
  rejectReimbursement,
} from "../../../../../src/pages/modules/hr/api/hrApi";
import { IndianRupee } from "lucide-react";

/* ============================
   Reusable Table
============================ */
function ReimbursementTable({
  title,
  data,
  showActions = false,
  onApprove,
  onReject,
  actionLoading,
  showFilter = false,
  filter,
  setFilter,
}) {
  return (
    <section className="mb-10">
      {/* HEADER + FILTER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-blue-300">{title}</h2>

        {showFilter && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900 border border-cyan-800 text-cyan-300 text-sm rounded px-3 py-1"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">No records found</p>
      ) : (
        <div className="space-y-4">
          {data.map((req) => (
            <div
              key={req.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-900/30 border border-cyan-900 rounded-xl p-5 gap-4"
            >
              {/* INFO */}
              <div>
                <p className="text-cyan-300 font-semibold">
                  Employee: {req.employee?.full_name || "Employee"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Manager: {req.manager?.full_name || "Manager"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  ₹{req.amount} • {req.reason}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Date: {req.date}
                </p>

                {/* STATUS BADGE */}
                {!showActions && (
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 text-xs rounded border ${
                      req.status === "approved"
                        ? "border-green-500 text-green-400"
                        : "border-red-500 text-red-400"
                    }`}
                  >
                    {req.status.toUpperCase()}
                  </span>
                )}
              </div>

              {/* ACTIONS */}
              {showActions && (
                <div className="flex gap-2">
                  <button
                    disabled={actionLoading === req.id}
                    onClick={() => onApprove(req.id)}
                    className="px-4 py-1.5 bg-green-500/20 text-green-400 border border-green-500 rounded hover:bg-green-500/30 disabled:opacity-50"
                  >
                    {actionLoading === req.id ? "Approving..." : "Approve"}
                  </button>

                  <button
                    disabled={actionLoading === req.id}
                    onClick={() => onReject(req.id)}
                    className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500 rounded hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {actionLoading === req.id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================
   Main Component
============================ */
export default function Reimbursement() {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  useEffect(() => {
    loadReimbursements();
  }, []);

  const loadReimbursements = async () => {
    try {
      setLoading(true);
      const res = await fetchReimbursements();
      setReimbursements(Array.isArray(res.data) ? res.data : []);
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
      await loadReimbursements();
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
      await loadReimbursements();
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

  /* ============================
     DATA SPLIT
  ============================ */
  const pending = reimbursements.filter((r) => r.status === "pending");

  const history = reimbursements.filter((r) => {
    if (historyFilter === "approved") return r.status === "approved";
    if (historyFilter === "rejected") return r.status === "rejected";
    return r.status === "approved" || r.status === "rejected";
  });

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono p-6">
      {/* HEADER */}
      <header className="flex items-center gap-3 border-b border-cyan-800 pb-4 mb-6">
        <IndianRupee className="w-6 h-6 text-cyan-400" />
        <h1 className="text-blue-300 text-xl font-bold">
          Reimbursement Requests
        </h1>
      </header>

      {/* PENDING TABLE */}
      <ReimbursementTable
        title="Pending Requests"
        data={pending}
        showActions
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />

      {/* HISTORY TABLE */}
      <ReimbursementTable
        title="Request History"
        data={history}
        showFilter
        filter={historyFilter}
        setFilter={setHistoryFilter}
      />
    </div>
  );
}
