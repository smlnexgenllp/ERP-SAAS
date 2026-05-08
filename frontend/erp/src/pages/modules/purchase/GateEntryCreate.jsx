import React, { useEffect, useState } from "react";
import {
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
  const [serverErrors, setServerErrors] = useState({});

  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);

  const [poSearch, setPoSearch] = useState("");
  const [expandedPoId, setExpandedPoId] = useState(null);

  const [form, setForm] = useState({
    vehicle_number: "",
    challan_number: "",
  });

  const [receivedQuantities, setReceivedQuantities] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    setServerErrors({});
    try {
      const [userRes, poRes, geRes] = await Promise.all([
        api.get("/auth/current-user/"),
        api.get("/inventory/purchase-orders/"),
        api.get("/inventory/gate-entries/"),
      ]);

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

  useEffect(() => {
    const term = poSearch.toLowerCase().trim();
    setFilteredPos(
      pos.filter(
        (po) =>
          po.po_number?.toLowerCase().includes(term) ||
          po.vendor_details?.name?.toLowerCase().includes(term) ||
          po.vendor?.name?.toLowerCase().includes(term)
      )
    );
  }, [poSearch, pos]);

  const getItemId = (itemData) => {
    if (!itemData) return null;
    const realItemId = Number(itemData?.item_details?.id);
    if (!isNaN(realItemId) && realItemId > 0) return realItemId;

    const fallbacks = [
      itemData?.item?.id,
      itemData?.item,
      itemData?.item_id,
      itemData?.id,
    ];

    for (const val of fallbacks) {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  };

  const getItemName = (itemData) => {
    return (
      itemData?.item_details?.name ||
      itemData?.item?.name ||
      itemData?.item_name ||
      itemData?.name ||
      "Unknown Item"
    );
  };

  const getItemCode = (itemData) => {
    return (
      itemData?.item_details?.code ||
      itemData?.item?.code ||
      itemData?.item_code ||
      itemData?.code ||
      "—"
    );
  };

  const toggleExpand = (poId) => {
    if (expandedPoId === poId) {
      setExpandedPoId(null);
      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
      setServerErrors({});
    } else {
      setExpandedPoId(poId);
      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
      setServerErrors({});
    }
  };

  const handleQtyChange = (itemId, value, maxAllowed = 0) => {
    if (value === "") {
      setReceivedQuantities((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      return;
    }

    let num = Math.max(0, Number(value));
    if (maxAllowed > 0) {
      num = Math.min(num, maxAllowed);
    }

    setReceivedQuantities((prev) => ({ ...prev, [itemId]: num }));
  };

  const validateForm = (po) => {
    if (!form.vehicle_number.trim()) return "Vehicle number is required";
    if (!form.challan_number.trim()) return "DC/Challan number is required";

    let hasQty = false;
    for (const item of po.items || []) {
      const itemId = getItemId(item);
      if (!itemId) continue;

      const qty = Number(receivedQuantities[itemId] || 0);
      const maxQty = Number(item.ordered_qty || item.quantity || 0);

      if (qty > 0) hasQty = true;
      if (qty > maxQty) return `Qty for item ${itemId} exceeds ordered (${maxQty})`;
    }

    if (!hasQty) return "Enter delivered quantity for at least one item";
    return null;
  };

  const handleSubmit = async (po) => {
    setServerErrors({});

    const validationError = validateForm(po);
    if (validationError) {
      alert(validationError);
      return;
    }

    if (!window.confirm(`Create Gate Entry for ${po.po_number}?`)) return;

    setSubmitting(true);

    const itemsPayload = po.items
      .map((poItem, index) => {
        let itemId = Number(poItem?.item_details?.id);
        if (!itemId || isNaN(itemId)) {
          itemId = Number(poItem?.item?.id || poItem?.item_id || poItem?.id);
        }
        if (!itemId || isNaN(itemId) || itemId < 1) return null;

        const qty = Number(receivedQuantities[itemId] || 0);
        if (qty <= 0) return null;

        return { item: itemId, delivered_qty: qty };
      })
      .filter(Boolean);

    const payload = {
      po: po.id,
      vehicle_number: form.vehicle_number.trim().toUpperCase(),
      challan_number: form.challan_number.trim(),
      items: itemsPayload,
    };

    try {
      const response = await api.post("/inventory/gate-entries/", payload);
      setGateEntries((prev) => [...prev, response.data]);
      alert("Gate Entry created successfully!");
      setForm({ vehicle_number: "", challan_number: "" });
      setReceivedQuantities({});
      setExpandedPoId(null);
      setServerErrors({});
      setTimeout(loadAllData, 800);
    } catch (err) {
      console.error("Creation failed:", err);
      let msg = "Failed to create Gate Entry";

      if (err.response?.status === 400 && err.response?.data) {
        const data = err.response.data;
        setServerErrors(data);
        if (data.items?.[0]?.item) {
          msg = `Item error: ${data.items[0].item.join(" | ")}`;
        } else if (data.items) {
          msg = "Items validation failed:\n" +
            data.items.map((errObj, i) => `Item ${i + 1}: ${Object.values(errObj).flat().join(" | ")}`).join("\n");
        } else if (data.non_field_errors) {
          msg = data.non_field_errors.join("\n");
        } else {
          msg = JSON.stringify(data, null, 2);
        }
      } else {
        msg = err.message || "Server error";
      }
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getGateEntryStatus = (poId) => {
    const ge = gateEntries.find((g) => Number(g.po?.id) === Number(poId));
    return ge ? { created: true, number: ge.gate_entry_number } : { created: false };
  };

  if (loading && !pos.length) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6">Loading Gate Entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiInfo className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Gate Entry</h1>
                <p className="text-zinc-500">Record material receipt against approved Purchase Orders</p>
              </div>
            </div>
          </div>

          <button
            onClick={loadAllData}
            disabled={loading || submitting}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex gap-4">
          <FiAlertTriangle className="text-amber-600 mt-1 flex-shrink-0" size={24} />
          <div>
            <p className="font-medium text-amber-700">Important Note</p>
            <p className="text-sm text-zinc-600 mt-1">
              Only enter delivered quantity for items shown in the table.<br />
              Item code should match real Item (not PO line ID).
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-200 text-red-700 rounded-3xl flex items-center gap-3">
            <FiAlertTriangle size={24} /> {error}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Approved Purchase Orders – Pending Receipt
            </h2>

            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search PO number or Vendor..."
                value={poSearch}
                onChange={(e) => setPoSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-3.5 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="p-6">
            {filteredPos.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                No matching POs with pending quantity
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-6 py-5 text-left w-12"></th>
                      <th className="px-6 py-5 text-left font-semibold text-zinc-600">PO Number</th>
                      <th className="px-6 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                      <th className="px-6 py-5 text-right font-semibold text-zinc-600">Total Amount</th>
                      <th className="px-6 py-5 text-center font-semibold text-zinc-600">Ordered / Remaining</th>
                      <th className="px-6 py-5 text-center font-semibold text-zinc-600">Gate Entry</th>
                      <th className="px-6 py-5 text-center font-semibold text-zinc-600">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {filteredPos.map((po) => {
                      const geStatus = getGateEntryStatus(po.id);
                      const totalOrdered = po.items?.reduce((sum, i) => sum + Number(i.ordered_qty || i.quantity || 0), 0) || 0;
                      const remaining = totalOrdered - gateEntries
                        .filter((ge) => Number(ge.po?.id) === Number(po.id))
                        .reduce((sum, ge) => sum + (ge.items?.reduce((s, i) => s + Number(i.delivered_qty || 0), 0) || 0), 0);

                      if (remaining <= 0) return null;

                      return (
                        <React.Fragment key={po.id}>
                          <tr
                            onClick={() => !geStatus.created && toggleExpand(po.id)}
                            className={`cursor-pointer hover:bg-zinc-50 transition-colors ${expandedPoId === po.id ? "bg-zinc-50" : ""}`}
                          >
                            <td className="px-6 py-5 text-center">
                              {geStatus.created ? null : expandedPoId === po.id ? <FiChevronUp /> : <FiChevronDown />}
                            </td>
                            <td className="px-6 py-5 font-medium text-zinc-900">{po.po_number}</td>
                            <td className="px-6 py-5">{po.vendor_details?.name || po.vendor?.name || "—"}</td>
                            <td className="px-6 py-5 text-right font-semibold">₹ {(Number(po.total_amount) || 0).toFixed(2)}</td>
                            <td className="px-6 py-5 text-center font-medium">
                              {totalOrdered} / <span className="text-amber-600">{remaining}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              {geStatus.created ? (
                                <span className="text-emerald-600 font-medium">{geStatus.number}</span>
                              ) : (
                                "Pending"
                              )}
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`inline-block px-4 py-1.5 rounded-2xl text-xs font-medium ${remaining > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {remaining > 0 ? "Pending Receipt" : "Completed"}
                              </span>
                            </td>
                          </tr>

                          {/* Expanded Section - Original logic preserved */}
                          {expandedPoId === po.id && (
                            <tr className="bg-zinc-50">
                              <td colSpan={7} className="p-8">
                                <div className="space-y-8">
                                  <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
                                    <div className="flex items-center gap-3 text-amber-700 mb-3">
                                      <FiAlertTriangle size={18} />
                                      <span className="font-medium">Note</span>
                                    </div>
                                    <p className="text-zinc-600 text-sm">
                                      Enter delivered quantity only for listed items.<br />
                                      Item code should match real Item ID (not PO line ID).
                                    </p>
                                  </div>

                                  {Object.keys(serverErrors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-3xl p-5 text-red-700 text-sm whitespace-pre-wrap">
                                      <strong>Backend Error:</strong><br />
                                      {JSON.stringify(serverErrors, null, 2)}
                                    </div>
                                  )}

                                  {/* Items Table */}
                                  <div>
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-4">Items – Enter Delivered Quantity</h3>
                                    <div className="overflow-x-auto border border-zinc-200 rounded-3xl">
                                      <table className="w-full">
                                        <thead className="bg-zinc-50">
                                          <tr>
                                            <th className="px-6 py-4 text-left">Item Code & Name</th>
                                            <th className="px-6 py-4 text-center">Ordered</th>
                                            <th className="px-6 py-4 text-center">Delivered</th>
                                            <th className="px-6 py-4 text-right">Unit Price</th>
                                            <th className="px-6 py-4 text-right">Delivered Value</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                          {(po.items || []).map((item, idx) => {
                                            const itemId = getItemId(item);
                                            if (!itemId) return null;

                                            const name = getItemName(item);
                                            const code = getItemCode(item);
                                            const ordered = Number(item.ordered_qty || item.quantity || 0);
                                            const price = Number(item.unit_price || item.standard_price || item.price || 0);
                                            const delivered = receivedQuantities[itemId] ?? "";
                                            const isOver = Number(delivered) > ordered && Number(delivered) > 0;

                                            return (
                                              <tr key={idx} className="hover:bg-zinc-50">
                                                <td className="px-6 py-4">
                                                  <div className="font-medium">{code}</div>
                                                  <div className="text-zinc-500 text-sm">{name}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium">{ordered}</td>
                                                <td className="px-6 py-4">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max={ordered}
                                                    step="0.01"
                                                    value={delivered}
                                                    onChange={(e) => handleQtyChange(itemId, e.target.value, ordered)}
                                                    className={`w-full border rounded-2xl px-4 py-3 text-center focus:outline-none focus:border-zinc-400 ${isOver ? "border-red-500" : "border-zinc-200"}`}
                                                    disabled={submitting}
                                                  />
                                                </td>
                                                <td className="px-6 py-4 text-right">₹ {price.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-medium">₹ {(Number(delivered || 0) * price).toFixed(2)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Gate Entry Details */}
                                  <div className="bg-white border border-zinc-200 rounded-3xl p-6">
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-5">Gate Entry Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label className="block text-sm font-medium text-zinc-600 mb-2">
                                          Vehicle Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={form.vehicle_number}
                                          onChange={(e) => setForm((prev) => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
                                          placeholder="TN45AB1234"
                                          className="w-full border border-zinc-200 rounded-2xl px-5 py-3.5 uppercase focus:outline-none focus:border-zinc-400"
                                          disabled={submitting}
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-zinc-600 mb-2">
                                          DC / Challan Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          value={form.challan_number}
                                          onChange={(e) => setForm((prev) => ({ ...prev, challan_number: e.target.value }))}
                                          placeholder="Supplier DC / Challan No"
                                          className="w-full border border-zinc-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-zinc-400"
                                          disabled={submitting}
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                      <button
                                        onClick={() => handleSubmit(po)}
                                        disabled={submitting}
                                        className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-medium transition-all ${
                                          submitting
                                            ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                                            : "bg-zinc-900 hover:bg-zinc-800 text-white"
                                        }`}
                                      >
                                        <FiSave size={20} />
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