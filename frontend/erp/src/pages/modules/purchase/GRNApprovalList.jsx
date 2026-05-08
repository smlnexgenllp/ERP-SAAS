import React, { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiArrowLeft,
} from "react-icons/fi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

export default function GRNApprovalList() {
  const navigate = useNavigate();

  const [grns, setGrns] = useState([]);
  const [gateEntries, setGateEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [grnRes, gateRes] = await Promise.all([
        api.get("/inventory/grns/pending_for_approval/"),
        api.get("/inventory/gate-entries/"),
      ]);

      const map = {};
      gateRes.data.forEach((g) => {
        map[g.id] = g;
      });

      setGateEntries(map);
      setGrns(grnRes.data || []);
    } catch (err) {
      console.error("Load failed:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (grnId) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this GRN? This will update stock and accounting."
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [grnId]: true }));
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post(`/inventory/grns/${grnId}/approve/`);
      setSuccessMsg(`GRN ${res.data.grn_number || grnId} approved successfully!`);
      setGrns((prev) => prev.filter((g) => g.id !== grnId));
    } catch (err) {
      console.error("GRN approval failed:", err.response?.data || err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] ||
        "Approval failed. Please try again.";
      setError(errMsg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [grnId]: false }));
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiCheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Pending GRN Approvals
                </h1>
                <p className="text-zinc-500">Review and approve Goods Receipt Notes</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <FiAlertTriangle size={22} />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <FiCheckCircle size={22} />
            {successMsg}
          </div>
        )}

        {/* Main Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          {grns.length === 0 ? (
            <div className="text-center py-24 text-zinc-500">
              <FiCheckCircle size={48} className="mx-auto mb-6 text-zinc-300" />
              <p className="text-xl font-medium">No pending GRNs for approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">GRN Number</th>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">Gate Entry</th>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">PO Number</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Items</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Total Qty</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Date</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {grns.map((grn) => {
                    const gate = gateEntries[grn.gate_entry];
                    return (
                      <tr key={grn.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 font-medium text-zinc-900">
                          {grn.grn_number}
                        </td>
                        <td className="px-8 py-6 text-zinc-700">
                          {gate?.gate_entry_number || "—"}
                        </td>
                        <td className="px-8 py-6 text-zinc-700">
                          {grn.po_details?.po_number || `PO #${grn.po}`}
                        </td>
                        <td className="px-8 py-6 text-center text-zinc-600">
                          {gate?.items?.length || 0}
                        </td>
                        <td className="px-8 py-6 text-center font-medium">
                          {gate?.items
                            ? gate.items.reduce(
                                (sum, i) => sum + Number(i.delivered_qty || 0),
                                0
                              )
                            : 0}
                        </td>
                        <td className="px-8 py-6 text-right text-zinc-500">
                          {grn.received_date
                            ? format(new Date(grn.received_date), "dd MMM yyyy")
                            : "—"}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => handleApprove(grn.id)}
                            disabled={actionLoading[grn.id]}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl font-medium transition-all ${
                              actionLoading[grn.id]
                                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            {actionLoading[grn.id] ? (
                              <>
                                <FiLoader className="animate-spin" size={18} />
                                Processing...
                              </>
                            ) : (
                              <>
                                <FiCheckCircle size={18} />
                                Approve
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}