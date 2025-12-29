// src/components/modules/hr/CreateProjectForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  FolderOpen, 
  Calendar, 
  FileText, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Users
} from 'lucide-react';

const CreateProjectForm = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [members, setMembers] = useState([]); // ← Selected employee IDs
  const [employees, setEmployees] = useState([]); // ← All available employees
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch employees from your organization
  useEffect(() => {
    api.get('/hr/employees/') // Adjust endpoint if needed
      .then(res => {
        setEmployees(res.data);
        setLoadingEmployees(false);
      })
      .catch(err => {
        console.error("Failed to load employees", err);
        setMessage('FAILED TO LOAD TEAM MEMBERS');
        setLoadingEmployees(false);
      });
  }, []);

  const handleMemberToggle = (employeeId) => {
    setMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

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
        members: members, // ← Send selected member IDs
      });

      setMessage('PROJECT LAUNCHED - TEAM CHAT READY');
      // Reset form
      setName('');
      setDescription('');
      setEndDate('');
      setMembers([]);
    } catch (err) {
      console.error('Project creation failed:', err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.name?.[0] ||
                       err.response?.data?.members?.[0] ||
                       'LAUNCH FAILED';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-300 flex items-center justify-center gap-3">
            <FolderOpen className="w-8 h-8 text-cyan-400" />
            LAUNCH NEW PROJECT
            <Send className="w-8 h-8 text-cyan-400" />
          </h2>
          <p className="text-sm text-gray-400 mt-2 font-mono">
            Assign team members → Project chat auto-created
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-center font-mono border-2 mb-6 text-sm ${
            message.includes('LAUNCHED') || message.includes('READY')
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}>
            {message.includes('LAUNCHED') ? (
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            ) : (
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-900/70 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="e.g. Mobile App v2"
                required
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <FileText className="w-5 h-5" />
                MISSION BRIEF
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Project goals and scope..."
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                  <Calendar className="w-5 h-5" />
                  START DATE
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
                />
              </div>
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
            </div>

            {/* Team Members */}
            <div>
              <label className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-3">
                <Users className="w-5 h-5" />
                ASSIGN TEAM MEMBERS
              </label>
              {loadingEmployees ? (
                <p className="text-gray-500 text-sm">Loading team members...</p>
              ) : employees.length === 0 ? (
                <p className="text-gray-500 text-sm">No employees found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-800/50 rounded-xl border border-cyan-900/50">
                  {employees.map(emp => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700/50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={members.includes(emp.id)}
                        onChange={() => handleMemberToggle(emp.id)}
                        className="w-5 h-5 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-cyan-200">{emp.full_name}</p>
                        <p className="text-xs text-gray-400">{emp.designation?.title || 'Employee'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Selected: {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || members.length === 0}
              className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  LAUNCHING PROJECT...
                </>
              ) : (
                <>
                  <Send className="w-7 h-7" />
                  LAUNCH PROJECT & CREATE TEAM CHAT
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6 font-mono">
            Team members will immediately get access to project chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectForm;