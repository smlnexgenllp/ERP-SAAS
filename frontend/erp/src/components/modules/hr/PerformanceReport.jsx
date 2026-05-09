// src/components/modules/hr/PerformanceReport.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { 
  TrendingUp, 
  FolderOpen,
  CheckCircle2, 
  CalendarDays,
  Loader2,
  AlertCircle
} from 'lucide-react';

const PerformanceReport = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const projRes = await api.get('/hr/projects/');
        const projList = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results || [];
        setProjects(projList);

        // Fetch overall report
        const reportRes = await api.get('/hr/performance-report/');
        setReport(reportRes.data);
      } catch (err) {
        console.error('Failed to load data:', err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProjectStats = () => {
    if (selectedProject === 'all' || !report) return report;
    return {
      weekly: { average_rating: '—', rated_days: 0 },
      monthly: { average_rating: '—', rated_days: 0 },
      tasks: { completed: 0, total: 0, completion_rate: 0 },
      note: 'Per-project detailed stats coming soon'
    };
  };

  const currentStats = selectedProject === 'all' ? report : getProjectStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-zinc-600" />
          <p className="text-zinc-500 mt-4">Loading performance report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 p-10 rounded-3xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium">Performance report is currently unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <TrendingUp className="w-10 h-10 text-emerald-600" />
          <h2 className="text-4xl font-bold text-zinc-900">Performance Report</h2>
        </div>
        <p className="text-zinc-500">Overall team performance and project insights</p>
      </div>

      {/* Project Selector */}
      <div className="max-w-md mx-auto">
        <label className="block text-sm font-medium text-zinc-600 mb-2 text-center">
          View Report For
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
        >
          <option value="all">All Projects (Overall Performance)</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Rating */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center hover:shadow-md transition">
          <CalendarDays className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 mb-1">WEEKLY AVERAGE</p>
          <p className="text-5xl font-bold text-zinc-900 mb-1">
            {currentStats.weekly.average_rating !== '—' 
              ? currentStats.weekly.average_rating.toFixed(1)
              : '—'}
          </p>
          <p className="text-sm text-zinc-500">
            {currentStats.weekly.rated_days} days rated this week
          </p>
        </div>

        {/* Monthly Rating */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center hover:shadow-md transition">
          <CalendarDays className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 mb-1">MONTHLY AVERAGE</p>
          <p className="text-5xl font-bold text-zinc-900 mb-1">
            {currentStats.monthly.average_rating !== '—' 
              ? currentStats.monthly.average_rating.toFixed(1)
              : '—'}
          </p>
          <p className="text-sm text-zinc-500">
            {currentStats.monthly.rated_days} days rated this month
          </p>
        </div>

        {/* Task Completion */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center hover:shadow-md transition">
          <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-500 mb-1">TASK COMPLETION</p>
          <p className="text-5xl font-bold text-teal-600 mb-1">
            {currentStats.tasks.completion_rate.toFixed(0)}%
          </p>
          <p className="text-sm text-zinc-500">
            {currentStats.tasks.completed} of {currentStats.tasks.total} tasks completed
          </p>
        </div>
      </div>

      {/* Note for Per-Project View */}
      {selectedProject !== 'all' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-3xl p-8 text-center">
          <p className="font-medium">Detailed per-project analytics are coming soon.</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-zinc-500 text-sm mt-8">
        Report generated on {new Date().toLocaleDateString('en-IN')}
      </div>
    </div>
  );
};

export default PerformanceReport;