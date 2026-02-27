// src/pages/modules/crm/ContactForm.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
      const url = id
        ? `/api/crm/contacts/${id}/`
        : `/api/crm/contacts/`;

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
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold text-blue-300 mb-8">
          {id ? 'Edit Contact' : 'Create New Contact'}
        </h1>

        {error && (
          <div className="bg-red-900 p-4 rounded mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 p-8 rounded-xl">

          <Input label="First Name *" name="first_name" value={formData.first_name} onChange={handleChange} required />
          <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
          <Input label="Company" name="company" value={formData.company} onChange={handleChange} />
          <Input label="Position" name="position" value={formData.position} onChange={handleChange} />

          <Select label="Status" name="status" value={formData.status} onChange={handleChange}>
            <option value="new">New Lead</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="customer">Customer</option>
            <option value="inactive">Inactive</option>
          </Select>

          <div className="md:col-span-2">
            <label className="block text-sm mb-2">Notes</label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-4 bg-gray-800 rounded"
            />
          </div>

          <div className="md:col-span-2 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 py-3 rounded hover:bg-blue-500"
            >
              {submitting ? "Saving..." : id ? "Update Contact" : "Create Contact"}
            </button>

            <button
              type="button"
              onClick={() => navigate('/crm/contacts')}
              className="flex-1 bg-gray-700 py-3 rounded"
            >
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm">{label}</span>
    <input {...props} className="bg-gray-800 p-3 rounded" />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm">{label}</span>
    <select {...props} className="bg-gray-800 p-3 rounded">
      {children}
    </select>
  </label>
);