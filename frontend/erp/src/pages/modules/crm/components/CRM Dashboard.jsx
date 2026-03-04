// src/pages/modules/crm/CRMDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const CRMDashboard = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [dueFollowups, setDueFollowups] = useState([]); // must be array
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!user) return;

    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      "Content-Type": "application/json",
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const [contactsRes, oppRes, followRes] = await Promise.all([
          fetch("/api/crm/contacts/", { headers }),
          fetch("/api/crm/opportunities/", { headers }),
          fetch("/api/crm/contacts/due_followups/", { headers }),
        ]);

        if (!contactsRes.ok) throw new Error(`Contacts failed: ${contactsRes.status}`);
        if (!oppRes.ok) throw new Error(`Opportunities failed: ${oppRes.status}`);
        if (!followRes.ok) throw new Error(`Due follow-ups failed: ${followRes.status}`);

        const contactsData = await contactsRes.json();
        const oppData = await oppRes.json();
        const followData = await followRes.json();

        // Contacts & Opportunities
        setContacts(contactsData.results || contactsData || []);
        setOpportunities(oppData.results || oppData || []);

        // ──────────────── Due Follow-ups – handle both response shapes ────────────────
        let followupsArray = [];

        if (followData && typeof followData === "object") {
          // Case 1: Your backend returns { count: N, items: [...] }
          if (Array.isArray(followData.items)) {
            followupsArray = followData.items;
          }
          // Case 2: Sometimes people return flat array directly
          else if (Array.isArray(followData)) {
            followupsArray = followData;
          }
        }

        setDueFollowups(followupsArray);

        // Debug helper – remove in production if you want
        console.log("Due Follow-ups loaded:", {
          rawResponse: followData,
          parsedArrayLength: followupsArray.length,
          firstTwo: followupsArray.slice(0, 2).map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name || ''}`,
            next: c.next_follow_up
          }))
        });

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setErrorMsg(err.message || "Failed to load dashboard data");
        setDueFollowups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300">
        <div className="text-xl animate-pulse">Loading CRM Dashboard...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-red-900/60 border border-red-700 rounded-xl p-8 max-w-lg text-center">
          <h2 className="text-red-300 text-2xl mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ===== CONTACT STATS =====
  const newLeads = contacts.filter(c => c.status === "new").length;
  const contacted = contacts.filter(c => c.status === "contacted").length;
  const interested = contacts.filter(c => c.status === "interested").length;
  const customers = contacts.filter(c => c.status === "customer").length;

  // ===== OPPORTUNITY STATS =====
  const openDeals = opportunities.filter(o => o.stage === "new").length;
  const wonDeals = opportunities.filter(o => o.stage === "won").length;
  const lostDeals = opportunities.filter(o => o.stage === "lost").length;

  const pipelineValue = opportunities
    .filter(o => !["won", "lost"].includes(o.stage))
    .reduce((sum, o) => sum + Number(o.value || 0), 0);

  const conversionRate =
    contacts.length > 0
      ? ((customers / contacts.length) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 md:p-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-300">
            CRM Dashboard
          </h1>
          <p className="text-gray-400 mt-1">{organization?.name || "Your Organization"}</p>
        </div>

        <button
          onClick={() => navigate("/crm/contacts")}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 
                     hover:from-cyan-400 hover:to-blue-500
                     text-white font-semibold 
                     px-6 py-3 rounded-lg shadow-lg transition-all duration-300"
        >
          Track Leads & Contacts
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
        <StatCard title="Total Leads" value={contacts.length} />
        <StatCard title="New Leads" value={newLeads} />
        <StatCard title="Contacted" value={contacted} />
        <StatCard title="Interested" value={interested} />
        <StatCard title="Customers" value={customers} />
        <StatCard title="Open Deals" value={openDeals} />
        <StatCard title="Won Deals" value={wonDeals} />
        <StatCard title="Lost Deals" value={lostDeals} />
        <StatCard title="Due Follow-ups" value={dueFollowups.length} />
        <StatCard title="Conversion Rate" value={`${conversionRate}%`} />
        <StatCard
          title="Pipeline Value"
          value={pipelineValue.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
          })}
        />
      </div>

      {/* Opportunity Stages */}
      <div className="bg-gray-900 border border-purple-800/50 p-6 md:p-8 rounded-2xl mb-12 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-purple-300 mb-6">
          Opportunity Stages
        </h2>
        <div className="grid grid-cols-3 gap-6 text-center">
          <StageCard title="New" value={openDeals} color="text-blue-400" />
          <StageCard title="Won" value={wonDeals} color="text-green-400" />
          <StageCard title="Lost" value={lostDeals} color="text-red-400" />
        </div>
      </div>

      {/* Due Follow-ups */}
      <div className="bg-gray-900 border border-yellow-700/50 p-6 md:p-8 rounded-2xl mb-12 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex justify-between items-center">
          <span>Due Follow-ups</span>
          <span className="text-lg font-medium bg-yellow-900/50 px-4 py-1 rounded-full">
            {dueFollowups.length}
          </span>
        </h2>

        {dueFollowups.length === 0 ? (
          <div className="bg-gray-800/50 p-10 rounded-xl text-center text-gray-400 border border-gray-700">
            No follow-ups due today 🎉<br />
            <span className="text-sm mt-3 block opacity-80">
              All contacts are up to date
            </span>
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {dueFollowups.slice(0, 8).map((contact) => (
              <div
                key={contact.id}
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center 
                           p-5 bg-gray-800 rounded-xl border border-gray-700 
                           hover:border-yellow-500 transition cursor-pointer group"
              >
                <div className="mb-3 sm:mb-0">
                  <p className="font-medium text-lg group-hover:text-yellow-300 transition">
                    {contact.first_name} {contact.last_name || ""}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {contact.company || "—"} • {contact.email || contact.phone || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-yellow-400 font-medium">
                    {contact.next_follow_up
                      ? new Date(contact.next_follow_up).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                  {contact.next_follow_up && new Date(contact.next_follow_up) < new Date() && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Overdue</p>
                  )}
                </div>
              </div>
            ))}

            {dueFollowups.length > 8 && (
              <div className="text-center text-gray-500 mt-4">
                + {dueFollowups.length - 8} more due follow-ups
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Contacts */}
      <div className="bg-gray-900 border border-cyan-800/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold text-cyan-300 mb-6">
          Recent Contacts
        </h2>

        {contacts.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No recent contacts yet</p>
        ) : (
          <div className="space-y-4">
            {contacts.slice(0, 6).map((contact) => (
              <div
                key={contact.id}
                onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                className="flex justify-between items-center p-4 bg-gray-800 rounded-xl 
                           border border-gray-700 hover:border-cyan-500 transition cursor-pointer"
              >
                <div>
                  <p className="font-medium">
                    {contact.first_name} {contact.last_name || ""}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {contact.company || "—"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    contact.status === "customer"
                      ? "bg-green-900 text-green-300"
                      : contact.status === "interested"
                      ? "bg-purple-900 text-purple-300"
                      : contact.status === "contacted"
                      ? "bg-yellow-900 text-yellow-300"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {contact.status?.toUpperCase() || "NEW"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-gray-900 border border-cyan-800/50 p-5 md:p-6 rounded-xl text-center hover:border-cyan-600/50 transition">
    <p className="text-sm text-cyan-400 uppercase tracking-wide mb-2">{title}</p>
    <p className="text-2xl md:text-3xl font-bold text-white">{value || 0}</p>
  </div>
);

const StageCard = ({ title, value, color }) => (
  <div className="bg-gray-800/70 p-5 rounded-xl text-center border border-gray-700">
    <p className="text-gray-400 text-sm mb-2">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

export default CRMDashboard;