import React, { useEffect, useState } from "react";
import {
  fetchReimbursements,
  approveReimbursement,
  rejectReimbursement,
} from "../../../../../src/pages/modules/hr/api/hrApi";
import { IndianRupee, Search } from "lucide-react";

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
  searchTerm,
  setSearchTerm,
}) {
  return (
    <section className="mb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />

            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-gray-400 w-full sm:w-64"
            />
          </div>

          {/* STATUS FILTER */}
          {showFilter && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {data.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <p className="text-gray-500 text-sm">No records found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              {/* TABLE HEAD */}
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Employee
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Manager
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Amount
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Reason
                  </th>

                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Date
                  </th>

                  {!showActions && (
                    <th className="px-6 py-4 font-semibold text-gray-700">
                      Status
                    </th>
                  )}

                  {showActions && (
                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>
                {data.map((req, index) => (
                  <tr
                    key={req.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    {/* EMPLOYEE */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {req.employee?.full_name || "Employee"}
                    </td>

                    {/* MANAGER */}
                    <td className="px-6 py-4 text-gray-600">
                      {req.manager?.full_name || "Manager"}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{req.amount}
                    </td>

                    {/* REASON */}
                    <td className="px-6 py-4 text-gray-600">
                      {req.reason}
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-4 text-gray-500">
                      {req.date}
                    </td>

                    {/* STATUS */}
                    {!showActions && (
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            req.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                    )}

                    {/* ACTIONS */}
                    {showActions && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => onApprove(req.id)}
                            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black transition disabled:opacity-50"
                          >
                            {actionLoading === req.id
                              ? "Approving..."
                              : "Approve"}
                          </button>

                          <button
                            disabled={actionLoading === req.id}
                            onClick={() => onReject(req.id)}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                          >
                            {actionLoading === req.id
                              ? "Rejecting..."
                              : "Reject"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  const [activeTab, setActiveTab] = useState("pending");

  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Loading reimbursement requests...
      </div>
    );
  }

  /* ============================
     DATA FILTERING
  ============================ */

  // Pending Requests
  const pending = reimbursements.filter((r) => {
    return (
      r.status === "pending" &&
      (r.employee?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  // History Requests
  const history = reimbursements.filter((r) => {
    const matchesSearch = (r.employee?.full_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (historyFilter === "approved") {
      return r.status === "approved" && matchesSearch;
    }

    if (historyFilter === "rejected") {
      return r.status === "rejected" && matchesSearch;
    }

    return (
      (r.status === "approved" ||
        r.status === "rejected") &&
      matchesSearch
    );
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reimbursement Requests
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage employee reimbursement approvals and request history
            </p>
          </div>
        </header>

        {/* TABS */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => {
              setActiveTab("pending");
              setSearchTerm("");
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "pending"
                ? "bg-gray-900 text-white shadow"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Pending Requests
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              setSearchTerm("");
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-gray-900 text-white shadow"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Request History
          </button>
        </div>

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <ReimbursementTable
            title="Pending Requests"
            data={pending}
            showActions
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <ReimbursementTable
            title="Request History"
            data={history}
            showFilter
            filter={historyFilter}
            setFilter={setHistoryFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
      </div>
    </div>
  );
}