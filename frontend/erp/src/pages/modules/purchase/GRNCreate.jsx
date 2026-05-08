import React, { useEffect, useState } from "react";
import { FiClipboard, FiArrowLeft, FiCheckCircle, FiLoader } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

export default function GRNCreate() {
  const navigate = useNavigate();

  const [gateEntries, setGateEntries] = useState([]);
  const [selectedGateEntry, setSelectedGateEntry] = useState(null);
  const [items, setItems] = useState([]);
  const [qcId, setQcId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGateEntriesWithApprovedQC();
  }, []);

  const fetchGateEntriesWithApprovedQC = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/inventory/gate-entries/ready-for-grn/");
      setGateEntries(res.data || []);
    } catch (err) {
      console.error("Failed to load gate entries:", err);
      setError("Could not load gate entries ready for GRN");
    } finally {
      setLoading(false);
    }
  };

  const handleGateEntryChange = async (e) => {
    const geId = e.target.value;

    setSelectedGateEntry(null);
    setItems([]);
    setQcId(null);
    setError(null);

    if (!geId) return;

    try {
      setLoading(true);

      const ge = gateEntries.find((g) => String(g.id) === String(geId));
      if (!ge) {
        setError("Selected gate entry not found");
        return;
      }

      setSelectedGateEntry(ge);

      const qcRes = await api.get(
        `/inventory/quality-inspections/?gate_entry=${ge.id}&is_approved=true&ordering=-inspection_date`
      );

      const latestQC = qcRes.data?.results?.[0] || qcRes.data?.[0];
      if (!latestQC || !latestQC.items?.length) {
        setError("No approved quality inspection found for this gate entry");
        return;
      }

      setQcId(latestQC.id);

      const poId = ge.po?.id || ge.purchase_order?.id || ge.po;
      if (!poId) {
        setError("No linked Purchase Order found");
        return;
      }

      const poRes = await api.get(`/inventory/purchase-orders/${poId}/`);
      const poItems = poRes.data?.items || [];

      const priceMap = {};
      poItems.forEach((poItem) => {
        const itemId = Number(poItem.item_details?.id || poItem.item_id || poItem.item);
        if (itemId) {
          priceMap[itemId] = Number(poItem.unit_price || poItem.rate || poItem.standard_price || 0);
        }
      });

      const mappedItems = latestQC.items
        .map((qcItem) => {
          const itemId = Number(qcItem.item_id);
          if (!itemId || isNaN(itemId) || itemId < 1) return null;

          return {
            item: itemId,
            name: qcItem.item_name || qcItem.item_code || `Item #${itemId}`,
            accepted_qty: Number(qcItem.accepted_qty || 0),
            received_qty: Number(qcItem.accepted_qty || 0),
            unit_price: priceMap[itemId] || 0,
          };
        })
        .filter(Boolean);

      setItems(mappedItems);
    } catch (err) {
      console.error("Error loading GRN data:", err);
      setError(err.response?.data?.detail || "Failed to load QC / PO / items");
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + (Number(item.received_qty || 0) * Number(item.unit_price || 0)),
    0
  );

  const saveGRN = async () => {
    if (!selectedGateEntry?.id) {
      alert("No Gate Entry selected");
      return;
    }

    if (items.length === 0) {
      alert("No items available to create GRN");
      return;
    }

    const invalid = items.filter(i => {
      const qty = Number(i.received_qty);
      return isNaN(qty) || qty <= 0 || qty > Number(i.accepted_qty);
    });

    if (invalid.length > 0) {
      alert("Invalid received quantity detected");
      return;
    }

    try {
      const qcCheck = await api.get(
        `/inventory/quality-inspections/?gate_entry=${selectedGateEntry.id}&is_approved=true`
      );

      const qc = qcCheck.data?.results?.[0] || qcCheck.data?.[0];

      if (!qc || !qc.is_approved) {
        alert("QC not approved");
        return;
      }

      const payload = {
        gate_entry: Number(selectedGateEntry.id),
        items: items.map(i => ({
          item: Number(i.item),
          received_qty: Number(i.received_qty),
        })),
      };

      const response = await api.post("/inventory/grns/", payload);

      alert(`GRN Created Successfully: ${response.data?.grn_number}`);
      navigate("/inventory/grns");

    } catch (err) {
      console.error("GRN ERROR:", err.response?.data || err);
      alert(err.response?.data?.detail || "GRN creation failed");
    }
  };

  const getPONumber = (ge) => {
    if (!ge) return "—";
    return ge.po?.po_number || ge.purchase_order?.po_number || (typeof ge.po === "number" ? `PO #${ge.po}` : "—");
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
                <FiClipboard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Create GRN</h1>
                <p className="text-zinc-500">Goods Receipt Note from Approved QC</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gate Entry Selector */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-8 shadow-sm">
          <label className="block text-lg font-semibold text-zinc-900 mb-4">
            Select Gate Entry with Approved QC
          </label>

          {loading && (
            <div className="flex items-center gap-3 text-zinc-500 py-6">
              <FiLoader className="animate-spin" size={24} /> Loading Gate Entries...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl mb-6">
              {error}
            </div>
          )}

          {!loading && (
            <select
              onChange={handleGateEntryChange}
              className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-zinc-400 text-zinc-800"
            >
              <option value="">-- Select Gate Entry --</option>
              {gateEntries.map((ge) => (
                <option key={ge.id} value={ge.id}>
                  {ge.gate_entry_number} • PO: {getPONumber(ge)} • Vehicle: {ge.vehicle_number || "—"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-100">
              <h2 className="text-2xl font-semibold text-zinc-900">GRN Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left font-semibold text-zinc-600">Item</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Accepted (QC)</th>
                    <th className="px-8 py-5 text-center font-semibold text-zinc-600">Received</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Rate</th>
                    <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="px-8 py-6">
                        <div className="font-medium">{item.name}</div>
                      </td>
                      <td className="px-8 py-6 text-center font-medium">{item.accepted_qty}</td>
                      <td className="px-8 py-6 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.accepted_qty}
                          step="0.01"
                          value={item.received_qty}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") val = "";
                            else val = Math.max(0, Math.min(Number(val), item.accepted_qty));
                            setItems(prev =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, received_qty: val } : it
                              )
                            );
                          }}
                          className="w-28 mx-auto border border-zinc-200 rounded-2xl px-4 py-2.5 text-center focus:border-zinc-400"
                        />
                      </td>
                      <td className="px-8 py-6 text-right">₹ {formatCurrency(item.unit_price)}</td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {formatCurrency(Number(item.received_qty) * Number(item.unit_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-50">
                  <tr>
                    <td colSpan="4" className="px-8 py-6 text-right text-lg font-semibold">Grand Total</td>
                    <td className="px-8 py-6 text-right text-2xl font-bold text-zinc-900">
                      ₹ {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-8 border-t border-zinc-100 flex justify-end">
              <button
                onClick={saveGRN}
                disabled={loading}
                className={`px-10 py-4 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                  loading
                    ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                <FiCheckCircle size={20} />
                {loading ? "Creating GRN..." : "Create GRN"}
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !loading && selectedGateEntry && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center text-zinc-500">
            No valid accepted items found in the latest approved quality inspection
          </div>
        )}
      </div>
    </div>
  );
}