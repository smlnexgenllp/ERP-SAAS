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
  const [members, setMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/hr/employees/')
      .then(res => {
        setEmployees(res.data);
        setLoadingEmployees(false);
      })
      .catch(err => {
        console.error("Failed to load employees", err);
        setMessage('Failed to load team members');
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
      setMessage('Project name is required');
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
        members: members,
      });

      setMessage('Project created successfully! Team chat is ready.');
      // Reset form
      setName('');
      setDescription('');
      setEndDate('');
      setMembers([]);
    } catch (err) {
      console.error('Project creation failed:', err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.name?.[0] ||
                       'Failed to create project';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-zinc-900 flex items-center justify-center gap-3">
            <FolderOpen className="w-9 h-9 text-zinc-700" />
            Create New Project
          </h2>
          <p className="text-zinc-500 mt-2">
            Assign team members • Project chat will be created automatically
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-2xl text-center mb-6 text-sm border ${
            message.toLowerCase().includes('success') || message.includes('created')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.toLowerCase().includes('success') ? (
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="flex items-center gap-2 text-zinc-700 font-semibold text-sm mb-2">
                <FolderOpen className="w-5 h-5" />
                PROJECT NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mobile App v2"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-zinc-700 font-semibold text-sm mb-2">
                <FileText className="w-5 h-5" />
                PROJECT DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Project goals, scope, and key deliverables..."
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 resize-none"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-zinc-700 font-semibold text-sm mb-2">
                  <Calendar className="w-5 h-5" />
                  START DATE
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-zinc-700 font-semibold text-sm mb-2">
                  <Calendar className="w-5 h-5" />
                  TARGET END DATE
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
                />
              </div>
            </div>

            {/* Team Members */}
            <div>
              <label className="flex items-center gap-2 text-zinc-700 font-semibold text-sm mb-3">
                <Users className="w-5 h-5" />
                ASSIGN TEAM MEMBERS
              </label>
              
              {loadingEmployees ? (
                <div className="flex items-center justify-center py-8 bg-white border border-zinc-200 rounded-2xl">
                  <p className="text-zinc-500">Loading team members...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 border border-zinc-200 rounded-2xl">
                  No employees found
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {employees.map(emp => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white border border-transparent hover:border-zinc-200 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={members.includes(emp.id)}
                          onChange={() => handleMemberToggle(emp.id)}
                          className="w-5 h-5 text-zinc-800 accent-zinc-800 rounded"
                        />
                        <div>
                          <p className="font-medium text-zinc-900">{emp.full_name}</p>
                          <p className="text-sm text-zinc-500">{emp.designation?.title || 'Employee'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-zinc-500 mt-3">
                Selected: <span className="font-semibold text-zinc-900">{members.length}</span> member{members.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || members.length === 0 || !name.trim()}
              className="w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 
                         bg-zinc-900 hover:bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  CREATING PROJECT...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  CREATE PROJECT & TEAM CHAT
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Team members will get immediate access to the project chat
        </p>
      </div>
    </div>
  );
};

export default CreateProjectForm;