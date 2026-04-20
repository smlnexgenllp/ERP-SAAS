// src/pages/modules/crm/ContactForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit3, Save } from 'lucide-react';

export default function TestContactForm({ onSuccess }) {
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
      navigate('/crm/contacts-test');

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4">Loading contact form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate('/crm/contacts-test')}
            className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
              {id ? <Edit3 className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {id ? 'Edit Contact' : 'Create New Contact'}
              </h1>
              <p className="text-zinc-500 text-sm">
                {id ? 'Update contact information' : 'Add a new lead to your CRM'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8 md:p-10">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="example@company.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="Company name"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">Position / Title</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                  placeholder="e.g. Marketing Manager"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-600 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 transition text-zinc-900"
                >
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="interested">Interested</option>
                  <option value="qualified">Qualified</option>
                  <option value="customer">Customer</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-600 mb-2">Notes / Additional Information</label>
                <textarea
                  name="notes"
                  rows={5}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any important notes, preferences, or context about this contact..."
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 transition text-zinc-900 resize-y min-h-[120px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-3 bg-zinc-900 hover:bg-black text-white py-4 rounded-3xl font-semibold transition disabled:opacity-70"
              >
                <Save className="w-5 h-5" />
                {submitting ? "Saving..." : id ? "Update Contact" : "Create Contact"}
              </button>

              <button
                type="button"
                onClick={() => navigate('/crm/contacts-test')}
                className="flex-1 py-4 bg-white border border-zinc-300 hover:border-zinc-400 text-zinc-700 rounded-3xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}