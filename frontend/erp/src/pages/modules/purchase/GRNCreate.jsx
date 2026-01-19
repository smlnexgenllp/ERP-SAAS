import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import {
  FiClipboard,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function GRNCreate() {
  const navigate = useNavigate();

  const [gateEntries, setGateEntries] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    gate_entry: "",
    po: "",
    grn_number: "",
  });

  // ───────────────── INIT ─────────────────
  useEffect(() => {
    fetchGateEntries();
    setForm((f) => ({ ...f, grn_number: generateGRNNumber() }));
  }, []);

  const generateGRNNumber = () => {
    const d = new Date();
    return `GRN-${d.getFullYear()}${String(
      d.getMonth() + 1
    ).padStart(2, "0")}${String(d.getDate()).padStart(
      2,
      "0"
    )}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // ───────────────── API ─────────────────
  const fetchGateEntries = async () => {
    try {
      const res = await api.get("/inventory/gate-entries/");
      setGateEntries(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ───────────────── SELECT ─────────────────
  const handleGateEntryChange = async (e) => {
    const geId = e.target.value;
    setForm((f) => ({ ...f, gate_entry: geId }));
    setItems([]);

    if (!geId) return;

    try {
      setLoading(true);

      // 1️⃣ Get gate entry
      const ge = gateEntries.find(
        (g) => String(g.id) === String(geId)
      );

      if (!ge?.po) {
        alert("Gate Entry not linked to PO");
        return;
      }

      // 2️⃣ Load PO details
      const poRes = await api.get(
        `/inventory/purchase-orders/${ge.po}/`
      );

      const po = poRes.data;

      // 3️⃣ Map PurchaseOrderItem → GRN items
      const mapped = po.items.map((row) => ({
        item: row.item,
        name: row.item_name,
        po_quantity: Number(row.ordered_qty),
        received_qty:
          Number(row.ordered_qty) - Number(row.received_qty),
        unit_price: Number(row.unit_price),
      }));

      setForm((f) => ({ ...f, po: po.id }));
      setItems(mapped);
    } catch (err) {
      console.error(err);
      alert("Failed to load PO items");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────── EDIT ─────────────────
  const updateQty = (i, v) => {
    const updated = [...items];
    updated[i].received_qty = Math.max(0, Number(v));
    setItems(updated);
  };

  const total = (i) => i.received_qty * i.unit_price;
  const grandTotal = items.reduce((s, i) => s + total(i), 0);

  // ───────────────── SAVE ─────────────────
  const saveGRN = async () => {
    const payload = {
      gate_entry: form.gate_entry,
      po: form.po,
      grn_number: form.grn_number,
      items: items.map((i) => ({
        item: i.item,
        received_qty: i.received_qty,
        unit_price: i.unit_price,
      })),
    };

    try {
      await api.post("/inventory/grns/", payload);
      alert("GRN Created (QC Pending)");
      navigate(-1);
    } catch (e) {
      console.error(e.response?.data || e);
      alert("GRN creation failed");
    }
  };

  // ───────────────── UI ─────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-xl flex items-center gap-2">
            <FiClipboard /> Create GRN
          </h1>
        </div>

        {/* Gate Entry */}
        <div className="bg-gray-900 p-6 rounded-xl mb-6">
          <label className="block mb-2 text-sm text-gray-400">
            Select Gate Entry
          </label>
          <select
            onChange={handleGateEntryChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
          >
            <option value="">-- Select --</option>
            {gateEntries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.gate_entry_number} | PO {g.po}
              </option>
            ))}
          </select>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Item</th>
                  <th className="p-3 text-center">PO Qty</th>
                  <th className="p-3 text-center">Received</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i, idx) => (
                  <tr key={idx} className="border-t border-gray-800">
                    <td className="p-3">{i.name}</td>
                    <td className="p-3 text-center">{i.po_quantity}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={i.received_qty}
                        onChange={(e) =>
                          updateQty(idx, e.target.value)
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center"
                      />
                    </td>
                    <td className="p-3 text-right">₹ {i.unit_price}</td>
                    <td className="p-3 text-right">₹ {total(i)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-800 font-semibold">
                <tr>
                  <td colSpan="4" className="p-3 text-right">
                    Grand Total
                  </td>
                  <td className="p-3 text-right text-cyan-400">
                    ₹ {grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Save */}
        {items.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={saveGRN}
              className="bg-green-600 px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <FiCheckCircle /> Save GRN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
