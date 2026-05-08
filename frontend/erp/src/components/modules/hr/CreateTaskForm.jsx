// src/components/modules/hr/CreateTaskForm.jsx
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
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

const CreateTaskForm = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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
        if (Array.isArray(empRes.data)) employeeArray = empRes.data;
        else if (empRes.data?.employees) employeeArray = empRes.data.employees;
        else if (empRes.data?.results) employeeArray = empRes.data.results;
        else if (typeof empRes.data === 'object') {
          const found = Object.values(empRes.data).find(Array.isArray);
          employeeArray = found || [];
        }
        setEmployees(employeeArray);

        try {
          const projRes = await api.get('/hr/projects/');
          let projectArray = [];
          if (Array.isArray(projRes.data)) projectArray = projRes.data;
          else if (projRes.data?.results) projectArray = projRes.data.results;
          setProjects(projectArray);
        } catch (projErr) {
          console.warn('Projects not available:', projErr);
          setProjects([]);
        }
      } catch (err) {
        console.error('Data load failed:', err);
        setMessage('Failed to load data');
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
      setMessage('Please select at least one employee and enter a title');
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

      setMessage(`Task successfully assigned to ${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''}`);
      setTitle('');
      setDescription('');
      setSelectedEmployees([]);
      setSelectedProject('');
      setDropdownOpen(false);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to create task';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Create New Task</h1>
              <p className="text-zinc-500">Assign tasks to team members</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-sm ${
            message.includes('successfully') || message.includes('assigned')
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.includes('successfully') || message.includes('assigned') ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Project Selection */}
            <div>
              <label className="block text-zinc-700 font-medium mb-2 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Project (Optional)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Select Employees */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-zinc-700 font-medium mb-2 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assign To * ({selectedEmployees.length} selected)
              </label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                disabled={fetchLoading}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl text-left flex items-center justify-between hover:border-zinc-400 transition"
              >
                <span className="text-zinc-700">
                  {selectedEmployees.length === 0
                    ? 'Select employees...'
                    : `${selectedEmployees.length} employee${selectedEmployees.length > 1 ? 's' : ''} selected`}
                </span>
                {dropdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {dropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-zinc-200 rounded-3xl shadow-lg max-h-80 overflow-y-auto py-2">
                  {fetchLoading ? (
                    <p className="p-6 text-center text-zinc-500">Loading employees...</p>
                  ) : employees.length === 0 ? (
                    <p className="p-6 text-center text-zinc-500">No employees found</p>
                  ) : (
                    employees.map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={() => toggleEmployee(emp.id)}
                          className="w-5 h-5 accent-zinc-900"
                        />
                        <div>
                          <p className="font-medium text-zinc-900">{emp.full_name}</p>
                          <p className="text-xs text-zinc-500">
                            {emp.employee_code} • {emp.designation || emp.department}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-zinc-700 font-medium mb-2">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                required
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-zinc-700 font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Task details and requirements..."
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none resize-y"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-zinc-700 font-medium mb-2">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || fetchLoading || selectedEmployees.length === 0 || !title.trim()}
              className="w-full py-4 bg-zinc-900 hover:bg-black text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Create & Assign Task
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskForm;