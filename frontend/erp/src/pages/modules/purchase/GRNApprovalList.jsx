import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import {
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiArrowLeft,
} from "react-icons/fi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
      setSuccessMsg(
        `GRN ${res.data.grn_number || grnId} approved successfully!`
      );
      setGrns((prev) => prev.filter((g) => g.id !== grnId));
    } catch (err) {
      console.error("GRN approval failed:", err.response?.data || err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] ||
        "Approval failed. Check server logs.";
      setError(errMsg);
    } finally {
      setActionLoading((prev) => ({ ...prev, [grnId]: false }));
    }
  };
  const handleGoBack = () => {
    navigate(-1);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl">
          <FiLoader className="animate-spin" /> Loading data...
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-cyan-300"
            >
              <FiArrowLeft size={22} />
              Back
            </button>

            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiCheckCircle className="text-green-400" />
              Pending GRN Approvals
            </h1>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-cyan-300 border border-gray-700"
          >
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-600 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-900/40 border border-green-600 text-green-200 p-4 rounded-lg mb-6">
            {successMsg}
          </div>
        )}

        {grns.length === 0 ? (
          <div className="bg-gray-900 p-12 rounded-xl text-center text-gray-400 italic">
            No pending GRNs awaiting approval.
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4 text-left">GRN Number</th>
                  <th className="p-4 text-left">Gate Entry</th>
                  <th className="p-4 text-left">PO</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-center">QTY</th>
                  <th className="p-4 text-right">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {grns.map((grn) => {
                  const gate = gateEntries[grn.gate_entry];

                  return (
                    <tr
                      key={grn.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50"
                    >
                      {/* GRN */}
                      <td className="p-4 font-medium">
                        {grn.grn_number}
                      </td>

                      {/* Gate Entry */}
                      <td className="p-4">
                        {gate?.gate_entry_number || "—"}
                      </td>

                      {/* PO */}
                      <td className="p-4">
                        {grn.po_details?.po_number ||
                          gate?.po_details?.po_number ||
                          `PO #${grn.po}`}
                      </td>

                      {/* Items */}
                      <td className="p-4 text-center">
                        {gate?.items?.length > 0 ? (
                          <span
                            title={gate.items
                              .map((i) => i.item_name)
                              .join(", ")}
                          >
                            {gate.items.map((i) => i.item_name).join(", ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="p-4 text-center">
                        {gate?.items
                          ? gate.items.reduce(
                              (sum, i) =>
                                sum +
                                Number(i.delivered_qty || 0),
                              0
                            )
                          : 0}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-right text-gray-400">
                        {grn.received_date
                          ? format(
                              new Date(grn.received_date),
                              "dd MMM yyyy"
                            )
                          : "—"}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleApprove(grn.id)}
                          disabled={actionLoading[grn.id]}
                          className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg ${
                            actionLoading[grn.id]
                              ? "bg-gray-700"
                              : "bg-green-600 hover:bg-green-500"
                          }`}
                        >
                          {actionLoading[grn.id] ? (
                            <>
                              <FiLoader className="animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FiCheckCircle />
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
  );
}