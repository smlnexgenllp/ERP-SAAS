// EditGroupModal.jsx
import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function EditGroupModal({ group, onClose, onSuccess, currentUser }) {
  const [name, setName] = useState(group.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Try with trailing slash first
      const url = `/hr/chat/groups/${group.id}/update/`;
      
      console.log('Updating group at URL:', url);
      console.log('Request data:', { name: name.trim() });
      
      const response = await api.put(url, {
        name: name.trim()
      });
      
      console.log('Update response:', response.data);
      
      onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Failed to update group:', error);
      
      // Detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        console.error('Error headers:', error.response.headers);
        
        const errorMessage = error.response.data?.error || 
                            error.response.data?.detail || 
                            `Server error: ${error.response.status}`;
        setError(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setError('Error setting up request: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-100">Edit Group</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              placeholder="Enter group name"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}