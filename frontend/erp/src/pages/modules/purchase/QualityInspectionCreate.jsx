import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { FiCheckCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function QualityInspectionCreate() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gateEntries, setGateEntries] = useState([]);
  const [selectedGateEntry, setSelectedGateEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    gate_entry: "",
    accepted_qty: "",
    rejected_qty: "",
    remarks: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await api.get("/auth/current-user/");
      setUser(userRes.data);

      await fetchPendingGateEntries();
    } catch (err) {
      console.error("Initial data load failed:", err);
      setError("Failed to load user or gate entries");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingGateEntries = async () => {
    try {
      const res = await api.get("/inventory/gate-entries/?status=pending_qc");
      setGateEntries(res.data || []);
    } catch (err) {
      console.error("Failed to load pending gate entries:", err);
      setGateEntries([]);
      setError("Could not load gate entries pending QC");
    }
  };

  const handleGateEntrySelect = (geId) => {
    if (!geId) {
      setSelectedGateEntry(null);
      setForm({ gate_entry: "", accepted_qty: "", rejected_qty: "", remarks: "" });
      return;
    }

    const ge = gateEntries.find((g) => g.id === Number(geId));
    if (!ge) {
      setError("Selected gate entry not found");
      return;
    }

    setSelectedGateEntry(ge);

    const totalDelivered = (ge.items || []).reduce(
      (sum, item) => sum + Number(item.delivered_qty || 0),
      0
    );

    setForm({
      gate_entry: ge.id,
      accepted_qty: totalDelivered,
      rejected_qty: 0,
      remarks: "",
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitQC = async () => {
  if (!selectedGateEntry) {
    alert("Please select a gate entry");
    return;
  }

  const itemsList = selectedGateEntry.items || [];
  if (itemsList.length === 0) {
    alert("No items in this gate entry");
    return;
  }

  // Validate item_id exists
  for (let i = 0; i < itemsList.length; i++) {
    if (!itemsList[i].item_id) {
      alert(`Item ID missing for row ${i + 1}. Backend serializer must send item_id.`);
      return;
    }
  }

  const totalDelivered = itemsList.reduce(
    (sum, item) => sum + Number(item.delivered_qty || 0),
    0
  );

  const accepted = Number(form.accepted_qty) || 0;
  const rejected = Number(form.rejected_qty) || 0;

  if (Math.abs(accepted + rejected - totalDelivered) > 0.01) {
    alert(
      `Accepted (${accepted}) + Rejected (${rejected}) must equal Delivered (${totalDelivered})`
    );
    return;
  }

  // Proportional distribution
  let qcItems = itemsList.map((item) => {
    const delivered = Number(item.delivered_qty || 0);
    const ratio = totalDelivered > 0 ? delivered / totalDelivered : 0;

    return {
      item: item.item_id,   // ✅ GUARANTEED INTEGER
      accepted_qty: Math.round(accepted * ratio),
      rejected_qty: Math.round(rejected * ratio),
    };
  });

  // Fix rounding diff
  const calcTotal = qcItems.reduce(
    (s, i) => s + i.accepted_qty + i.rejected_qty,
    0
  );

  if (calcTotal !== totalDelivered && qcItems.length > 0) {
    qcItems[qcItems.length - 1].accepted_qty += totalDelivered - calcTotal;
  }

  const payload = {
    gate_entry: selectedGateEntry.id,
    remarks: (form.remarks || "").trim(),
    items: qcItems,
  };

  console.log("QC PAYLOAD:", payload);

  try {
    await api.post("/inventory/quality-inspections/", payload);
    alert("Quality Inspection submitted successfully!");

    setSelectedGateEntry(null);
    setForm({ gate_entry: "", accepted_qty: "", rejected_qty: "", remarks: "" });
    await fetchPendingGateEntries();
  } catch (err) {
    console.error("QC failed:", err.response?.data || err);
    alert(
      err.response?.data?.non_field_errors?.[0] ||
      err.response?.data?.detail ||
      "QC submission failed"
    );
  }
};

  const totalDelivered = selectedGateEntry
    ? (selectedGateEntry.items || []).reduce(
      (sum, item) => sum + Number(item.delivered_qty || 0),
      0
    )
    : 0;

  // Safe display helpers
  const getItemName = (item) => {
    if (item.item_name) return item.item_name;
    if (item.item?.name) return item.item.name;
    if (typeof item.item === "number") return `Item #${item.item}`;
    return "—";
  };

  const getPONumber = (ge) => {
    if (ge.po?.po_number) return ge.po.po_number;
    if (typeof ge.po === "number") return `PO #${ge.po}`;
    return "—";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 px-4 py-6 md:px-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft size={20} /> Back
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-cyan-300 flex items-center gap-3">
            <FiCheckCircle className="text-cyan-400" /> Quality Inspection (QC)
          </h1>

          <button
            onClick={loadInitialData}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
            title="Refresh pending gate entries"
          >
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-gray-900/90 border border-cyan-900/50 rounded-xl p-6 mb-10 shadow-xl">
            <h3 className="text-lg font-semibold text-cyan-300 mb-4">
              Organization & User Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-cyan-400/80 mb-1">Organization</label>
                <p className="text-lg font-semibold text-cyan-100">
                  {user.organization?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-cyan-400/80 mb-1">Current User</label>
                <p className="text-lg font-semibold text-cyan-100">
                  {user.full_name || user.email || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-gray-900/90 border border-cyan-900/50 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-cyan-900/50">
            <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-3">
              <FiCheckCircle /> Perform Quality Check
            </h2>
          </div>

          <div className="p-6 md:p-8">
            {/* Selection */}
            <div className="mb-10">
              <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                Select Gate Entry Pending QC <span className="text-red-400">*</span>
              </label>
              <select
                value={form.gate_entry}
                onChange={(e) => handleGateEntrySelect(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600"
              >
                <option value="">— Select Pending Gate Entry —</option>
                {gateEntries.map((ge) => (
                  <option key={ge.id} value={ge.id}>
                    {ge.gate_entry_number} • PO: {getPONumber(ge)} •{" "}
                    {ge.vehicle_number || "—"}
                  </option>
                ))}
              </select>
            </div>

            {selectedGateEntry && (
              <>
                {/* Quick Info */}
                <div className="bg-gray-800/50 border border-cyan-900/40 rounded-xl p-6 mb-10">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">
                    Gate Entry Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">
                        Gate Entry #
                      </span>
                      <p className="font-medium">{selectedGateEntry.gate_entry_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">PO #</span>
                      <p className="font-medium">{getPONumber(selectedGateEntry)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">Vehicle</span>
                      <p className="font-medium">
                        {selectedGateEntry.vehicle_number || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                    Delivered Items
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-cyan-900/40">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-800/70">
                        <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                          <th className="px-6 py-4 text-left">Item</th>
                          <th className="px-6 py-4 text-center">Delivered Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/30">
                        {(selectedGateEntry.items || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-800/40">
                            <td className="px-6 py-4">{getItemName(item)}</td>
                            <td className="px-6 py-4 text-center font-medium">
                              {Number(item.delivered_qty || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-800/60 font-semibold">
                        <tr>
                          <td className="px-6 py-4 text-right text-cyan-200">
                            Total Delivered:
                          </td>
                          <td className="px-6 py-4 text-center text-cyan-300">
                            {totalDelivered.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* QC Form */}
                <div className="bg-gray-800/50 border border-cyan-900/40 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-cyan-300 mb-6">
                    QC Decision
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                        Accepted Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalDelivered}
                        value={form.accepted_qty}
                        onChange={(e) => handleChange("accepted_qty", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                        Rejected Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalDelivered}
                        value={form.rejected_qty}
                        onChange={(e) => handleChange("rejected_qty", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                      Remarks / Observations (optional)
                    </label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                      rows={4}
                      placeholder="Enter defects, observations, reasons for rejection..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 resize-y"
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={submitQC}
                      disabled={loading || !form.gate_entry}
                      className="px-10 py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-900/30"
                    >
                      <FiCheckCircle size={20} /> Submit QC
                    </button>
                  </div>
                </div>
              </>
            )}

            {!selectedGateEntry && !loading && (
              <div className="text-center py-16 text-gray-500 italic">
                Select a pending gate entry above to perform Quality Inspection
              </div>
            )}
          </div>
        </div>

        {/* Pending List */}
        <div className="mt-10 bg-gray-900/90 border border-cyan-900/50 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b border-cyan-900/50">
            <h2 className="text-xl font-semibold text-cyan-300">
              Gate Entries Pending Quality Inspection
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : gateEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">
                No gate entries waiting for QC
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-800/70">
                    <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 text-left">Gate Entry #</th>
                      <th className="px-6 py-4 text-left">PO #</th>
                      <th className="px-6 py-4 text-left">Vehicle</th>
                      <th className="px-6 py-4 text-center">Delivered Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {gateEntries.map((ge) => (
                      <tr key={ge.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium">{ge.gate_entry_number}</td>
                        <td className="px-6 py-4">{getPONumber(ge)}</td>
                        <td className="px-6 py-4">{ge.vehicle_number || "—"}</td>
                        <td className="px-6 py-4 text-center">
                          {(ge.items || []).reduce(
                            (sum, i) => sum + Number(i.delivered_qty || 0),
                            0
                          )}
                        </td>
                      </tr>
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