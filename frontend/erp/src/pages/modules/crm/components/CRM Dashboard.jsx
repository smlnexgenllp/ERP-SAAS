// src/pages/modules/crm/CRMDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/AuthContext"; // adjust path to match your folder structure

const CRMDashboard = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalContacts: 0,
    leads: 0,
    customers: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        };

        const [contactsRes, oppsRes] = await Promise.all([
          fetch('/api/crm/contacts/', { headers }),
          fetch('/api/crm/opportunities/', { headers }),
        ]);

        if (!contactsRes.ok || !oppsRes.ok) {
          throw new Error('Failed to load CRM data');
        }

        const contactsData = await contactsRes.json();
        const oppsData = await oppsRes.json();

        // Handle both paginated (results + count) and flat list responses
        const contactList = contactsData.results || contactsData || [];
        const oppList = oppsData.results || oppsData || [];

        setContacts(contactList);
        setOpportunities(oppList);

        // Compute stats
        const leads = contactList.filter(c => c.status === 'lead').length;
        const customers = contactList.filter(c => c.status === 'customer').length;

        const won = oppList.filter(o => o.stage === 'won').length;
        const lost = oppList.filter(o => o.stage === 'lost').length;
        const pipeline = oppList
          .filter(o => !['won', 'lost'].includes(o.stage))
          .reduce((sum, o) => sum + Number(o.value || 0), 0);

        setStats({
          totalContacts: contactList.length,
          leads,
          customers,
          wonDeals: won,
          lostDeals: lost,
          pipelineValue: pipeline.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
        });
      } catch (err) {
        console.error('CRM fetch error:', err);
        setError('Unable to load CRM data. Please check your connection or try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleNewContact = () => navigate('/crm/contacts/new');
  const handleViewAllContacts = () => navigate('/crm/contacts');
  const handleViewPipeline = () => navigate('/crm/pipeline');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300 text-lg">Loading CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Header Section */}
      <div className="bg-gray-900/40 backdrop-blur-md border-b border-cyan-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center">
              <div className="bg-gray-800/60 p-3 rounded-lg mr-4">
                <div className="w-10 h-10 bg-cyan-700 rounded flex items-center justify-center text-gray-950 font-bold text-xl">
                  CRM
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-blue-300">CRM Dashboard</h1>
                <p className="text-cyan-400 mt-1">
                  {organization?.name || 'Your Organization'} • Welcome, {user?.first_name || 'User'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleNewContact}
                className="bg-blue-400 hover:bg-cyan-500 text-gray-950 px-5 py-2.5 rounded-lg font-medium transition shadow-md"
              >
                + New Contact
              </button>
              <button
                onClick={handleViewPipeline}
                className="bg-purple-500/80 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-md"
              >
                Sales Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 space-y-10 overflow-y-auto">
        {error && (
          <div className="bg-red-950/60 border border-red-700 text-red-200 px-6 py-4 rounded-xl shadow-lg">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { label: "Total Contacts", value: stats.totalContacts, color: "cyan", icon: "C" },
            { label: "Leads", value: stats.leads, color: "yellow", icon: "L" },
            { label: "Customers", value: stats.customers, color: "green", icon: "K" },
            { label: "Won Deals", value: stats.wonDeals, color: "emerald", icon: "W" },
            { label: "Lost Deals", value: stats.lostDeals, color: "red", icon: "L" },
            { label: "Pipeline Value", value: stats.pipelineValue, color: "purple", icon: "₹" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gray-900/50 border border-${stat.color}-900/70 rounded-xl p-5 flex flex-col items-center text-center hover:bg-gray-800/70 transition-all shadow-md`}
            >
              <div className={`w-14 h-14 bg-${stat.color}-900/40 rounded-full flex items-center justify-center mb-3 text-2xl font-bold text-${stat.color}-300`}>
                {stat.icon}
              </div>
              <p className={`text-${stat.color}-400 text-sm font-medium uppercase tracking-wide`}>{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}-200 mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Contacts */}
        <div className="bg-gray-900/50 border border-cyan-800 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-cyan-800 flex justify-between items-center bg-gray-800/40">
            <h2 className="text-2xl font-bold text-blue-300">Recent Contacts</h2>
            <button
              onClick={handleViewAllContacts}
              className="text-cyan-400 hover:text-cyan-200 text-sm font-medium flex items-center gap-1"
            >
              View All <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-cyan-900/50">
              <thead className="bg-gray-800/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {contacts.slice(0, 6).map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-800/60 transition-colors cursor-pointer"
                    onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-cyan-100">
                        {contact.first_name} {contact.last_name || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">{contact.company || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          contact.status === 'lead'
                            ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-700/50'
                            : contact.status === 'customer'
                            ? 'bg-green-900/70 text-green-200 border border-green-700/50'
                            : 'bg-gray-700 text-gray-300 border border-gray-600/50'
                        }`}
                      >
                        {contact.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300">{contact.email || '—'}</td>
                  </tr>
                ))}

                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-cyan-500">
                      <p className="text-lg">No contacts yet</p>
                      <button
                        onClick={handleNewContact}
                        className="mt-4 inline-block bg-blue-500/80 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                      >
                        Create your first contact
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-cyan-800 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-blue-300 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={handleNewContact}
              className="bg-gray-800/70 hover:bg-gray-700/70 border border-cyan-700/50 p-6 rounded-xl cursor-pointer transition-all shadow-md"
            >
              <h4 className="text-lg font-semibold text-cyan-200 mb-2">+ Add Contact</h4>
              <p className="text-sm text-cyan-400">Create a new lead, customer or partner</p>
            </div>

            <div
              onClick={handleViewPipeline}
              className="bg-gray-800/70 hover:bg-gray-700/70 border border-cyan-700/50 p-6 rounded-xl cursor-pointer transition-all shadow-md"
            >
              <h4 className="text-lg font-semibold text-cyan-200 mb-2">Sales Pipeline</h4>
              <p className="text-sm text-cyan-400">View opportunities by stage</p>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-xl opacity-75">
              <h4 className="text-lg font-semibold text-cyan-200 mb-2">Reports</h4>
              <p className="text-sm text-cyan-500">Analytics & insights (coming soon)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Command Bar Hint */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t-2 border-cyan-600 px-6 py-4 flex items-center shadow-2xl z-10">
        <span className="text-green-400 font-bold mr-3 text-xl">&gt;</span>
        <input
          type="text"
          placeholder="Type command (help, contacts, pipeline, new...)"
          className="flex-1 bg-transparent text-green-300 outline-none font-mono text-base placeholder-cyan-600"
          readOnly
        />
      </div>
    </div>
  );
};

export default CRMDashboard;