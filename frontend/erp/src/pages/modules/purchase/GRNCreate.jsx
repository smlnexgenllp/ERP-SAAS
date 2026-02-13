import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { FiClipboard, FiArrowLeft, FiCheckCircle, FiLoader } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

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
      console.log("Loaded gate entries ready for GRN:", res.data?.length || 0);
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

      // Get latest approved QC
      const qcRes = await api.get(
        `/inventory/quality-inspections/?gate_entry=${ge.id}&is_approved=true&ordering=-inspection_date`
      );

      const latestQC = qcRes.data?.results?.[0] || qcRes.data?.[0];
      if (!latestQC || !latestQC.items?.length) {
        setError("No approved quality inspection found for this gate entry");
        return;
      }

      setQcId(latestQC.id);

      // Log QC items structure for debugging
      console.log("Latest QC items structure:", 
        latestQC.items.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          accepted_qty: item.accepted_qty,
          rejected_qty: item.rejected_qty
        }))
      );

      // Get PO for unit prices
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

      // Map QC items → use item_id !!!
      const mappedItems = latestQC.items
        .map((qcItem) => {
          const itemId = Number(qcItem.item_id);

          if (!itemId || isNaN(itemId) || itemId < 1) {
            console.warn("Skipping QC item - missing/invalid item_id:", qcItem);
            return null;
          }

          return {
            item: itemId,
            name: qcItem.item_name || qcItem.item_code || `Item #${itemId}`,
            accepted_qty: Number(qcItem.accepted_qty || 0),
            received_qty: Number(qcItem.accepted_qty || 0),
            unit_price: priceMap[itemId] || 0,
          };
        })
        .filter(Boolean);

      if (mappedItems.length === 0) {
        setError("No valid accepted items found in the latest approved QC");
        return;
      }

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
    if (!qcId || isNaN(Number(qcId))) {
      alert("No valid Quality Inspection selected");
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
      alert("Some items have invalid received quantity (must be > 0 and ≤ accepted qty)");
      return;
    }

    try {
      // Verify QC is still approved
      const qcCheck = await api.get(`/inventory/quality-inspections/${qcId}/`);
      if (!qcCheck.data?.is_approved) {
        alert("Cannot create GRN — Quality Inspection is no longer approved");
        return;
      }

      const grnItems = items.map((i) => ({
        item: Number(i.item),
        received_qty: Number(i.received_qty),
      }));

      const payload = {
        quality_inspection: Number(qcId),
        items: grnItems,
        // If backend requires these fields → uncomment and adjust
        // received_date: new Date().toISOString().split("T")[0],
        // gate_entry: Number(selectedGateEntry?.id),
      };

      console.log("=== GRN PAYLOAD BEING SENT ===");
      console.log(JSON.stringify(payload, null, 2));

      const response = await api.post("/inventory/grns/", payload);

      alert(`GRN created successfully!\nGRN Number: ${response.data?.grn_number || "—"}`);
      navigate("/inventory/grns");
    } catch (err) {
      console.error("=== GRN CREATION FAILED ===");
      console.error("Status:", err.response?.status);
      console.error("Error response:", err.response?.data);
      console.error("Full error:", err);

      let errorMsg = "Failed to create GRN";

      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) errorMsg += `\n${data.detail}`;
        if (data.non_field_errors) errorMsg += `\n${data.non_field_errors.join("\n")}`;
        if (data.items) errorMsg += `\nItems errors:\n${JSON.stringify(data.items, null, 2)}`;

        Object.entries(data).forEach(([key, value]) => {
          if (!["detail", "non_field_errors", "items"].includes(key)) {
            const msg = Array.isArray(value) ? value.join(" • ") : value;
            errorMsg += `\n${key}: ${msg}`;
          }
        });
      } else {
        errorMsg += `: ${err.message || "Network/server error"}`;
      }

      alert(errorMsg);
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft size={20} /> Back
          </button>

          <h1 className="text-3xl font-bold flex items-center gap-3 text-cyan-300">
            <FiClipboard size={28} /> Create GRN from Approved QC
          </h1>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
          <label className="block mb-3 text-lg font-medium text-cyan-300">
            Select Gate Entry with Approved QC
          </label>

          {loading && (
            <div className="flex items-center gap-3 text-cyan-400 py-4">
              <FiLoader className="animate-spin" size={24} /> Loading...
            </div>
          )}

          {error && <p className="text-red-400 mb-4 font-medium">{error}</p>}

          {!loading && !error && (
            <select
              onChange={handleGateEntryChange}
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-cyan-500 transition"
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

        {items.length > 0 && (
          <div>
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 mb-8">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-4 text-left font-semibold">Item</th>
                    <th className="p-4 text-center font-semibold">Accepted (QC)</th>
                    <th className="p-4 text-center font-semibold">Received</th>
                    <th className="p-4 text-right font-semibold">Rate</th>
                    <th className="p-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-center">{item.accepted_qty}</td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.accepted_qty}
                          step="0.01"
                          value={item.received_qty}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === "") {
                              val = "";
                            } else {
                              val = Math.max(0, Math.min(Number(val), item.accepted_qty));
                            }
                            setItems(prev =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, received_qty: val } : it
                              )
                            );
                          }}
                          className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center focus:outline-none focus:border-cyan-500"
                        />
                      </td>
                      <td className="p-4 text-right">₹ {formatCurrency(item.unit_price)}</td>
                      <td className="p-4 text-right text-cyan-300 font-medium">
                        ₹ {formatCurrency(Number(item.received_qty) * Number(item.unit_price))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-800 font-bold">
                  <tr>
                    <td colSpan="4" className="p-4 text-right text-gray-300">Grand Total</td>
                    <td className="p-4 text-right text-cyan-400">₹ {formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveGRN}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  loading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30"
                }`}
              >
                <FiCheckCircle size={18} />
                {loading ? "Creating..." : "Create GRN"}
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !loading && selectedGateEntry && (
          <div className="text-center py-16 text-gray-400 italic bg-gray-900 rounded-xl border border-gray-800">
            No valid accepted items found in the latest approved quality inspection
          </div>
        )}
      </div>
    </div>
  );
}