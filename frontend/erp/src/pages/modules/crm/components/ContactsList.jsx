// src/pages/modules/crm/ContactsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/AuthContext";
import {
  ArrowLeft,
  Users,
} from 'lucide-react';

const ContactsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/crm/contacts/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (!res.ok) throw new Error('Failed to load contacts');
        const data = await res.json();
        setContacts(data.results || data || []);
        setFilteredContacts(data.results || data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredContacts(
        contacts.filter(c =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(term) ||
          (c.email?.toLowerCase().includes(term)) ||
          (c.company?.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, contacts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
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
      const res = await fetch(`/api/crm/contacts/${id}/`, {
        method: 'DELETE',
        headers: {
          "X-CSRFToken": getCsrfToken(),
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Error deleting contact: ' + err.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/crm/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <Users className="text-cyan-400" size={28} />
              <h1 className="text-3xl font-bold text-cyan-300">Contacts</h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/crm/contacts/new')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2"
          >
            + New Contact
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name, email or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-96 mb-6 p-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 outline-none"
        />

        {error && <div className="bg-red-900/50 p-4 rounded-xl mb-6 text-red-300">{error}</div>}

        <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/80">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-200">
                      {contact.first_name} {contact.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{contact.company || '—'}</td>
                  <td className="px-6 py-4 text-gray-300">{contact.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      contact.status === 'lead' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                      contact.status === 'customer' ? 'bg-green-900 text-green-300 border border-green-700' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {contact.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-4">
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      className="text-cyan-400 hover:text-cyan-300 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}/edit`)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactsList;