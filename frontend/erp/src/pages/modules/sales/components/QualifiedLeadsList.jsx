import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { Plus, Search, Filter, Users, ArrowLeft, Settings, Eye, FileText } from "lucide-react";

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

  const handleGoBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <Users className="w-9 h-9 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-300">Qualified Leads</h1>
              <p className="text-sm text-gray-400">Ready for quotation & conversion</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGstModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-amber-300 hover:text-amber-200 transition-all"
          >
            <Settings size={18} />
            GST Settings
          </button>
        </div>
      </header>

      <div className="p-6 md:p-8">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, company, email..."
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:border-cyan-600"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-xl hover:bg-gray-700/70">
            <Filter size={20} /> Filter
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse">Loading qualified leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No qualified leads found.</div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/70">
                  <tr>
                    <th className="py-4 px-6 text-left text-cyan-300">Name / Company</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Contact</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Status</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-200">{lead.full_name}</div>
                        <div className="text-sm text-gray-500">{lead.company || "—"}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {lead.email || lead.phone || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs bg-green-900/60 text-green-300 border border-green-700/50">
                          Qualified
                        </span>
                      </td>
                      <td className="py-4 px-6 flex gap-3">
                        <button
                          onClick={() => navigate(`/sales/leads/${lead.id}`)}
                          className="text-cyan-400 hover:text-cyan-300"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/sales/leads/${lead.id}?create=quotation`)}
                          className="text-purple-400 hover:text-purple-300"
                          title="Create Quotation"
                        >
                          <FileText size={18} />
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

      {/* GST Settings Modal */}
      {showGstModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-amber-300 mb-6">Organization GST Details</h2>
           
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">GST Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={gstSettings.gst_rate}
                  onChange={(e) => setGstSettings(prev => ({ ...prev, gst_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">GSTIN</label>
                <input
                  type="text"
                  value={gstSettings.gstin}
                  onChange={(e) => setGstSettings(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 uppercase"
                  placeholder="33XXXXX1234X"
                  maxLength={15}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowGstModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={saveGstSettings}
                disabled={savingGst}
                className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 rounded-xl font-medium disabled:opacity-70"
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