// src/pages/modules/hr/Reimbursement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { IndianRupee, ArrowLeft } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data for history
  const filteredData = showFilter
    ? data.filter((r) => {
        if (filter === "approved") return r.status === "approved";
        if (filter === "rejected") return r.status === "rejected";
        return true;
      })
    : data;

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>

        {showFilter && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-zinc-400"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Manager</th>
                <th className="px-8 py-5 text-right font-semibold text-zinc-600">Amount</th>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Reason</th>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Date</th>
                <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                {showActions && (
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="text-center py-16 text-zinc-500">
                    No records found
                  </td>
                </tr>
              ) : (
                paginatedData.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-6 font-medium text-zinc-900">
                      {req.employee?.full_name || "—"}
                    </td>
                    <td className="px-8 py-6 text-zinc-700">
                      {req.manager?.full_name || "—"}
                    </td>
                    <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                      ₹{Number(req.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-8 py-6 text-zinc-700">{req.reason}</td>
                    <td className="px-8 py-6 text-zinc-700">{req.date}</td>
                    <td className="px-8 py-6 text-center">
                      <span
                        className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                          req.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : req.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    {showActions && (
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => onApprove(req.id)}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => onReject(req.id)}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-medium transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-zinc-100 flex items-center justify-between bg-white">
            <div className="text-sm text-zinc-500">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
              {filteredData.length} records
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
              >
                Previous
              </button>

              <div className="px-6 py-2.5 bg-zinc-100 rounded-2xl font-medium text-sm">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================
   Main Component
============================ */
export default function Reimbursement() {
  const navigate = useNavigate();

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
      const res = await api.get("/hr/reimbursements/");
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
      await loadReimbursements();
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading reimbursement requests...</p>
        </div>
      </div>
    );
  }

  const pending = reimbursements.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-5 mb-10">
          <button
            onClick={() => navigate("/hr/dashboard")}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
              <IndianRupee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                Reimbursement Requests
              </h1>
              <p className="text-zinc-500">Manage employee reimbursement claims</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <ReimbursementTable
          title="Pending Requests"
          data={pending}
          showActions
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
        />

        {/* Request History */}
        <ReimbursementTable
          title="Request History"
          data={reimbursements}
          showFilter
          filter={historyFilter}
          setFilter={setHistoryFilter}
        />
      </div>
    </div>
  );
}