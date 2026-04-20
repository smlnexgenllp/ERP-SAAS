// src/pages/modules/crm/ContactsList.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../../../context/AuthContext";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';

const TestContactsList = () => {
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
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token') || ''}` 
          },
        });
        if (!res.ok) throw new Error('Failed to load contacts');
        const data = await res.json();
        const contactList = data.results || data || [];
        setContacts(contactList);
        setFilteredContacts(contactList);
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
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
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
      setFilteredContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Error deleting contact: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/crm-test')}   // Changed to your test dashboard
              className="p-3 hover:bg-white rounded-2xl transition text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">All Contacts</h1>
                <p className="text-zinc-500 text-sm">{filteredContacts.length} contacts found</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/crm/contacts/new-test')}
            className="flex items-center gap-3 bg-zinc-900 hover:bg-black text-white px-6 py-3.5 rounded-3xl font-medium transition shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Contact
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-96 pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-3xl focus:outline-none focus:border-zinc-400 transition text-zinc-900 placeholder:text-zinc-400"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-5 px-8 font-medium text-zinc-500 text-sm">Name</th>
                  <th className="text-left py-5 px-6 font-medium text-zinc-500 text-sm">Company</th>
                  <th className="text-left py-5 px-6 font-medium text-zinc-500 text-sm">Email</th>
                  <th className="text-left py-5 px-6 font-medium text-zinc-500 text-sm">Status</th>
                  <th className="text-left py-5 px-8 font-medium text-zinc-500 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredContacts.map(contact => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-zinc-50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="font-semibold text-zinc-900">
                        {contact.first_name} {contact.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-zinc-600">
                      {contact.company || '—'}
                    </td>
                    <td className="px-6 py-6 text-zinc-600">
                      {contact.email || '—'}
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-block px-4 py-1 rounded-full text-xs font-medium capitalize
                        ${contact.status === 'new' ? 'bg-blue-100 text-blue-700' :
                          contact.status === 'interested' ? 'bg-purple-100 text-purple-700' :
                          contact.status === 'customer' ? 'bg-emerald-100 text-emerald-700' :
                          contact.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                          'bg-zinc-100 text-zinc-700'}`}>
                        {contact.status?.replace('_', ' ') || 'New'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => navigate(`/crm/contacts-test/${contact.id}`)}
                          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View</span>
                        </button>

                        <button
                          onClick={() => navigate(`/crm/contacts-test/${contact.id}/edit`)}
                          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="text-zinc-400">
                        No contacts found matching your search.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestContactsList;