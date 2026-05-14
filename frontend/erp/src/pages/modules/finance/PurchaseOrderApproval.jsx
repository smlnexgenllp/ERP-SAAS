import React, { useEffect, useState } from "react";
import { FiCheck, FiX, FiRefreshCw, FiChevronDown, FiChevronUp, FiInfo, FiArrowLeft } from "react-icons/fi";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function PurchaseOrderApproval() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [pos, setPos] = useState([]); 
  const [pendingPos, setPendingPos] = useState([]); 
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/inventory/purchase-orders/");
      setPos(res.data);

      const pending = res.data.filter(po => 
        po.status?.toLowerCase() === "draft"
      );
      setPendingPos(pending);
    } catch (err) {
      console.error("Failed to load POs:", err);
      setError("Failed to load purchase orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApprove = async (po) => {
    if (!window.confirm(`Approve Purchase Order ${po.po_number}? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/inventory/purchase-orders/${po.id}/approve/`);
      alert(`PO ${po.po_number} approved successfully!`);

      setPendingPos(prev => prev.filter(p => p.id !== po.id));
      setPos(prev => prev.map(p => 
        p.id === po.id ? { ...p, status: "approved" } : p
      ));
    } catch (err) {
      console.error("Approval failed:", err);
      alert(err.response?.data?.detail || "Failed to approve PO");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (po) => {
    const reason = window.prompt(`Reject Purchase Order ${po.po_number}?\nPlease provide a reason:`);
    if (!reason?.trim()) return;

    setSubmitting(true);

    try {
      await api.post(`/inventory/purchase-orders/${po.id}/reject/`, { reason });
      alert(`PO ${po.po_number} rejected.`);

      setPendingPos(prev => prev.filter(p => p.id !== po.id));
      setPos(prev => prev.map(p => 
        p.id === po.id ? { ...p, status: "cancelled" } : p
      ));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reject PO");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    });
  };

  // Back Button Handler
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading && !pos.length) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-xl animate-pulse">Loading Purchase Orders for Approval...</div>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-zinc-100 text-zinc-800">
   <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">

  {/* HEADER */}
  <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-slate-800">
        Purchase Order Approvals
      </h1>

      <p className="text-slate-500 mt-1">
        Review and manage pending purchase orders
      </p>
    </div>
    <div className="px-5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
      {pendingPos.length} Pending
    </div>
  </div>
  {/* TABLE */}
  <div className="overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr className="text-sm text-slate-600">
          <th className="px-6 py-5 text-left font-semibold">PO Number</th>
          <th className="px-6 py-5 text-left font-semibold">Vendor</th>
          <th className="px-6 py-5 text-left font-semibold">Department</th>
          <th className="px-6 py-5 text-left font-semibold">Items</th>
          <th className="px-6 py-5 text-right font-semibold">Amount</th>
          <th className="px-6 py-5 text-center font-semibold">Created By</th>
          <th className="px-6 py-5 text-center font-semibold">Date</th>
          <th className="px-6 py-5 text-center font-semibold">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {pendingPos.map((po) => (
          <tr
            key={po.id}
            className="hover:bg-slate-50 transition-all duration-200"
          >
            {/* PO NUMBER */}
            <td className="px-6 py-6">
              <div className="font-bold text-blue-600 text-[15px]">
                {po.po_number || "N/A"}
              </div>
            </td>

            {/* VENDOR */}
            <td className="px-6 py-6">
              <div className="font-medium text-slate-700">
                {po.vendor?.name || "No Vendor"}
              </div>
            </td>

            {/* DEPARTMENT */}
            <td className="px-6 py-6">
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
                {po.department || "Inventory"}
              </span>
            </td>

            {/* ITEMS */}
            <td className="px-6 py-6">
              <div className="space-y-3">
                {(po.items || []).slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="min-w-[240px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-700 text-sm">
                          {item.item?.name || "Unknown Item"}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Qty : {item.quantity || item.ordered_qty || 0}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-slate-600">
                        ₹ {Number(item.unit_price || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}

                {po.items?.length > 2 && (
                  <div className="text-xs text-slate-500">
                    +{po.items.length - 2} more items
                  </div>
                )}
              </div>
            </td>

            {/* AMOUNT */}
            <td className="px-6 py-6 text-right">
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(po.total_amount)}
              </div>
            </td>

            {/* CREATED BY */}
            <td className="px-6 py-6">
              <div className="flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                  {po.created_by?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  {po.created_by?.username || "Unknown"}
                </p>
              </div>
            </td>

            {/* DATE */}
            <td className="px-6 py-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                {new Date(po.created_at).toLocaleDateString()}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {new Date(po.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </td>
            <td className="px-6 py-6">
              <div className="flex flex-col gap-3 items-center">
                <button
                  onClick={() => handleApprove(po)}
                  disabled={submitting}
                  className="w-[110px] h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  onClick={() => handleReject(po)}
                  disabled={submitting}
                  className="w-[110px] h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-semibold transition-all disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* EMPTY STATE */}
    {pendingPos.length === 0 && (
      <div className="py-24 text-center">
        <div className="text-6xl mb-5">📦</div>

        <h2 className="text-2xl font-bold text-slate-700">
          No Pending Purchase Orders
        </h2>

        <p className="text-slate-500 mt-2">
          All purchase orders are already reviewed.
        </p>
      </div>
    )}
  </div>
</div>
  </div>
);
}