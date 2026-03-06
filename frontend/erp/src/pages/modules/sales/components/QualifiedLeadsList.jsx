// src/pages/sales/QualifiedLeadsList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api"; // your axios instance
import { Plus, Search, Filter } from "lucide-react";

export default function QualifiedLeadsList() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/qualified-leads/");
      setLeads(res.data);
    } catch (err) {
      console.error("Failed to load qualified leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <Users className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">Qualified Leads (Sales)</h1>
            <p className="text-sm text-gray-400">Leads ready for quotation & follow-up</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/sales/leads/create")}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-cyan-500/30 transition-all"
        >
          <Plus size={20} /> New Lead (Sales)
        </button>
      </header>

      <div className="p-6 md:p-8">
        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, company, email..."
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-cyan-600"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-gray-800/70 border border-gray-700 rounded-xl hover:bg-gray-700/70">
            <Filter size={20} /> Filter
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse">Loading qualified leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No qualified leads found</div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/70">
                  <tr>
                    <th className="py-4 px-6 text-left text-cyan-300">Name / Company</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Contact</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Status</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Next Follow-up</th>
                    <th className="py-4 px-6 text-left text-cyan-300">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/sales/leads/${lead.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-200">{lead.full_name}</div>
                        <div className="text-sm text-gray-500">{lead.company || "—"}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {lead.email || lead.phone || "—"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs bg-green-900/50 text-green-300 border border-green-700/50">
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {lead.next_follow_up ? new Date(lead.next_follow_up).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-4 px-6 text-gray-300">—</td> {/* add assigned_to field later */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}