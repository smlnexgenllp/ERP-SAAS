// src/pages/sales/QualifiedLeadsList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  ArrowLeft, 
  Settings, 
  Eye, 
  FileText,
  AlertCircle,
  Briefcase,
  FileCheck,
  CreditCard,
  LogOut
} from "lucide-react";

export default function QualifiedLeadsList() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // GST Organization Settings
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstSettings, setGstSettings] = useState({
    gst_rate: 18,
    gstin: "",
  });
  const [savingGst, setSavingGst] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchGstSettings();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sale/qualified-leads/");
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to load qualified leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGstSettings = async () => {
    try {
      const res = await api.get("/sale/gst-settings/");
      if (res.data) {
        setGstSettings({
          gst_rate: res.data.gst_rate || 18,
          gstin: res.data.gstin || "",
        });
      }
    } catch (err) {
      console.log("No GST settings found, using defaults");
    }
  };

  const saveGstSettings = async () => {
    setSavingGst(true);
    try {
      await api.post("/sale/gst-settings/", gstSettings);
      alert("GST settings saved successfully!");
      setShowGstModal(false);
    } catch (err) {
      console.error("Failed to save GST settings:", err);
      alert("Failed to save GST settings");
    } finally {
      setSavingGst(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGoBack = () => navigate("/sales/dashboard");

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      {/* Main Content - No sidebar */}
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Qualified Leads</h1>
                  <p className="text-zinc-500">Ready for quotation & conversion</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGstModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-amber-700 hover:text-amber-800 transition"
            >
              <Settings size={20} />
              <span className="font-medium">GST Settings</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, company, email..."
                className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition">
              <Filter size={20} /> 
              Filter
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-6 text-lg font-medium">Loading qualified leads...</p>
              </div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
              <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-xl text-zinc-600">No qualified leads found</p>
              <p className="text-zinc-500 mt-2">Try adjusting your search term</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="py-5 px-8 text-left text-sm font-semibold text-zinc-600">Name / Company</th>
                      <th className="py-5 px-8 text-left text-sm font-semibold text-zinc-600">Contact</th>
                      <th className="py-5 px-8 text-left text-sm font-semibold text-zinc-600">Status</th>
                      <th className="py-5 px-8 text-center text-sm font-semibold text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-6 px-8">
                          <div className="font-medium text-zinc-900">{lead.full_name}</div>
                          <div className="text-sm text-zinc-500">{lead.company || "—"}</div>
                        </td>
                        <td className="py-6 px-8 text-zinc-700">
                          {lead.email || lead.phone || "—"}
                        </td>
                        <td className="py-6 px-8">
                          <span className="px-4 py-1.5 rounded-2xl text-xs font-medium bg-emerald-100 text-emerald-700">
                            Qualified
                          </span>
                        </td>
                        <td className="py-6 px-8 flex items-center justify-center gap-6">
                          <button
                            onClick={() => navigate(`/sales/leads/${lead.id}`)}
                            className="text-zinc-600 hover:text-zinc-900 transition"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => navigate(`/sales/leads/${lead.id}?create=quotation`)}
                            className="text-purple-600 hover:text-purple-700 transition"
                            title="Create Quotation"
                          >
                            <FileText size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GST Settings Modal */}
      {showGstModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-6">Organization GST Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">GST Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gstSettings.gst_rate}
                  onChange={(e) => setGstSettings(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">GSTIN</label>
                <input
                  type="text"
                  value={gstSettings.gstin}
                  onChange={(e) => setGstSettings(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3 uppercase focus:outline-none focus:border-zinc-400"
                  placeholder="33XXXXX1234X"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowGstModal(false)}
                className="flex-1 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={saveGstSettings}
                disabled={savingGst}
                className="flex-1 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-medium transition disabled:opacity-70"
              >
                {savingGst ? "Saving..." : "Save GST Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}