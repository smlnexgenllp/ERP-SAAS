// src/pages/modules/crm/ContactDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/crm/contacts/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        if (!res.ok) throw new Error('Failed to load contact');
        const data = await res.json();
        setContact(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-950 p-6 text-red-300">{error}</div>;
  if (!contact) return <div className="min-h-screen bg-gray-950 p-6">Contact not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-300">
            {contact.first_name} {contact.last_name}
          </h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate(`/crm/contacts/${id}/edit`)}
              className="bg-blue-300 hover:bg-cyan-600 text-gray-950 px-5 py-2 rounded-lg"
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/crm/contacts')}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg"
            >
              Back to List
            </button>
          </div>
        </div>

        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-cyan-400 text-sm">Email</p>
              <p className="text-xl">{contact.email || '—'}</p>
            </div>
            <div>
              <p className="text-cyan-400 text-sm">Phone</p>
              <p className="text-xl">{contact.phone || '—'}</p>
            </div>
            <div>
              <p className="text-cyan-400 text-sm">Company</p>
              <p className="text-xl">{contact.company || '—'}</p>
            </div>
            <div>
              <p className="text-cyan-400 text-sm">Position</p>
              <p className="text-xl">{contact.position || '—'}</p>
            </div>
            <div>
              <p className="text-cyan-400 text-sm">Status</p>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                contact.status === 'lead' ? 'bg-yellow-900 text-yellow-200' :
                contact.status === 'customer' ? 'bg-green-900 text-green-200' :
                'bg-gray-700 text-gray-300'
              }`}>
                {contact.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {contact.notes && (
            <div>
              <p className="text-cyan-400 text-sm mb-2">Notes</p>
              <p className="bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* You can add linked opportunities here later */}
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;