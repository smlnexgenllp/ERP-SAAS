// src/components/modules/hr/CreateProjectForm.jsx (COMPACT & MINIMIZED)
import React, { useState } from 'react';
import api from '../../../services/api';
import { 
  FolderOpen, 
  Calendar, 
  FileText, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

const CreateProjectForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('PROJECT NAME REQUIRED');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/hr/projects/', {
        name: name.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate || null,
      });

      setMessage('PROJECT LAUNCHED');
      setName('');
      setDescription('');
      setEndDate('');
    } catch (err) {
      console.error('Project creation failed:', err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.name?.[0] ||
                       'LAUNCH FAILED';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-300 flex items-center justify-center gap-3">
            <FolderOpen className="w-8 h-8 text-cyan-400" />
            LAUNCH NEW PROJECT
            <Send className="w-8 h-8 text-cyan-400" />
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-mono">
            Initiate strategic directive
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-xl text-center font-mono border-2 mb-5 text-sm ${
            message.includes('LAUNCHED') || message.includes('SUCCESS')
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}>
            {message.includes('LAUNCHED') || message.includes('SUCCESS') ? (
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
            ) : (
              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Compact Form */}
        <div className="bg-gray-900/70 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <FolderOpen className="w-5 h-5" />
                PROJECT NAME *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Codename..."
                required
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <FileText className="w-5 h-5" />
                DIRECTIVE
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Scope and objectives..."
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition resize-none"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <Calendar className="w-5 h-5" />
                START
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="flex items-center gap-2 text-yellow-300 font-bold text-sm mb-2">
                <Calendar className="w-5 h-5 text-yellow-400" />
                TARGET END
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/60 border border-yellow-900/70 rounded-xl text-yellow-200 focus:border-yellow-500 transition"
              />
            </div>

            {/* Launch Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-50 transition shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  LAUNCHING...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  LAUNCH PROJECT
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-5 font-mono">
            Project available immediately after launch
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectForm;