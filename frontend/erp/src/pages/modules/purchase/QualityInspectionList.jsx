import React, { useState, useEffect } from "react";
import api from "../../../services/api";

export default function QualityInspectionList() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'

  // Fetch Quality Inspections
  const fetchInspections = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/quality-inspections/");
      setInspections(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to fetch quality inspections:", err);
      alert("Could not load Quality Inspections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const showActionModal = (inspection, type) => {
    setSelectedInspection(inspection);
    setActionType(type);
    setRemarks("");
    setModalVisible(true);
  };

  const handleAction = async () => {
    if (!selectedInspection) return;

    const endpoint = actionType === "approve" ? "approve" : "reject";

    try {
      await api.post(`/inventory/quality-inspections/${selectedInspection.id}/${endpoint}/`, {
        remarks: remarks.trim() || undefined,
      });

      alert(`Quality Inspection ${actionType === "approve" ? "Approved" : "Rejected"} successfully!`);
      setModalVisible(false);
      fetchInspections();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || `Failed to ${actionType} inspection`;
      alert(`Error: ${errorMsg}`);
    }
  };

  // Helper to safely get Gate Entry Number
  const getGateEntryNumber = (inspection) => {
    if (!inspection?.gate_entry) return "—";
    
    // Case 1: If gate_entry is a full object
    if (typeof inspection.gate_entry === "object") {
      return inspection.gate_entry.gate_entry_number || inspection.gate_entry.id || "—";
    }
    
    // Case 2: If gate_entry is just an ID (number)
    return `#${inspection.gate_entry}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-wide">QUALITY INSPECTIONS</h1>
          <button
            onClick={fetchInspections}
            className="px-6 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-700 rounded-lg transition text-cyan-200 font-medium"
          >
            REFRESH LIST
          </button>
        </div>

        <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-cyan-800">
            <h2 className="text-xl font-semibold text-cyan-200">Quality Inspection Management</h2>
            <p className="text-cyan-500 text-sm mt-1">
              Review, approve or reject incoming material inspections
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-cyan-400">Loading...</div>
            ) : inspections.length === 0 ? (
              <div className="p-12 text-center text-yellow-400">No inspections found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-950 border-b border-cyan-800">
                    <th className="px-6 py-5 text-left">ID</th>
                    <th className="px-6 py-5 text-left">Gate Entry</th>
                    <th className="px-6 py-5 text-left">Date</th>
                    <th className="px-6 py-5 text-left">Remarks</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-800/60 transition-colors">
                      <td className="px-6 py-5 font-medium">#{inspection.id}</td>
                      <td className="px-6 py-5 font-medium text-cyan-100">
                        {getGateEntryNumber(inspection)}
                      </td>
                      <td className="px-6 py-5 text-cyan-400">{inspection.inspection_date}</td>
                      <td className="px-6 py-5 text-gray-400 max-w-md truncate">
                        {inspection.remarks || "—"}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-block px-5 py-1.5 rounded-full text-xs font-bold ${
                            inspection.is_approved
                              ? "bg-emerald-900 text-emerald-400 border border-emerald-700"
                              : "bg-rose-900 text-rose-400 border border-rose-700"
                          }`}
                        >
                          {inspection.is_approved ? "APPROVED" : "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-3 justify-center">
                          {!inspection.is_approved && (
                            <>
                              <button
                                onClick={() => showActionModal(inspection, "approve")}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => showActionModal(inspection, "reject")}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                              >
                                REJECT
                              </button>
                            </>
                          )}
                          {inspection.is_approved && (
                            <div className="px-6 py-2 bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-700">
                              ✓ APPROVED
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal */}
        {modalVisible && selectedInspection && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-cyan-700 rounded-2xl w-full max-w-lg p-8">
              <h3 className="text-2xl font-semibold mb-6 text-cyan-100">
                {actionType === "approve" 
                  ? `Approve Inspection #${selectedInspection.id}` 
                  : `Reject Inspection #${selectedInspection.id}`}
              </h3>

              <div className="mb-6">
                <p className="text-cyan-500 text-sm mb-1">Gate Entry Number</p>
                <p className="text-xl font-medium text-white">
                  {getGateEntryNumber(selectedInspection)}
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-cyan-400 text-sm mb-3">
                  Remarks <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  rows={5}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or reason for approval/rejection..."
                  className="w-full bg-gray-800 border border-cyan-700 rounded-xl px-4 py-3 text-cyan-200 focus:border-cyan-400 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 py-3.5 border border-cyan-700 hover:bg-gray-800 rounded-xl text-cyan-300 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-3.5 rounded-xl font-medium text-white transition ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionType === "approve" ? "CONFIRM APPROVAL" : "CONFIRM REJECTION"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}