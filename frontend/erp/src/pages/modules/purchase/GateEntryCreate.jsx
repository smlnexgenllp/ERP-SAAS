import React, { useEffect, useState } from "react";
import {
  FiPlus,
  FiArrowLeft,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiSave,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

export default function GateEntryCreate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [pos, setPos] = useState([]); // Filtered pending POs
  const [filteredPos, setFilteredPos] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);

  const [poSearch, setPoSearch] = useState("");
  const [expandedPoId, setExpandedPoId] = useState(null);

  const [form, setForm] = useState({
    vehicle_number: "",
    challan_number: "",
  });

  const [receivedQuantities, setReceivedQuantities] = useState({});

  // ── Data Loading ───────────────────────────────────────────────
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, poRes, geRes] = await Promise.all([
        api.get("/auth/current-user/"),
        api.get("/inventory/purchase-orders/"),
        api.get("/inventory/gate-entries/"),
      ]);

      // Filter only approved POs with remaining quantity > 0
      const eligiblePOs = poRes.data
        .filter((po) => po.status?.toLowerCase() === "approved")
        .filter((po) => {
          const totalOrdered = po.items?.reduce(
            (sum, i) => sum + Number(i.ordered_qty || i.quantity || 0),
            0
          ) || 0;

          const totalReceived = geRes.data
            .filter((ge) => Number(ge.po?.id) === Number(po.id))
            .reduce((sum, ge) => {
              return (
                sum +
                (ge.items?.reduce((s, i) => s + Number(i.delivered_qty || 0), 0) || 0)
              );
            }, 0);

          return totalOrdered - totalReceived > 0;
        });

      setPos(eligiblePOs);
      setFilteredPos(eligiblePOs);
      setGateEntries(geRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load required data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    const term = poSearch.toLowerCase().trim();
    setFilteredPos(
      pos.filter(
        (po) =>
          po.po_number?.toLowerCase().includes(term) ||
          po.vendor?.name?.toLowerCase().includes(term)
      )
    );
  }, [poSearch, pos]);

  // ── Form Handlers ──────────────────────────────────────────────
  const toggleExpand = (poId) => {
    if (expandedPoId === poId) {
      setExpandedPoId(null);
      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
    } else {
      setExpandedPoId(poId);
      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
    }
  };

  const handleQtyChange = (itemId, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setReceivedQuantities((prev) => ({ ...prev, [itemId]: num }));
  };

  const calculateRemaining = (po) => {
    const totalOrdered =
      po.items?.reduce(
        (sum, i) => sum + Number(i.ordered_qty || i.quantity || 0),
        0
      ) || 0;

    const totalReceived = gateEntries
      .filter((ge) => Number(ge.po?.id) === Number(po.id))
      .reduce((sum, ge) => {
        return (
          sum +
          (ge.items?.reduce((s, i) => s + Number(i.delivered_qty || 0), 0) || 0)
        );
      }, 0);

    return Math.max(0, totalOrdered - totalReceived);
  };

  const validateForm = (po) => {
    if (!form.vehicle_number.trim()) return "Vehicle number is required";
    if (!form.challan_number.trim()) return "DC/Challan number is required";

    const items = po.items || [];
    for (const item of items) {
      const itemId = Number(item.item?.id || item.item);
      const received = Number(receivedQuantities[itemId] || 0);
      const maxAllowed = Number(item.ordered_qty || item.quantity || 0);

      if (received > maxAllowed) {
        return `Received qty for ${item.item?.name || "item"} exceeds ordered qty`;
      }
    }
    return null;
  };

  const handleSubmit = async (po) => {
    const validationError = validateForm(po);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (
      !window.confirm(`Confirm creating Gate Entry for PO ${po.po_number}?`)
    ) {
      return;
    }

    setSubmitting(true);

    const itemsPayload = (po.items || []).map((item) => {
      const itemId = Number(item.item?.id || item.item);
      const delivered = Number(
        receivedQuantities[itemId] ||
          item.ordered_qty ||
          item.quantity ||
          0
      );
      return {
        item: itemId,
        delivered_qty: delivered,
      };
    }).filter((i) => i.delivered_qty > 0);

    const payload = {
      po: po.id,
      vehicle_number: form.vehicle_number.trim().toUpperCase(),
      challan_number: form.challan_number.trim(),
      items: itemsPayload,
    };

    try {
      const response = await api.post("/inventory/gate-entries/", payload);

      setGateEntries((prev) => [...prev, response.data]);

      alert("Gate Entry recorded successfully!");

      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
      setExpandedPoId(null);

      // Refresh data
      setTimeout(() => loadAllData(), 1200);
    } catch (err) {
      console.error("Gate Entry creation failed:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to create Gate Entry";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render Helpers ─────────────────────────────────────────────
  const getGateEntryStatus = (poId) => {
    const ge = gateEntries.find((g) => Number(g.po?.id) === Number(poId));
    return ge ? { created: true, number: ge.gate_entry_number } : { created: false };
  };

  if (loading && !pos.length) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-xl animate-pulse">
          Loading Gate Entry Module...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <FiArrowLeft size={20} /> Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-cyan-300">
              Gate Entry
            </h1>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-8 p-4 bg-gray-800/50 border border-cyan-900/40 rounded-lg text-cyan-300/90">
          <div className="flex items-start gap-3">
            <FiInfo size={18} className="text-cyan-400 mt-0.5" />
            <div>
              <p className="font-medium">Only POs with pending quantity are shown</p>
              <p className="text-sm mt-1">
                Once all quantities are fully received, the PO will automatically disappear from this list.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 flex items-center gap-3">
            <FiAlertTriangle size={20} /> {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gray-900/90 border border-cyan-900/60 rounded-xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-cyan-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-semibold text-cyan-300">
              Approved Purchase Orders – Pending Receipt
            </h2>

            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search PO number or Vendor..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-cyan-600 transition-colors"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredPos.length === 0 ? (
              <div className="text-center py-16 text-gray-400 italic">
                {poSearch
                  ? "No matching purchase orders with pending quantity"
                  : "No purchase orders with pending quantity at this time"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-800/70">
                    <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 text-left w-12"></th>
                      <th className="px-6 py-4 text-left">PO Number</th>
                      <th className="px-6 py-4 text-left">Vendor</th>
                      <th className="px-6 py-4 text-right">Total Amount</th>
                      <th className="px-6 py-4 text-center">Ordered / Remaining</th>
                      <th className="px-6 py-4 text-center">Gate Entry</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-cyan-900/40">
                    {filteredPos.map((po) => {
                      const geStatus = getGateEntryStatus(po.id);
                      const totalOrdered =
                        po.items?.reduce(
                          (sum, i) => sum + Number(i.ordered_qty || i.quantity || 0),
                          0
                        ) || 0;
                      const remaining = calculateRemaining(po);

                      // Safety check (shouldn't happen with filter)
                      if (remaining <= 0) return null;

                      return (
                        <React.Fragment key={po.id}>
                          <tr
                            onClick={() => !geStatus.created && toggleExpand(po.id)}
                            className={`cursor-pointer transition-colors ${
                              remaining === 0
                                ? "opacity-60 bg-gray-800/20"
                                : "hover:bg-gray-800/50"
                            } ${submitting ? "pointer-events-none" : ""}`}
                          >
                            <td className="px-6 py-5 text-center">
                              {geStatus.created ? null : expandedPoId === po.id ? (
                                <FiChevronUp />
                              ) : (
                                <FiChevronDown />
                              )}
                            </td>
                            <td className="px-6 py-5 font-medium">{po.po_number}</td>
                            <td className="px-6 py-5">{po.vendor?.name || "—"}</td>
                            <td className="px-6 py-5 text-right font-medium">
                              ₹ {(Number(po.total_amount) || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-5 text-center font-medium">
                              {totalOrdered} / <span className="text-yellow-300">{remaining}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              {geStatus.created ? (
                                <span className="text-green-400 font-medium">
                                  {geStatus.number}
                                </span>
                              ) : (
                                "Pending"
                              )}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  remaining > 0
                                    ? "bg-yellow-900/50 text-yellow-300"
                                    : "bg-green-900/50 text-green-300"
                                }`}
                              >
                                {remaining > 0 ? "Pending Receipt" : "Completed"}
                              </span>
                            </td>
                          </tr>

                          {expandedPoId === po.id && (
                            <tr className="bg-gray-900/70">
                              <td colSpan={7} className="p-6">
                                <div className="space-y-8">
                                  {/* Warning Banner */}
                                  <div className="bg-gray-800/50 border border-cyan-900/40 rounded-lg p-5">
                                    <div className="flex items-center gap-3 text-yellow-300 mb-3">
                                      <FiAlertTriangle size={18} />
                                      <span className="font-medium">Important Note</span>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                      Enter actual delivered quantities. Partial receipts are allowed.
                                      Remaining quantity will be updated automatically.
                                    </p>
                                  </div>

                                  {/* Items Table */}
                                  <div>
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-4">
                                      Items – Enter Delivered Quantity
                                    </h3>
                                    <div className="overflow-x-auto rounded-lg border border-cyan-900/40">
                                      <table className="w-full">
                                        <thead className="bg-gray-800/70">
                                          <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                                            <th className="px-6 py-4 text-left">Item Code & Name</th>
                                            <th className="px-6 py-4 text-center">Ordered</th>
                                            <th className="px-6 py-4 text-center">Delivered</th>
                                            <th className="px-6 py-4 text-right">Unit Price</th>
                                            <th className="px-6 py-4 text-right">Delivered Value</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-cyan-900/30">
                                          {(po.items || []).map((item, idx) => {
                                            const itemId = Number(item.item?.id || item.item);
                                            const ordered = Number(item.ordered_qty || item.quantity || 0);
                                            const price = Number(item.unit_price || item.standard_price || 0);
                                            const delivered = receivedQuantities[itemId] ?? "";

                                            return (
                                              <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                  <div className="font-medium">{item.item?.code || "—"}</div>
                                                  <div className="text-gray-400 text-sm">{item.item?.name || "—"}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium">{ordered}</td>
                                                <td className="px-6 py-4">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max={ordered}
                                                    step="1"
                                                    value={delivered}
                                                    onChange={(e) => handleQtyChange(itemId, e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center focus:outline-none focus:border-cyan-600"
                                                    disabled={submitting}
                                                  />
                                                </td>
                                                <td className="px-6 py-4 text-right">₹ {price.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-cyan-200 font-medium">
                                                  ₹ {(Number(delivered) * price).toFixed(2)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Gate Entry Form */}
                                  <div className="bg-gray-800/50 border border-cyan-900/30 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-cyan-300 mb-5">
                                      Gate Entry Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                                          Vehicle Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                          value={form.vehicle_number}
                                          onChange={(e) =>
                                            setForm((prev) => ({
                                              ...prev,
                                              vehicle_number: e.target.value.toUpperCase(),
                                            }))
                                          }
                                          placeholder="TN45AB1234"
                                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 uppercase focus:outline-none focus:border-cyan-600"
                                          disabled={submitting}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                                          DC / Challan Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                          value={form.challan_number}
                                          onChange={(e) =>
                                            setForm((prev) => ({ ...prev, challan_number: e.target.value }))
                                          }
                                          placeholder="Supplier DC / Challan No"
                                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-600"
                                          disabled={submitting}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                      <button
                                        onClick={() => handleSubmit(po)}
                                        disabled={submitting}
                                        className={`flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-green-900/40 ${
                                          submitting ? "opacity-60 cursor-not-allowed" : ""
                                        }`}
                                      >
                                        <FiSave size={18} />
                                        {submitting ? "Processing..." : "Record Gate Entry"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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