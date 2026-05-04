// src/pages/modules/crm/CallLogs.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Phone,
  Clock,
  User,
  Plus,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

const CallLogs = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const contactId = searchParams.get("contact");

  const [contact, setContact] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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
      .then((data) => setContact(data))
      .catch((err) => console.error("Error fetching contact:", err));
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

    try {
      const res = await fetch("/api/crm/call-logs/", {
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setCallLogs(data.results || data || []);
    } catch (err) {
      console.error("Error fetching call logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, []);

  /* ================= SUBMIT NEW CALL LOG ================= */
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

    try {
      await fetch("/api/crm/call-logs/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact: contactId,
          result: form.result,
          duration_seconds: form.duration ? Number(form.duration) * 60 : null,
          notes: form.notes || "",
        }),
      });

      setForm({ result: "connected", duration: "", notes: "" });
      fetchCallLogs(); // Refresh the list
    } catch (err) {
      console.error("Error saving call log:", err);
      alert("Failed to save call log");
    }
  };

  const resultColors = {
    connected: "bg-emerald-100 text-emerald-700",
    no_answer: "bg-amber-100 text-amber-700",
    busy: "bg-rose-100 text-rose-700",
    interested: "bg-blue-100 text-blue-700",
    not_interested: "bg-zinc-100 text-zinc-700",
    callback: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Call Logs</h1>
              <p className="text-zinc-500">Track all your call activities</p>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        {contact && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 mb-8 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <User className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-500">Currently viewing logs for</p>
                <p className="text-2xl font-semibold text-zinc-900 mt-1">
                  {contact.first_name} {contact.last_name}
                </p>
                <div className="flex gap-6 mt-3 text-sm">
                  <p className="text-zinc-600">
                    <span className="font-medium">Phone:</span> {contact.phone || "N/A"}
                  </p>
                  <p className="text-zinc-600">
                    <span className="font-medium">Email:</span> {contact.email || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Log New Call Form */}
        {contactId && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-6 h-6 text-zinc-700" />
              <h2 className="text-2xl font-semibold text-zinc-900">Log New Call</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Call Result</label>
                <select
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 transition"
                >
                  <option value="connected">Connected</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Busy</option>
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="callback">Call Back Later</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 focus:outline-none focus:border-zinc-400 transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-600 mb-2">Call Notes</label>
                <textarea
                  placeholder="What was discussed? Any follow-up needed?"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="4"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl px-5 py-4 focus:outline-none focus:border-zinc-400 transition resize-y"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-medium transition flex items-center gap-3"
                >
                  <Phone className="w-5 h-5" />
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Call Logs Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-zinc-900 flex items-center gap-3">
              <Clock className="w-6 h-6" />
              Call History
            </h2>
            <p className="text-zinc-500 text-sm">{callLogs.length} calls logged</p>
          </div>

          {loading ? (
            <div className="p-20 text-center text-zinc-500">Loading call logs...</div>
          ) : callLogs.length === 0 ? (
            <div className="p-20 text-center">
              <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-xl font-medium text-zinc-400">No call logs yet</p>
              <p className="text-zinc-500 mt-2">Start logging calls above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-5 px-8 font-medium text-zinc-500 text-sm">Date & Time</th>
                    <th className="text-left py-5 px-4 font-medium text-zinc-500 text-sm">Result</th>
                    <th className="text-left py-5 px-4 font-medium text-zinc-500 text-sm">Duration</th>
                    <th className="text-left py-5 px-8 font-medium text-zinc-500 text-sm">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {callLogs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition">
                      <td className="py-6 px-8 text-zinc-700">
                        {new Date(log.call_time).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-6 px-4">
                        <span
                          className={`inline-block px-5 py-1.5 rounded-full text-xs font-medium capitalize ${
                            resultColors[log.result] || "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {log.result.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-zinc-600">
                        {log.duration_seconds
                          ? `${Math.floor(log.duration_seconds / 60)} min`
                          : "—"}
                      </td>
                      <td className="py-6 px-8 text-zinc-600 max-w-md">
                        {log.notes || <span className="italic text-zinc-400">No notes added</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallLogs;