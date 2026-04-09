// src/pages/modules/crm/ContactForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit3 } from 'lucide-react';

export default function ContactForm({ onSuccess }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'new',
    notes: '',
  });

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load contact');
        const data = await res.json();
        setFormData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = id ? `/api/crm/contacts/${id}/` : `/api/crm/contacts/`;
      const method = id ? 'PUT' : 'POST';

      const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };

      const res = await fetch(url, {
        method,
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Save failed");
      }

      if (onSuccess) onSuccess();
      navigate('/crm/contacts');

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center text-cyan-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/crm/contacts')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-3">
            {id ? <Edit3 className="text-cyan-400" size={26} /> : <UserPlus className="text-cyan-400" size={26} />}
            <h1 className="text-3xl font-bold text-cyan-300">
              {id ? 'Edit Contact' : 'Create New Contact'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-xl mb-6 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              >
                <option value="new">New Lead</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="customer">Customer</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Notes</label>
              <textarea
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about this contact..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm resize-y min-h-[100px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-10">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-2xl font-semibold transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : id ? "Update Contact" : "Create Contact"}
            </button>

            <button
              type="button"
              onClick={() => navigate('/crm/contacts')}
              className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-2xl font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}