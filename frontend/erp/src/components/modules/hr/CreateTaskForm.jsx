// src/components/modules/hr/CreateTaskForm.jsx (DROPDOWN WITH CHECKBOXES)
import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import {
  Users,
  Target,
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const CreateTaskForm = () => {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Array of IDs
  const [selectedProject, setSelectedProject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true);
      try {
        const empRes = await api.get('/hr/payroll/employees/');
        let employeeArray = [];
        if (Array.isArray(empRes.data)) {
          employeeArray = empRes.data;
        } else if (empRes.data?.employees) {
          employeeArray = empRes.data.employees;
        } else if (empRes.data?.results) {
          employeeArray = empRes.data.results;
        } else if (typeof empRes.data === 'object') {
          const found = Object.values(empRes.data).find(Array.isArray);
          employeeArray = found || [];
        }
        setEmployees(employeeArray);

        try {
          const projRes = await api.get('/hr/projects/');
          let projectArray = [];
          if (Array.isArray(projRes.data)) {
            projectArray = projRes.data;
          } else if (projRes.data?.results) {
            projectArray = projRes.data.results;
          }
          setProjects(projectArray);
        } catch (projErr) {
          console.warn('Projects not available:', projErr);
          setProjects([]);
        }
      } catch (err) {
        console.error('Data load failed:', err);
        setMessage('DATABASE LINK DOWN');
        setEmployees([]);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleEmployee = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmployees.length === 0 || !title.trim()) {
      setMessage('AT LEAST ONE OPERATIVE AND TITLE REQUIRED');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const promises = selectedEmployees.map(empId =>
        api.post('/hr/tasks/', {
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadline || null,
          assigned_to: empId,
          project: selectedProject ? Number(selectedProject) : null,
        })
      );

      await Promise.all(promises);

      setMessage(`MISSION DEPLOYED TO ${selectedEmployees.length} OPERATIVE${selectedEmployees.length > 1 ? 'S' : ''}`);
      setTitle('');
      setDescription('');
      setSelectedEmployees([]);
      setSelectedProject('');
      setDropdownOpen(false);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'DEPLOYMENT FAILED';
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
          <h2 className="text-3xl font-bold text-cyan-300 flex items-center justify-center gap-4">
            <Target className="w-10 h-10 text-cyan-400" />
            ASSIGN MISSION
            <Send className="w-10 h-10 text-cyan-400" />
          </h2>
          <p className="text-sm text-gray-400 mt-2">Select multiple operatives from dropdown</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-center font-mono border-2 mb-6 text-sm ${
            message.includes('DEPLOYED')
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}>
            {message.includes('DEPLOYED') ? (
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            ) : (
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-900/70 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Project */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <FolderOpen className="w-5 h-5" />
                PROJECT
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              >
                <option value="">-- No Project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown with Checkboxes */}
            <div ref={dropdownRef}>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <Users className="w-5 h-5" />
                OPERATIVES * ({selectedEmployees.length} selected)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={fetchLoading}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 flex items-center justify-between focus:border-cyan-500 transition disabled:opacity-50"
                >
                  <span>
                    {selectedEmployees.length === 0
                      ? 'Select operatives...'
                      : `${selectedEmployees.length} selected`}
                  </span>
                  {dropdownOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-gray-900/90 backdrop-blur border-2 border-cyan-900 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {fetchLoading ? (
                      <p className="p-4 text-center text-gray-400">SYNCING ROSTER...</p>
                    ) : employees.length === 0 ? (
                      <p className="p-4 text-center text-gray-400">NO OPERATIVES</p>
                    ) : (
                      employees.map((emp) => (
                        <label
                          key={emp.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-800/60 transition cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="w-5 h-5 text-cyan-500 rounded focus:ring-cyan-500 border-gray-600"
                          />
                          <div>
                            <p className="text-cyan-200 font-mono">
                              {emp.full_name} ({emp.employee_code})
                            </p>
                            <p className="text-xs text-gray-400">
                              {emp.department && `${emp.department}`}
                              {emp.department && emp.designation && ' • '}
                              {emp.designation}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <Target className="w-5 h-5" />
                TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Primary objective..."
                required
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <FileText className="w-5 h-5" />
                BRIEFING
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Details and parameters..."
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition resize-none"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <Calendar className="w-5 h-5" />
                DEADLINE
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || fetchLoading || selectedEmployees.length === 0}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-500 hover:to-green-500 disabled:opacity-50 transition shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  DEPLOYING...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  DEPLOY TO {selectedEmployees.length} OPERATIVE{selectedEmployees.length !== 1 ? 'S' : ''}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6 font-mono">
            Click dropdown to select multiple operatives
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskForm;