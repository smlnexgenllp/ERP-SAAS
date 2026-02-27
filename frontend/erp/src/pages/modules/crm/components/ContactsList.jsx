// src/pages/modules/crm/ContactsList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../context/AuthContext";

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
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-300">Contacts</h1>
          <button
            onClick={() => navigate('/crm/contacts/new')}
            className="bg-blue-300 hover:bg-cyan-600 text-gray-950 px-5 py-2 rounded-lg font-medium"
          >
            + New Contact
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name, email or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-96 mb-6 p-3 bg-gray-800 border border-cyan-800 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500"
        />

        {error && <div className="bg-red-900/50 p-4 rounded-xl mb-6">{error}</div>}

        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-cyan-900">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                  </td>
                  <td className="px-6 py-4 text-cyan-200">{contact.company || '—'}</td>
                  <td className="px-6 py-4 text-cyan-200">{contact.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      contact.status === 'lead' ? 'bg-yellow-900 text-yellow-200' :
                      contact.status === 'customer' ? 'bg-green-900 text-green-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {contact.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                      className="text-cyan-400 hover:text-cyan-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/crm/contacts/${contact.id}/edit`)}
                      className="text-blue-400 hover:text-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-cyan-400">
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