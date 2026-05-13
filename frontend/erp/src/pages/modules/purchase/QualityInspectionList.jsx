// src/pages/quality/QualityInspectionList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  ArrowLeft,
  ClipboardCheck,
  Search,
} from "lucide-react";

export default function QualityInspectionList() {
  const navigate = useNavigate();

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
    
    if (typeof inspection.gate_entry === "object") {
      return inspection.gate_entry.gate_entry_number || inspection.gate_entry.id || "—";
    }
    
    return `#${inspection.gate_entry}`;
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/inventory/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition font-medium"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900">Quality Inspections</h1>
            </div>
          </div>

          <button
            onClick={fetchInspections}
            className="px-6 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 font-medium flex items-center gap-2 transition"
          >
            <FiRefreshCw size={16} /> Refresh List
          </button>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-2xl font-semibold text-zinc-900">Quality Inspection Management</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Review, approve or reject incoming material inspections
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-zinc-500">Loading inspections...</div>
            ) : inspections.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">No inspections found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="px-6 py-5 text-left font-semibold text-zinc-600">ID</th>
                    <th className="px-6 py-5 text-left font-semibold text-zinc-600">Gate Entry</th>
                    <th className="px-6 py-5 text-left font-semibold text-zinc-600">Date</th>
                    <th className="px-6 py-5 text-left font-semibold text-zinc-600">Remarks</th>
                    <th className="px-6 py-5 text-center font-semibold text-zinc-600">Status</th>
                    <th className="px-6 py-5 text-center font-semibold text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-5 font-medium text-zinc-900">#{inspection.id}</td>
                      <td className="px-6 py-5 font-medium">
                        {getGateEntryNumber(inspection)}
                      </td>
                      <td className="px-6 py-5 text-zinc-600">{inspection.inspection_date}</td>
                      <td className="px-6 py-5 text-zinc-600 max-w-md truncate">
                        {inspection.remarks || "—"}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-block px-5 py-1.5 rounded-full text-xs font-semibold ${
                            inspection.is_approved
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
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
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-2xl transition"
                              >
                                APPROVE
                              </button>
                              <button
                                onClick={() => showActionModal(inspection, "reject")}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-2xl transition"
                              >
                                REJECT
                              </button>
                            </>
                          )}
                          {inspection.is_approved && (
                            <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium border border-emerald-200">
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

        {/* Action Modal */}
        {modalVisible && selectedInspection && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 text-zinc-900">
                {actionType === "approve" 
                  ? `Approve Inspection #${selectedInspection.id}` 
                  : `Reject Inspection #${selectedInspection.id}`}
              </h3>

              <div className="mb-6">
                <p className="text-sm text-zinc-500 mb-1">Gate Entry Number</p>
                <p className="text-xl font-medium text-zinc-900">
                  {getGateEntryNumber(selectedInspection)}
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  Remarks <span className="text-zinc-400">(Optional)</span>
                </label>
                <textarea
                  rows={5}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or reason for approval/rejection..."
                  className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setModalVisible(false)}
                  className="flex-1 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleAction}
                  className={`flex-1 py-3.5 rounded-2xl font-medium text-white transition ${
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