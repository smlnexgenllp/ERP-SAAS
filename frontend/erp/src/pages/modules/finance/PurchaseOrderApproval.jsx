import React, { useEffect, useState } from "react";
import { FiCheck, FiX, FiRefreshCw, FiChevronDown, FiChevronUp, FiInfo } from "react-icons/fi";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function PurchaseOrderApproval() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [pos, setPos] = useState([]); // All POs
  const [pendingPos, setPendingPos] = useState([]); // Filtered draft POs
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

      // Filter only draft/pending for approval
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

      // Update UI optimistically
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

      // Update UI
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

  if (loading && !pos.length) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-xl animate-pulse">Loading Purchase Orders for Approval...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-cyan-300">
              Purchase Order Approval
            </h1>
            <p className="text-cyan-400/70 mt-2">
              Review and approve/reject pending purchase orders
            </p>
          </div>

          <button
            onClick={loadPurchaseOrders}
            disabled={loading || submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh List
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 flex items-center gap-3">
            <FiInfo size={18} /> {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gray-900/90 border border-cyan-900/60 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-cyan-900/50">
            <h2 className="text-xl md:text-2xl font-semibold text-cyan-300">
              Pending Approval ({pendingPos.length})
            </h2>
          </div>

          <div className="p-6">
            {pendingPos.length === 0 ? (
              <div className="text-center py-16 text-cyan-400/60 italic">
                No purchase orders pending approval at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-800/70">
                    <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 text-left w-12"></th>
                      <th className="px-6 py-4 text-left">PO Number</th>
                      <th className="px-6 py-4 text-left">Vendor</th>
                      <th className="px-6 py-4 text-right">Total Amount</th>
                      <th className="px-6 py-4 text-center">Items</th>
                      <th className="px-6 py-4 text-center">Created By</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-cyan-900/40">
                    {pendingPos.map((po) => (
                      <React.Fragment key={po.id}>
                        <tr className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => toggleExpand(po.id)}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              {expandedId === po.id ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </td>
                          <td className="px-6 py-5 font-medium">{po.po_number}</td>
                          <td className="px-6 py-5">{po.vendor?.name || "—"}</td>
                          <td className="px-6 py-5 text-right font-medium">
                            {formatCurrency(po.total_amount)}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {po.items?.length || 0}
                          </td>
                          <td className="px-6 py-5 text-center">
                            {po.created_by?.username || "—"}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleApprove(po)}
                                disabled={submitting}
                                className="p-2 bg-green-900/50 hover:bg-green-800/60 text-green-300 rounded-full transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <FiCheck size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(po)}
                                disabled={submitting}
                                className="p-2 bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded-full transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <FiX size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {expandedId === po.id && (
                          <tr className="bg-gray-900/70">
                            <td colSpan={7} className="p-6">
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="bg-gray-800/50 p-5 rounded-lg border border-cyan-900/30">
                                    <h4 className="text-sm text-cyan-400 mb-2">Department</h4>
                                    <p className="font-medium">{po.department || "—"}</p>
                                  </div>
                                  <div className="bg-gray-800/50 p-5 rounded-lg border border-cyan-900/30">
                                    <h4 className="text-sm text-cyan-400 mb-2">Created By</h4>
                                    <p className="font-medium">
                                      {po.created_by?.username || "—"}
                                      <span className="text-gray-500 text-sm ml-2">
                                        {new Date(po.created_at).toLocaleString()}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="bg-gray-800/50 p-5 rounded-lg border border-cyan-900/30">
                                    <h4 className="text-sm text-cyan-400 mb-2">Total Amount</h4>
                                    <p className="text-xl font-bold text-cyan-200">
                                      {formatCurrency(po.total_amount)}
                                    </p>
                                  </div>
                                </div>

                                {/* Items Table */}
                                <div>
                                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">
                                    Items in this Purchase Order
                                  </h3>
                                  <div className="overflow-x-auto rounded-lg border border-cyan-900/40">
                                    <table className="w-full">
                                      <thead className="bg-gray-800/70">
                                        <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                                          <th className="px-6 py-3 text-left">Item</th>
                                          <th className="px-6 py-3 text-center">Quantity</th>
                                          <th className="px-6 py-3 text-right">Unit Price</th>
                                          <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-cyan-900/30">
                                        {(po.items || []).map((item, idx) => (
                                          <tr key={idx}>
                                            <td className="px-6 py-4">
                                              <div>{item.item?.name || "—"}</div>
                                              <div className="text-xs text-gray-500">
                                                {item.item?.code || "—"}
                                              </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                              {item.quantity || item.ordered_qty || "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                              ₹ {(Number(item.unit_price) || 0).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-cyan-200">
                                              ₹ {((item.quantity || item.ordered_qty || 0) * (item.unit_price || 0)).toFixed(2)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}