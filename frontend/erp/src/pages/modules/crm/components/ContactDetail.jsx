// src/pages/modules/crm/ContactDetail.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };
    fetch(`/api/crm/contacts/${id}/`, {
       headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load contact");
        return res.json();
      })
      .then((data) => setContact(data))
      .catch((err) => console.error("Contact Load Error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };
      await fetch(`/api/crm/contacts/${id}/`, {
        method: "PATCH",
       headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
        body: JSON.stringify({ status }),
      });

      setContact((prev) => ({ ...prev, status }));
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-600";
      case "contacted":
        return "bg-yellow-600";
      case "interested":
        return "bg-purple-600";
      case "customer":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300 text-lg">
        Loading Contact...
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-400">
        Contact not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-blue-400">
            {contact.first_name} {contact.last_name}
          </h1>

          <span
            className={`px-4 py-2 text-sm rounded-full font-semibold ${getStatusStyle(
              contact.status
            )}`}
          >
            {contact.status.toUpperCase()}
          </span>
        </div>

        {/* Contact Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg space-y-4">

          <div className="grid md:grid-cols-2 gap-6">

            <InfoItem label="Email" value={contact.email} />
            <InfoItem label="Phone" value={contact.phone} />
            <InfoItem label="Company" value={contact.company} />
            <InfoItem
              label="Next Follow-up"
              value={
                contact.next_follow_up
                  ? new Date(contact.next_follow_up).toLocaleDateString()
                  : "Not Scheduled"
              }
            />

          </div>

          {/* Status Actions */}
          <div className="pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Update Status</p>

            <div className="flex flex-wrap gap-3">
              <StatusButton
                label="Mark Contacted"
                color="bg-yellow-600"
                onClick={() => updateStatus("contacted")}
              />
              <StatusButton
                label="Mark Interested"
                color="bg-purple-600"
                onClick={() => updateStatus("interested")}
              />
              <StatusButton
                label="Convert to Customer"
                color="bg-green-600"
                onClick={() => updateStatus("customer")}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-gray-800 flex gap-4">
            <button
              onClick={() => navigate(`/crm/contacts/${id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 transition px-5 py-2 rounded-lg"
            >
              Edit Contact
            </button>

            <button
  onClick={() => navigate(`/call-logs?contact=${id}`)}
  className="bg-indigo-600 hover:bg-indigo-700 transition px-5 py-2 rounded-lg"
>
  Add Call Log
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-sm">{label}</p>
    <p className="text-lg font-medium mt-1">{value || "-"}</p>
  </div>
);

const StatusButton = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} hover:opacity-90 transition px-4 py-2 rounded-lg text-sm font-semibold`}
  >
    {label}
  </button>
);

export default ContactDetail;