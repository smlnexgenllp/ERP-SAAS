// src/pages/modules/crm/CallLogs.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const CallLogs = () => {
  const [searchParams] = useSearchParams();
  const contactId = searchParams.get("contact");

  const [contact, setContact] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [form, setForm] = useState({
    result: "connected",
    duration: "",
    notes: "",
  });

  /* ================= FETCH CONTACT ================= */

  useEffect(() => {
    if (!contactId) return;
    const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };
    fetch(`/api/crm/contacts/${contactId}/`, {
      headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
    })
      .then((res) => res.json())
      .then((data) => setContact(data));
  }, [contactId]);

  /* ================= FETCH CALL LOGS ================= */

  const fetchCallLogs = async () => {
     const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };
    const res = await fetch("/api/crm/call-logs/", {
      headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
    });

    const data = await res.json();
    setCallLogs(data.results || data);
  };

  useEffect(() => {
    fetchCallLogs();
  }, []);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };
    await fetch("/api/crm/call-logs/", {
      method: "POST",
      headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
      body: JSON.stringify({
        contact: contactId,
        result: form.result,
        duration_seconds: form.duration
          ? Number(form.duration) * 60
          : null,
        notes: form.notes || "",
      }),
    });

    setForm({ result: "connected", duration: "", notes: "" });
    fetchCallLogs();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-indigo-200 p-8">

      <h1 className="text-3xl font-bold mb-6 text-indigo-300">
        Call Logs
      </h1>

      {/* ================= CONTACT INFO ================= */}

      {contact && (
        <div className="bg-gray-900 p-5 rounded-xl mb-6 border border-gray-800">
          <p className="text-gray-400 text-sm">Calling</p>
          <p className="text-xl font-semibold">
            {contact.first_name} {contact.last_name}
          </p>
          <p className="text-gray-400 text-sm">
            {contact.phone} | {contact.email}
          </p>
        </div>
      )}

      {/* ================= CALL FORM ================= */}

      {contactId && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 p-6 rounded-xl mb-8 space-y-4 border border-gray-800"
        >
          <h2 className="text-lg font-semibold text-indigo-300">
            Log New Call
          </h2>

          <select
            value={form.result}
            onChange={(e) =>
              setForm({ ...form, result: e.target.value })
            }
            className="w-full bg-gray-800 p-3 rounded"
          >
            <option value="connected">Connected</option>
            <option value="no_answer">No Answer</option>
            <option value="busy">Busy</option>
            <option value="interested">Interested</option>
            <option value="not_interested">Not Interested</option>
            <option value="callback">Call Back Later</option>
          </select>

          <input
            type="number"
            placeholder="Duration (minutes)"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: e.target.value })
            }
            className="w-full bg-gray-800 p-3 rounded"
          />

          <textarea
            placeholder="Call Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            className="w-full bg-gray-800 p-3 rounded"
          />

          <button className="bg-indigo-600 px-6 py-2 rounded hover:bg-indigo-700 transition">
            Save Call Log
          </button>
        </form>
      )}

      {/* ================= CALL LOG TABLE ================= */}

      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
        <table className="min-w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4 text-left">Contact</th>
              <th className="p-4 text-left">Result</th>
              <th className="p-4 text-left">Duration</th>
              <th className="p-4 text-left">Notes</th>
              <th className="p-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {callLogs.map((log) => (
              <tr key={log.id} className="border-t border-gray-800">
                <td className="p-4">{log.contact}</td>
                <td className="p-4 capitalize">{log.result}</td>
                <td className="p-4">
                  {log.duration_seconds
                    ? Math.floor(log.duration_seconds / 60) + " min"
                    : "-"}
                </td>
                <td className="p-4">{log.notes}</td>
                <td className="p-4">
                  {new Date(log.call_time).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CallLogs;