// src/pages/modules/crm/CRMDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";

const CRMDashboard = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [dueFollowups, setDueFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };

    const fetchData = async () => {
      try {
        const [contactsRes, oppRes, followRes] = await Promise.all([
          fetch("/api/crm/contacts/", { headers }),
          fetch("/api/crm/opportunities/", { headers }),
          fetch("/api/crm/contacts/due_followups/", { headers }),
        ]);

        const contactsData = await contactsRes.json();
        const oppData = await oppRes.json();
        const followData = await followRes.json();

        setContacts(contactsData.results || contactsData || []);
        setOpportunities(oppData.results || oppData || []);
        setDueFollowups(followData.results || followData || []);
      } catch (err) {
        console.error("CRM Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300">
        Loading CRM Dashboard...
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
    .filter(o => o.stage !== "won" && o.stage !== "lost")
    .reduce((sum, o) => sum + Number(o.value || 0), 0);

  const conversionRate =
    contacts.length > 0
      ? ((customers / contacts.length) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-8">

      {/* ===== HEADER WITH CREATE BUTTON ===== */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-300">
          CRM Dashboard — {organization?.name}
        </h1>

        <button
          onClick={() => navigate("/crm/contacts/new")}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 
                     hover:from-cyan-400 hover:to-blue-500
                     text-white font-semibold 
                     px-6 py-2 rounded-lg 
                     shadow-lg transition-all duration-300"
        >
          + Create Lead
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Total Leads" value={contacts.length} />
        <StatCard title="New Leads" value={newLeads} />
        <StatCard title="Contacted" value={contacted} />
        <StatCard title="Interested" value={interested} />
        <StatCard title="Customers" value={customers} />
        <StatCard title="Open Deals" value={openDeals} />
        <StatCard title="Won Deals" value={wonDeals} />
        <StatCard title="Lost Deals" value={lostDeals} />
        <StatCard title="Due Followups" value={dueFollowups.length} />
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

      {/* ================= PIPELINE STAGES ================= */}
      <div className="bg-gray-900 border border-purple-800 p-6 rounded-xl mb-10">
        <h2 className="text-xl font-semibold text-purple-300 mb-4">
          Opportunity Stages
        </h2>

        <div className="grid grid-cols-3 gap-6 text-center">
          <StageCard title="New" value={openDeals} color="text-blue-400" />
          <StageCard title="Won" value={wonDeals} color="text-green-400" />
          <StageCard title="Lost" value={lostDeals} color="text-red-400" />
        </div>
      </div>

      {/* ================= DUE FOLLOWUPS ================= */}
      <div className="bg-gray-900 border border-yellow-700 p-6 rounded-xl mb-10">
        <h2 className="text-xl font-semibold text-yellow-300 mb-4">
          Due Follow-ups
        </h2>

        {dueFollowups.length === 0 && (
          <p className="text-gray-400">No follow-ups due today 🎉</p>
        )}

        {dueFollowups.slice(0, 5).map(contact => (
          <div
            key={contact.id}
            onClick={() => navigate(`/crm/contacts/${contact.id}`)}
            className="flex justify-between p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
          >
            <div>
              {contact.first_name} {contact.last_name}
            </div>
            <div className="text-sm text-yellow-400">
              {contact.next_follow_up
                ? new Date(contact.next_follow_up).toLocaleDateString()
                : ""}
            </div>
          </div>
        ))}
      </div>

      {/* ================= RECENT CONTACTS ================= */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-cyan-300 mb-4">
          Recent Contacts
        </h2>

        {contacts.slice(0, 5).map(contact => (
          <div
            key={contact.id}
            onClick={() => navigate(`/crm/contacts/${contact.id}`)}
            className="flex justify-between p-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
          >
            <div>
              {contact.first_name} {contact.last_name}
            </div>
            <div className="text-sm uppercase">
              {contact.status}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-gray-900 border border-cyan-800 p-6 rounded-xl text-center">
    <p className="text-sm text-cyan-400">{title}</p>
    <p className="text-2xl font-bold text-cyan-200 mt-2">{value || 0}</p>
  </div>
);

const StageCard = ({ title, value, color }) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default CRMDashboard;