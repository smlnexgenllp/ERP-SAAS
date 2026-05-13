import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { FiCheckCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";

const QualityInspectionCreate = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gateEntries, setGateEntries] = useState([]);
  const [selectedGateEntry, setSelectedGateEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qcValidation, setQcValidation] = useState({ isValid: true, message: "" });

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
      setQcValidation({ isValid: true, message: "" });
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
    
    validateQC(totalDelivered, totalDelivered, 0);
  };

  const validateQC = (totalDelivered, accepted, rejected) => {
    const acceptedNum = Number(accepted) || 0;
    const rejectedNum = Number(rejected) || 0;
    const total = acceptedNum + rejectedNum;
    
    if (Math.abs(total - totalDelivered) > 0.01) {
      setQcValidation({
        isValid: false,
        message: `❌ Not allowed (${acceptedNum} + ${rejectedNum} = ${total} ≠ ${totalDelivered})`
      });
      return false;
    } else {
      setQcValidation({
        isValid: true,
        message: `✅ OK (${total} = ${totalDelivered})`
      });
      return true;
    }
  };

  const handleChange = (field, value) => {
    const newValue = value === "" ? "" : Number(value);
    setForm((prev) => ({ ...prev, [field]: newValue }));
    
    if (selectedGateEntry) {
      const totalDelivered = (selectedGateEntry.items || []).reduce(
        (sum, item) => sum + Number(item.delivered_qty || 0),
        0
      );
      
      const accepted = field === "accepted_qty" ? newValue : form.accepted_qty;
      const rejected = field === "rejected_qty" ? newValue : form.rejected_qty;
      
      validateQC(totalDelivered, accepted, rejected);
    }
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
        `❌ Validation Failed!\n\nAccepted (${accepted}) + Rejected (${rejected}) must equal Delivered (${totalDelivered})\n\n` +
        `Current total: ${accepted + rejected}`
      );
      return;
    }

    let qcItems = itemsList.map((item) => {
      const delivered = Number(item.delivered_qty || 0);
      const ratio = totalDelivered > 0 ? delivered / totalDelivered : 0;

      return {
        item: item.item_id,
        accepted_qty: Math.round(accepted * ratio),
        rejected_qty: Math.round(rejected * ratio),
      };
    });

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

    try {
      await api.post("/inventory/quality-inspections/", payload);
      alert("✅ Quality Inspection submitted successfully!");

      setSelectedGateEntry(null);
      setForm({ gate_entry: "", accepted_qty: "", rejected_qty: "", remarks: "" });
      setQcValidation({ isValid: true, message: "" });
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
    <div className="min-h-screen bg-zinc-100 text-zinc-800 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-medium"
          >
            <FiArrowLeft size={20} /> Back
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 flex items-center gap-3">
            <FiCheckCircle className="text-blue-600" /> Quality Inspection (QC)
          </h1>

          <button
            onClick={loadInitialData}
            className="flex items-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 px-5 py-2.5 rounded-2xl transition"
            title="Refresh pending gate entries"
          >
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-10 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">
              Organization & User Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Organization</label>
                <p className="text-lg font-semibold text-zinc-900">
                  {user.organization?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-1">Current User</label>
                <p className="text-lg font-semibold text-zinc-900">
                  {user.full_name || user.email || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-200">
            <h2 className="text-2xl font-semibold text-zinc-900 flex items-center gap-3">
              <FiCheckCircle className="text-blue-600" /> Perform Quality Check
            </h2>
          </div>

          <div className="p-6 md:p-8">
            {/* Selection */}
            <div className="mb-10">
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Select Gate Entry Pending QC <span className="text-red-500">*</span>
              </label>
              <select
                value={form.gate_entry}
                onChange={(e) => handleGateEntrySelect(e.target.value)}
                disabled={loading}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
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
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 mb-10">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                    Gate Entry Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-sm text-zinc-500 block mb-1">Gate Entry #</span>
                      <p className="font-medium text-zinc-900">{selectedGateEntry.gate_entry_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-zinc-500 block mb-1">PO #</span>
                      <p className="font-medium text-zinc-900">{getPONumber(selectedGateEntry)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-zinc-500 block mb-1">Vehicle</span>
                      <p className="font-medium text-zinc-900">
                        {selectedGateEntry.vehicle_number || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-zinc-900 mb-4">
                    Delivered Items
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-zinc-50">
                        <tr className="text-zinc-600 text-sm">
                          <th className="px-6 py-4 text-left">Item</th>
                          <th className="px-6 py-4 text-center">Delivered Qty</th>
                          <th className="px-6 py-4 text-center">Accepted Qty</th>
                          <th className="px-6 py-4 text-center">Rejected Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {(selectedGateEntry.items || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50">
                            <td className="px-6 py-4">{getItemName(item)}</td>
                            <td className="px-6 py-4 text-center font-medium">
                              {Number(item.delivered_qty || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center text-emerald-600">—</td>
                            <td className="px-6 py-4 text-center text-red-600">—</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-zinc-50 font-semibold">
                        <tr>
                          <td className="px-6 py-4 text-right text-zinc-700">Total Delivered:</td>
                          <td className="px-6 py-4 text-center text-zinc-900">
                            {totalDelivered.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-emerald-600">
                            {Number(form.accepted_qty || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center text-red-600">
                            {Number(form.rejected_qty || 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* QC Form */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-zinc-900 mb-6">
                    QC Decision
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Accepted Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalDelivered}
                        value={form.accepted_qty}
                        onChange={(e) => handleChange("accepted_qty", e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Rejected Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalDelivered}
                        value={form.rejected_qty}
                        onChange={(e) => handleChange("rejected_qty", e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* QC Validation Status */}
                  <div className={`mb-6 p-4 rounded-2xl ${
                    qcValidation.isValid 
                      ? 'bg-emerald-50 border border-emerald-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">QC Rule Check:</span>
                      <span className={`font-mono text-lg ${qcValidation.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                        {qcValidation.message}
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Remarks / Observations (optional)
                    </label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                      rows={4}
                      placeholder="Enter defects, observations, reasons for rejection..."
                      className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-y"
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={submitQC}
                      disabled={loading || !form.gate_entry || !qcValidation.isValid}
                      className={`px-10 py-3.5 rounded-2xl transition-all flex items-center gap-2 shadow-sm ${
                        !qcValidation.isValid
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <FiCheckCircle size={20} /> Submit QC
                    </button>
                  </div>
                </div>
              </>
            )}

            {!selectedGateEntry && !loading && (
              <div className="text-center py-16 text-zinc-500 italic">
                Select a pending gate entry above to perform Quality Inspection
              </div>
            )}
          </div>
        </div>

        {/* Pending List */}
        <div className="mt-10 bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900">
              Gate Entries Pending Quality Inspection
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-zinc-500">Loading...</div>
            ) : gateEntries.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 italic">
                No gate entries waiting for QC
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-zinc-50">
                    <tr className="text-zinc-600 text-sm">
                      <th className="px-6 py-4 text-left">Gate Entry #</th>
                      <th className="px-6 py-4 text-left">PO #</th>
                      <th className="px-6 py-4 text-left">Vehicle</th>
                      <th className="px-6 py-4 text-center">Delivered Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {gateEntries.map((ge) => (
                      <tr key={ge.id} className="hover:bg-zinc-50 transition-colors">
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
};

export default QualityInspectionCreate;