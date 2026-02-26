// src/pages/modules/crm/ContactForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "../../../../context/AuthContext"; // adjust path

export default function ContactForm({ onSuccess }) {
  const { id } = useParams(); // id exists → edit mode
  const navigate = useNavigate();
  const { csrfToken } = useAuth(); // Get CSRF token from context

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'lead',
    notes: '',
  });

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contact data in edit mode
  useEffect(() => {
    if (!id) return;

    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${id}/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to load (${res.status})`);
        }

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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!csrfToken) {
      setError("CSRF token not available. Please refresh the page.");
      setSubmitting(false);
      return;
    }

    try {
      const url = id ? `/api/crm/contacts/${id}/` : '/api/crm/contacts/';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'X-CSRFToken': csrfToken, // ← This fixes CSRF 403
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.detail ||
          errData.non_field_errors?.[0] ||
          `Save failed (${res.status})`
        );
      }

      // Success
      if (onSuccess) onSuccess();
      navigate('/crm/contacts');
    } catch (err) {
      setError(err.message);
      console.error("Contact save error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-lg animate-pulse">Loading contact...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-300 mb-8">
          {id ? 'Edit Contact' : 'Create New Contact'}
        </h1>

        {error && (
          <div className="bg-red-900/60 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/40 border border-cyan-800 p-8 rounded-xl">
          <Input
            label="First Name *"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />

          <Input
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />

          <Input
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />

          <Input
            label="Position / Title"
            name="position"
            value={formData.position}
            onChange={handleChange}
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
            <option value="inactive">Inactive</option>
            <option value="supplier">Supplier</option>
            <option value="partner">Partner</option>
          </Select>

          <div className="md:col-span-2">
            <label className="block text-sm text-cyan-400 mb-2">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={5}
              className="w-full p-4 bg-gray-800 border border-cyan-800 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500 resize-y"
              placeholder="Additional notes, background info, next steps..."
            />
          </div>

          <div className="md:col-span-2 flex gap-4 mt-8">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
                submitting
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {submitting ? 'Saving...' : id ? 'Update Contact' : 'Create Contact'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/crm/contacts')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-cyan-200 py-3 px-6 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Reusable Components ──────────────────────────────────────────────── */

const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm text-cyan-400">{label}</span>
    <input
      {...props}
      className="w-full px-4 py-3 bg-gray-800 border border-cyan-800 rounded-lg text-cyan-200 placeholder-cyan-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-sm text-cyan-400">{label}</span>
    <select
      {...props}
      className="w-full px-4 py-3 bg-gray-800 border border-cyan-800 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
    >
      {children}
    </select>
  </label>
);