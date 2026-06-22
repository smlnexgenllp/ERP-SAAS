// src/pages/modules/crm/ContactDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  PhoneCall,
  ArrowLeft,
  AlertCircle,
  Clock,
} from "lucide-react";

const TestContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Clean ID by removing "-test" suffix if present
  const cleanId = id ? id.replace("-test", "") : "";

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [timeline, setTimeline] = useState([]);

  const token = localStorage.getItem("token") || "";

  const getCsrfToken = () => {
    const name = "csrftoken";
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key === name) return decodeURIComponent(value);
    }
    return null;
  };

  const fetchContact = async () => {
    if (!cleanId) return;

    try {
      const res = await fetch(`/api/crm/contacts/${cleanId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to load contact");
      const data = await res.json();
      setContact(data);
      setError("");
    } catch (err) {
      setError(err.message || "Error loading contact");
    } finally {
      setLoading(false);
    }
  };
  const fetchTimeline = async () => {
  try {
    const [callRes, oppRes] = await Promise.all([
      fetch("/api/crm/call-logs/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch("/api/crm/opportunities/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const callData = await callRes.json();
    const oppData = await oppRes.json();

    const contactCalls = (callData.results || callData)
      .filter((c) => String(c.contact) === String(cleanId))
      .map((c) => ({
        type: "call",
        date: c.call_time,
        title: `Call - ${c.result}`,
        notes: c.notes,
      }));

    const contactOpps = (oppData.results || oppData)
      .filter((o) => String(o.contact) === String(cleanId))
      .map((o) => ({
        type: "opportunity",
        date: o.created_at,
        title: `Opportunity Created`,
        notes: o.title,
      }));

    const merged = [...contactCalls, ...contactOpps].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    setTimeline(merged);
  } catch (err) {
    console.error(err);
  }
};

 useEffect(() => {
  fetchContact();
  fetchTimeline();
}, [cleanId]);

  const updateContact = async (patchData, optimisticUpdate = null) => {
    setUpdating(true);
    setMessage("");
    setError("");

    if (optimisticUpdate) {
      setContact((prev) => ({ ...prev, ...optimisticUpdate }));
    }

    try {
      const res = await fetch(`/api/crm/contacts/${cleanId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
        body: JSON.stringify(patchData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || "Update failed");
      }

      setMessage("Updated successfully!");
      await fetchContact();
    } catch (err) {
      setError(`Error: ${err.message}`);
      if (optimisticUpdate) await fetchContact();
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    updateContact({ status: newStatus });
  };

  const handleFollowUpChange = (e) => {
    const newDate = e.target.value;
    updateContact(
      { next_follow_up: newDate || null },
      { next_follow_up: newDate || null }
    );
  };

  const markFollowUpDone = () => {
    if (!window.confirm("Mark this follow-up as completed?")) return;
    updateContact({ next_follow_up: null }, { next_follow_up: null });
  };

  const moveToSalesTeam = async () => {
    if (!window.confirm("Move this lead to Sales Team?\nThis will create a new Opportunity.")) return;

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/crm/contacts/${cleanId}/move-to-sales/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRFToken": getCsrfToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || "Failed to move to sales team");
      }

      const data = await res.json();
      setMessage(data.message || "Successfully moved to Sales Team!");

      if (data.opportunity_id) {
        navigate(`/crm/opportunities/${data.opportunity_id}-test`);
      } else {
        await fetchContact();
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // ✅ This function was missing - now added
  const getStatusStyle = (status) => {
    const styles = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-yellow-100 text-yellow-700",
      interested: "bg-purple-100 text-purple-700",
      qualified: "bg-indigo-100 text-indigo-700",
      follow_up: "bg-orange-100 text-orange-700",
      customer: "bg-emerald-100 text-emerald-700",
      lost: "bg-red-100 text-red-700",
    };
    return styles[status?.toLowerCase()] || "bg-zinc-100 text-zinc-700";
  };
  const convertToCustomer = async () => {
  if (!window.confirm("Add this contact as customer?")) return;

  try {
    const res = await fetch(
      `/api/crm/contacts/${cleanId}/convert_to_customer/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-CSRFToken": getCsrfToken(),
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Failed");
    }

    setMessage("Customer created successfully");

    navigate(`/crm/customers/${data.customer_id}`);
  } catch (err) {
    setError(err.message);
  }
};

  const canMoveToSales = ["interested", "qualified"].includes(contact?.status?.toLowerCase() || "");

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 max-w-md text-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-900">Contact Not Found</h2>
          <p className="text-zinc-600 mt-3">{error || "The requested contact could not be loaded."}</p>
          <button
            onClick={() => navigate("/crm/contacts-test")}
            className="mt-6 bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate("/crm/contacts-test")}
            className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                {contact.first_name} {contact.last_name || ""}
              </h1>
              <p className="text-zinc-500">Contact Details</p>
            </div>
          </div>

          <div
            className={`px-6 py-2.5 rounded-3xl text-sm font-semibold ${getStatusStyle(contact.status)}`}
          >
            {contact.status?.toUpperCase() || "NEW"}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 bg-emerald-100 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
            {error}
          </div>
        )}

        {/* Main Information Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Email</p>
                  <p className="text-lg font-medium text-zinc-900">{contact.email || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Phone</p>
                  <p className="text-lg font-medium text-zinc-900">{contact.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Mobile</p>
                  <p className="text-lg font-medium text-zinc-900">{contact.mobile || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Company</p>
                  <p className="text-lg font-medium text-zinc-900">{contact.company || "—"}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Address</p>
                  <p className="text-lg font-medium text-zinc-900">{contact.address || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-zinc-400 mt-1" />
                <div>
                  <p className="text-sm text-zinc-500">Next Follow-up</p>
                  {contact.next_follow_up ? (
                    <p className={`text-lg font-medium ${new Date(contact.next_follow_up) < new Date() ? "text-rose-600" : "text-amber-600"}`}>
                      {new Date(contact.next_follow_up).toLocaleDateString("en-IN")}
                      {new Date(contact.next_follow_up) < new Date() && " (Overdue)"}
                    </p>
                  ) : (
                    <p className="text-lg text-zinc-400">Not Scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="mt-10 pt-8 border-t border-zinc-100">
            <p className="text-sm font-medium text-zinc-500 mb-4">QUICK STATUS UPDATE</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusChange("contacted")}
                disabled={updating || contact.status === "contacted"}
                className="px-6 py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-2xl font-medium transition disabled:opacity-50"
              >
                Mark as Contacted
              </button>

              <button
                onClick={() => handleStatusChange("interested")}
                disabled={updating || contact.status === "interested"}
                className="px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-medium transition disabled:opacity-50"
              >
                Mark as Interested
              </button>

             {contact.can_direct_convert ? (
  <button
    onClick={convertToCustomer}
    disabled={updating}
    className="px-6 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-2xl font-medium transition"
  >
    Add As Customer
  </button>
) : (
  canMoveToSales && (
    <button
      onClick={moveToSalesTeam}
      disabled={updating}
      className="px-6 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-2xl font-medium transition"
    >
      Move To Sales Team
    </button>
  )
)}
            </div>
          </div>

          {/* Schedule Next Follow-up */}
          <div className="mt-10 pt-8 border-t border-zinc-100">
            <p className="text-sm font-medium text-zinc-500 mb-4">SCHEDULE NEXT FOLLOW-UP</p>
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="date"
                value={contact.next_follow_up ? new Date(contact.next_follow_up).toISOString().split("T")[0] : ""}
                onChange={handleFollowUpChange}
                disabled={updating}
                className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl focus:outline-none focus:border-zinc-400 transition disabled:opacity-60"
              />

              {contact.next_follow_up && (
                <button
                  onClick={markFollowUpDone}
                  disabled={updating}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-2xl font-medium transition"
                >
                  Mark Follow-up as Done
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Timeline */}
<div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
  <div className="flex items-center gap-3 mb-6">
    <Clock className="w-5 h-5 text-zinc-500" />
    <h2 className="text-xl font-semibold">Activity Timeline</h2>
  </div>

  {timeline.length === 0 ? (
    <p className="text-zinc-500">
      No activities available.
    </p>
  ) : (
    <div className="space-y-4">
      {timeline.map((item, index) => (
        <div
          key={index}
          className="border-l-2 border-zinc-300 pl-4 py-2"
        >
          <p className="font-medium text-zinc-900">
            {item.title}
          </p>

          <p className="text-sm text-zinc-500">
            {new Date(item.date).toLocaleString("en-IN")}
          </p>

          {item.notes && (
            <p className="text-zinc-700 mt-1">
              {item.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(`/crm/contacts-test/${id}/edit`)}
            disabled={updating}
            className="flex items-center gap-3 bg-zinc-900 hover:bg-black text-white px-8 py-4 rounded-3xl font-medium transition shadow-sm"
          >
            <Edit3 className="w-5 h-5" />
            Edit Contact
          </button>

          <button
            onClick={() => navigate(`/crm/call-logs-test?contact=${cleanId}`)}
            className="flex items-center gap-3 bg-white border border-zinc-300 hover:border-zinc-400 px-8 py-4 rounded-3xl font-medium transition"
          >
            <PhoneCall className="w-5 h-5" />
            Add Call Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestContactDetail;