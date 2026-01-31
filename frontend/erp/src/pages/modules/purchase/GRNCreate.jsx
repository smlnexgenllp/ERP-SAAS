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
      console.log("Loaded gate entries ready for GRN:", res.data.length);
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

    // Reset everything
    setSelectedGateEntry(null);
    setItems([]);
    setQcId(null);
    setError(null);

    if (!geId) return;

    try {
      setLoading(true);

      const ge = gateEntries.find((g) => String(g.id) === String(geId));
      if (!ge) {
        setError("Selected gate entry not found in list");
        return;
      }

      setSelectedGateEntry(ge);

      // Step 1: Get the latest approved QC for this gate entry
      const qcRes = await api.get(
        `/inventory/quality-inspections/?gate_entry=${ge.id}&is_approved=true&ordering=-inspection_date`
      );

      const latestQC = qcRes.data?.results?.[0] || qcRes.data?.[0];
      if (!latestQC || !latestQC.items?.length) {
        setError("No approved quality inspection found for this gate entry");
        return;
      }

      setQcId(latestQC.id);

      // Step 2: Get PO to fetch real unit prices
      const poId = ge.po?.id || ge.purchase_order?.id || ge.po;
      if (!poId) {
        setError("No linked Purchase Order found for this gate entry");
        return;
      }

      const poRes = await api.get(`/inventory/purchase-orders/${poId}/`);
      const poItems = poRes.data?.items || [];

      // Create price lookup: item ID → unit_price
      const priceMap = {};
      poItems.forEach((poItem) => {
        const itemId = Number(poItem.item || poItem.item_id);
        priceMap[itemId] = Number(poItem.unit_price || poItem.rate || 0);
      });

      // Step 3: Map QC items + attach real PO price
      const mappedItems = latestQC.items.map((qcItem) => {
        const itemId = Number(qcItem.item);
        return {
          item: itemId,
          name:
            qcItem.item_name ||
            qcItem.item?.name ||
            qcItem.item?.code ||
            `Item #${itemId}`,
          accepted_qty: Number(qcItem.accepted_qty || 0),
          received_qty: Number(qcItem.accepted_qty || 0),
          unit_price: priceMap[itemId] || Number(qcItem.unit_price || 0) || 0,
        };
      });

      if (mappedItems.every((i) => i.received_qty <= 0)) {
        setError("No accepted quantities available in the latest approved QC");
        return;
      }

      setItems(mappedItems);
    } catch (err) {
      console.error("Error loading GRN data:", err);
      setError(
        err.response?.data?.detail ||
        "Failed to load required data (QC / PO / items)"
      );
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + (item.received_qty * item.unit_price),
    0
  );

  const saveGRN = async () => {
    if (!qcId) {
      alert("No approved Quality Inspection selected");
      return;
    }

    if (items.length === 0) {
      alert("No items available to create GRN");
      return;
    }

    if (items.some((i) => i.received_qty <= 0)) {
      alert("All items must have received quantity > 0");
      return;
    }

    try {
      // Double-check QC is still approved
      const qcCheck = await api.get(`/inventory/quality-inspections/${qcId}/`);
      if (!qcCheck.data?.is_approved) {
        alert("Cannot create GRN — Quality Inspection is no longer approved");
        return;
      }

      // Prepare items payload
      const grnItems = items.map((i) => ({
        item: Number(i.item),
        received_qty: Number(i.received_qty),
      }));

      const payload = {
        quality_inspection: Number(qcId),
        items: grnItems,
        // Optional: add more fields if your GRN serializer requires them
        // po: selectedGateEntry.po?.id || selectedGateEntry.purchase_order?.id,
        // received_date: new Date().toISOString().split("T")[0],
      };

      console.log("GRN Payload being sent:", JSON.stringify(payload, null, 2));

      const response = await api.post("/inventory/grns/", payload);

      alert("GRN created successfully! GRN Number: " + (response.data?.grn_number || "—"));
      navigate("/inventory/grns"); // or wherever your GRN list is
    } catch (err) {
      console.error("GRN creation failed:", err);
      console.error("Response data:", err.response?.data);

      let errorMsg = "Failed to create GRN";

      if (err.response?.data?.non_field_errors) {
        errorMsg += ":\n" + err.response.data.non_field_errors.join("\n");
      } else if (err.response?.data?.items) {
        errorMsg += "\nItems error: " + JSON.stringify(err.response.data.items);
      } else if (err.response?.data?.detail) {
        errorMsg += ": " + err.response.data.detail;
      } else {
        errorMsg += ": " + (err.message || "Unknown error");
      }

      alert(errorMsg);
    }
  };

  const getPONumber = (ge) => {
    if (!ge) return "—";
    return (
      ge.po?.po_number ||
      ge.purchase_order?.po_number ||
      (typeof ge.po === "number" ? `PO #${ge.po}` : "—")
    );
  };

  const formatCurrency = (value) => {
    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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

        {/* Gate Entry Selection */}
        <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
          <label className="block mb-3 text-lg font-medium text-cyan-300">
            Select Gate Entry with Approved QC
          </label>

          {loading && (
            <div className="flex items-center gap-3 text-cyan-400 py-4">
              <FiLoader className="animate-spin" size={24} /> Loading data...
            </div>
          )}

          {error && <p className="text-red-400 mb-4 font-medium">{error}</p>}

          {!loading && !error && (
            <select
              onChange={handleGateEntryChange}
              disabled={loading}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="">-- Select Gate Entry with Approved QC --</option>
              {gateEntries.map((ge) => (
                <option key={ge.id} value={ge.id}>
                  {ge.gate_entry_number} • PO: {getPONumber(ge)} • Vehicle: {ge.vehicle_number || "—"}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Items Table & Create Button */}
        {items.length > 0 && (
          <div>
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 mb-8">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-4 text-left font-semibold">Item</th>
                    <th className="p-4 text-center font-semibold">Accepted Qty (QC)</th>
                    <th className="p-4 text-right font-semibold">Rate</th>
                    <th className="p-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-center">{item.received_qty}</td>
                      <td className="p-4 text-right">
                        ₹ {formatCurrency(item.unit_price)}
                      </td>
                      <td className="p-4 text-right text-cyan-300 font-medium">
                        ₹ {formatCurrency(item.received_qty * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-800 font-bold">
                  <tr>
                    <td colSpan="3" className="p-4 text-right text-gray-300">
                      Grand Total
                    </td>
                    <td className="p-4 text-right text-cyan-400">
                      ₹ {formatCurrency(grandTotal)}
                    </td>
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
            No accepted items available in the latest approved quality inspection
          </div>
        )}
      </div>
    </div>
  );
}