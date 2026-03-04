// src/pages/modules/crm/ContactDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    try {
      const res = await fetch(`/api/crm/contacts/${id}/`, {
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

  useEffect(() => {
    fetchContact();
  }, [id]);

  const updateContact = async (patchData, optimisticUpdate = null) => {
    setUpdating(true);
    setMessage("");
    setError("");

    // Optimistic UI update
    if (optimisticUpdate) {
      setContact(prev => ({ ...prev, ...optimisticUpdate }));
    }

    try {
      const res = await fetch(`/api/crm/contacts/${id}/`, {
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
      await fetchContact(); // Re-fetch to ensure latest data
    } catch (err) {
      setError(`Error: ${err.message}`);
      if (optimisticUpdate) await fetchContact(); // Revert on error
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
    updateContact(
      { next_follow_up: null },
      { next_follow_up: null }
    );
  };

  const moveToSalesTeam = async () => {
    if (!window.confirm("Move this lead to Sales Team?\nThis will create a new Opportunity.")) return;

    setUpdating(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/crm/contacts/${id}/move-to-sales/`, {
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

      // Redirect to the newly created Opportunity (recommended)
      if (data.opportunity_id) {
        navigate(`/crm/opportunities/${data.opportunity_id}`);
      } else {
        await fetchContact(); // refresh if no redirect
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      new: "bg-blue-600",
      contacted: "bg-yellow-600",
      interested: "bg-purple-600",
      qualified: "bg-indigo-600",
      follow_up: "bg-orange-600",
      customer: "bg-green-600",
      lost: "bg-red-600",
    };
    return styles[status?.toLowerCase()] || "bg-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">
        Loading Contact...
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400 p-8 text-center">
        {error || "Contact not found"}
      </div>
    );
  }

  const canMoveToSales = ["interested", "qualified"].includes(contact.status?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.includes("Error") 
              ? "bg-red-900/60 border-red-700 text-red-200" 
              : "bg-green-900/60 border-green-700 text-green-200"
          }`}>
            {message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-400">
            {contact.first_name} {contact.last_name || ""}
          </h1>

          <span
            className={`px-5 py-2 rounded-full text-sm font-semibold ${getStatusStyle(contact.status)}`}
          >
            {contact.status?.toUpperCase() || "UNKNOWN"}
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <InfoItem label="Email" value={contact.email || "—"} />
              <InfoItem label="Phone" value={contact.phone || "—"} />
              <InfoItem label="Mobile" value={contact.mobile || "—"} />
              <InfoItem label="Company" value={contact.company || "—"} />
              <InfoItem label="Position" value={contact.position || "—"} />
            </div>

            <div className="space-y-4">
              <InfoItem
                label="Status"
                value={
                  <span className={`font-medium ${getStatusStyle(contact.status)} px-3 py-1 rounded-full text-sm`}>
                    {contact.status?.toUpperCase() || "NEW"}
                  </span>
                }
              />
              <InfoItem
                label="Next Follow-up"
                value={
                  contact.next_follow_up ? (
                    <span className={new Date(contact.next_follow_up) < new Date() ? "text-red-400 font-medium" : "text-yellow-400 font-medium"}>
                      {new Date(contact.next_follow_up).toLocaleDateString("en-IN")}
                      {new Date(contact.next_follow_up) < new Date() && " (Overdue)"}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not Scheduled</span>
                  )
                }
              />
              <InfoItem label="Address" value={contact.address || "—"} />
            </div>
          </div>

          {/* Quick Status Actions */}
          <div className="pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-4">Quick Status Actions</p>
            <div className="flex flex-wrap gap-3">
              <StatusButton
                label="Mark Contacted"
                color="bg-yellow-600 hover:bg-yellow-700"
                onClick={() => handleStatusChange("contacted")}
                disabled={updating || contact.status === "contacted"}
              />
              <StatusButton
                label="Mark Interested"
                color="bg-purple-600 hover:bg-purple-700"
                onClick={() => handleStatusChange("interested")}
                disabled={updating || contact.status === "interested"}
              />
              {canMoveToSales && (
                <StatusButton
                  label={updating ? "Moving..." : "Move to Sales Team"}
                  color="bg-indigo-600 hover:bg-indigo-700"
                  onClick={moveToSalesTeam}
                  disabled={updating}
                />
              )}
            </div>
          </div>

          {/* Schedule Next Follow-up */}
          <div className="pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-4">Schedule Next Follow-up</p>
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="date"
                value={contact.next_follow_up ? new Date(contact.next_follow_up).toISOString().split("T")[0] : ""}
                onChange={handleFollowUpChange}
                disabled={updating}
                className="bg-gray-800 p-3 rounded text-gray-200 border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-60"
              />

              {contact.next_follow_up && (
                <button
                  onClick={markFollowUpDone}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition font-medium shadow-sm"
                >
                  {updating ? "Processing..." : "Mark as Done"}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="pt-8 border-t border-gray-800 flex flex-wrap gap-4">
            <button
              onClick={() => navigate(`/crm/contacts/${id}/edit`)}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-3 rounded-lg transition font-medium"
            >
              Edit Contact
            </button>

            <button
              onClick={() => navigate(`/call-logs?contact=${id}`)}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg transition font-medium"
            >
              Add Call Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Reusable Components */
const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <div className="text-lg font-medium">{value}</div>
  </div>
);

const StatusButton = ({ label, color, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"} 
               transition px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm`}
  >
    {label}
  </button>
);

export default ContactDetail;