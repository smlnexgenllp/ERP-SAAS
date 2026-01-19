import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { FiCheckCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function QualityInspectionCreate() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [grns, setGrns] = useState([]);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    grn: "",
    accepted_qty: "",
    rejected_qty: "",
    remarks: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userRes = await api.get("/auth/current-user/");
      setUser(userRes.data);

      await fetchPendingGRNs();
    } catch (err) {
      console.error("Initial data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingGRNs = async () => {
    try {
      const res = await api.get("/inventory/grns/?is_quality_approved=false");
      setGrns(res.data || []);
    } catch (err) {
      console.error("Failed to load pending GRNs:", err);
      setGrns([]);
    }
  };

  const handleGRNSelect = (grnId) => {
    if (!grnId) {
      setSelectedGRN(null);
      setForm({ grn: "", accepted_qty: "", rejected_qty: "", remarks: "" });
      return;
    }

    const grn = grns.find((g) => g.id === Number(grnId));
    if (!grn) return;

    setSelectedGRN(grn);

    const totalReceived = grn.items.reduce((sum, item) => sum + Number(item.received_qty || 0), 0);

    setForm({
      grn: grn.id,
      accepted_qty: totalReceived,
      rejected_qty: 0,
      remarks: "",
    });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

 const submitQC = async () => {
  if (!selectedGRN) {
    alert("Please select a GRN");
    return;
  }

  // Total received from GRN
  const totalReceived = selectedGRN.items.reduce(
    (sum, item) => sum + Number(item.received_qty || 0),
    0
  );

  const accepted = Number(form.accepted_qty) || 0;
  const rejected = Number(form.rejected_qty) || 0;

  if (accepted + rejected !== totalReceived) {
    alert("Accepted + Rejected must equal received quantity");
    return;
  }

  // ✅ ITEM-WISE QC SPLIT (PROPORTIONAL)
  const qcItems = selectedGRN.items.map((item) => {
    const ratio = Number(item.received_qty) / totalReceived || 0;

    return {
      item: item.item, // item ID
      accepted_qty: Math.round(accepted * ratio),
      rejected_qty: Math.round(rejected * ratio),
    };
  });

  const payload = {
    gate_entry: selectedGRN.gate_entry, // ✅ REQUIRED
    grn: selectedGRN.id,
    remarks: form.remarks,
    items: qcItems, // ✅ REQUIRED
  };

  try {
    await api.post("/inventory/quality-inspections/", payload);
    alert("Quality Inspection completed successfully");

    setSelectedGRN(null);
    setForm({
      grn: "",
      accepted_qty: "",
      rejected_qty: "",
      remarks: "",
    });

    await fetchPendingGRNs();
  } catch (err) {
    console.error("QC submission failed:", err.response?.data || err);
    alert("Failed to submit QC");
  }
};


  const totalReceived = selectedGRN
    ? selectedGRN.items.reduce((sum, item) => sum + Number(item.received_qty || 0), 0)
    : 0;

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
            title="Refresh pending GRNs"
          >
            <FiRefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* User & Org Info */}
        {user && (
          <div className="bg-gray-900/90 border border-cyan-900/50 rounded-xl p-6 mb-10 shadow-xl">
            <h3 className="text-lg font-semibold text-cyan-300 mb-4">Organization & User Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-cyan-400/80 mb-1">Organization</label>
                <p className="text-lg font-semibold text-cyan-100">{user.organization?.name || "—"}</p>
              </div>
              <div>
                <label className="block text-sm text-cyan-400/80 mb-1">Current User</label>
                <p className="text-lg font-semibold text-cyan-100">{user.full_name || user.email || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gray-900/90 border border-cyan-900/50 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 border-b border-cyan-900/50">
            <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-3">
              <FiCheckCircle /> Perform Quality Inspection
            </h2>
          </div>

          <div className="p-6 md:p-8">
            {/* GRN Selection */}
            <div className="mb-10">
              <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                Select GRN Pending QC <span className="text-red-400">*</span>
              </label>
              <select
                value={form.grn}
                onChange={(e) => handleGRNSelect(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-colors"
              >
                <option value="">— Select Pending GRN —</option>
                {grns.map((grn) => (
                  <option key={grn.id} value={grn.id}>
                    {grn.grn_number} • PO: {grn.po?.po_number} • {grn.po?.vendor?.name || "Vendor"}
                  </option>
                ))}
              </select>
            </div>

            {/* GRN Info & QC Form */}
            {selectedGRN && (
              <>
                {/* GRN Quick Info */}
                <div className="bg-gray-800/50 border border-cyan-900/40 rounded-xl p-6 mb-10">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4">GRN Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">GRN Number</span>
                      <p className="font-medium">{selectedGRN.grn_number}</p>
                    </div>
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">PO Number</span>
                      <p className="font-medium">{selectedGRN.po?.po_number || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-cyan-400 block mb-1">Vendor</span>
                      <p className="font-medium">{selectedGRN.po?.vendor?.name || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mb-10">
                  <h3 className="text-xl font-semibold text-cyan-300 mb-4">Items in GRN</h3>
                  <div className="overflow-x-auto rounded-xl border border-cyan-900/40">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gray-800/70">
                        <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                          <th className="px-6 py-4 text-left">Item</th>
                          <th className="px-6 py-4 text-center">Received Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyan-900/30">
                        {selectedGRN.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-6 py-4">{item.item_name || item.item?.name || "—"}</td>
                            <td className="px-6 py-4 text-center font-medium">{item.received_qty || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-800/60 font-semibold">
                        <tr>
                          <td className="px-6 py-4 text-right text-cyan-200">Total Received:</td>
                          <td className="px-6 py-4 text-center text-cyan-300">
                            {totalReceived}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* QC Form */}
                <div className="bg-gray-800/50 border border-cyan-900/40 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-cyan-300 mb-6">QC Decision</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                        Accepted Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalReceived}
                        value={form.accepted_qty}
                        onChange={(e) => handleChange("accepted_qty", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                        Rejected Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalReceived}
                        value={form.rejected_qty}
                        onChange={(e) => handleChange("rejected_qty", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm text-cyan-400/90 mb-2 font-medium">
                      Remarks / Reason for Rejection (optional)
                    </label>
                    <textarea
                      value={form.remarks}
                      onChange={(e) => handleChange("remarks", e.target.value)}
                      rows={4}
                      placeholder="Enter inspection notes, defects found, etc..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-cyan-50 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/40 transition-colors resize-y"
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={submitQC}
                      disabled={loading || !form.grn}
                      className="px-10 py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 
                               disabled:cursor-not-allowed text-white font-medium rounded-xl 
                               transition-all shadow-lg shadow-green-900/30 flex items-center gap-2"
                    >
                      <FiCheckCircle size={20} /> Complete QC Approval
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Placeholder */}
            {!selectedGRN && !loading && (
              <div className="text-center py-16 text-gray-500 italic">
                Select a pending GRN above to perform Quality Inspection
              </div>
            )}
          </div>
        </div>

        {/* Pending GRNs Summary */}
        <div className="mt-10 bg-gray-900/90 border border-cyan-900/50 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b border-cyan-900/50">
            <h2 className="text-xl font-semibold text-cyan-300">
              GRNs Pending Quality Inspection
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : grns.length === 0 ? (
              <div className="text-center py-12 text-gray-500 italic">
                No GRNs waiting for QC
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-800/70">
                    <tr className="text-cyan-300/90 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 text-left">GRN Number</th>
                      <th className="px-6 py-4 text-left">PO Number</th>
                      <th className="px-6 py-4 text-left">Vendor</th>
                      <th className="px-6 py-4 text-center">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {grns.map((grn) => (
                      <tr key={grn.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-6 py-4 font-medium">{grn.grn_number}</td>
                        <td className="px-6 py-4">{grn.po?.po_number || "—"}</td>
                        <td className="px-6 py-4">{grn.po?.vendor?.name || "—"}</td>
                        <td className="px-6 py-4 text-center">
                          {grn.items.reduce((sum, i) => sum + Number(i.received_qty || 0), 0)}
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