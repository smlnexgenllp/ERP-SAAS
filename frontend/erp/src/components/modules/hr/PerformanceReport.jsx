// src/components/modules/hr/PerformanceReport.jsx (PER-PROJECT PERFORMANCE)
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
  const [selectedProject, setSelectedProject] = useState('all'); // 'all' = overall
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch projects and performance
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch projects
        const projRes = await api.get('/hr/projects/');
        const projList = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results || [];
        setProjects(projList);

        // Fetch overall report (your existing endpoint)
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

  // Calculate project-specific stats (client-side for now)
  const getProjectStats = () => {
    if (selectedProject === 'all' || !report) return report;

    // This is a placeholder — ideally, backend should provide per-project stats
    // For now, show message
    return {
      weekly: { average_rating: '—', rated_days: 0 },
      monthly: { average_rating: '—', rated_days: 0 },
      tasks: { completed: 0, total: 0, completion_rate: 0 },
      note: 'Per-project stats coming soon'
    };
  };

  const currentStats = selectedProject === 'all' ? report : getProjectStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-6" />
        <p className="text-xl text-cyan-300 font-mono">LOADING METRICS...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-xl text-red-400 font-mono">REPORT UNAVAILABLE</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-4 mb-5">
          <TrendingUp className="w-12 h-12 text-cyan-400 animate-pulse" />
          <h2 className="text-3xl font-bold text-cyan-300">
            PERFORMANCE REPORT
          </h2>
        </div>

        {/* Project Selector */}
        <div className="max-w-md mx-auto">
          <label className="flex items-center gap-3 text-cyan-300 font-bold text-sm mb-3 justify-center">
            <FolderOpen className="w-6 h-6" />
            VIEW BY PROJECT
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-5 py-3 bg-gray-800/60 border-2 border-cyan-900 rounded-xl text-cyan-200 font-mono focus:border-cyan-500 transition"
          >
            <option value="all">All Projects (Overall)</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Weekly Rating */}
        <div className="bg-gray-900/60 backdrop-blur border-2 border-cyan-900 rounded-2xl p-8 text-center hover:border-cyan-500 transition">
          <CalendarDays className="w-14 h-14 text-cyan-400 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-3 font-mono">WEEKLY RATING</p>
          <p className="text-5xl font-bold text-cyan-300 mb-2">
            {currentStats.weekly.average_rating !== '—' 
              ? `${currentStats.weekly.average_rating.toFixed(1)}/5`
              : '—'}
          </p>
          <p className="text-sm text-gray-400">
            {currentStats.weekly.rated_days} days rated
          </p>
        </div>

        {/* Monthly Rating */}
        <div className="bg-gray-900/60 backdrop-blur border-2 border-yellow-900/70 rounded-2xl p-8 text-center hover:border-yellow-500 transition">
          <CalendarDays className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-3 font-mono">MONTHLY RATING</p>
          <p className="text-5xl font-bold text-yellow-300 mb-2">
            {currentStats.monthly.average_rating !== '—' 
              ? `${currentStats.monthly.average_rating.toFixed(1)}/5`
              : '—'}
          </p>
          <p className="text-sm text-gray-400">
            {currentStats.monthly.rated_days} days rated
          </p>
        </div>

        {/* Task Completion */}
        <div className="bg-gray-900/60 backdrop-blur border-2 border-green-900/70 rounded-2xl p-8 text-center hover:border-green-500 transition">
          <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <p className="text-lg text-gray-400 mb-3 font-mono">TASK COMPLETION</p>
          <p className="text-5xl font-bold text-green-300 mb-2">
            {currentStats.tasks.completion_rate.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-400">
            {currentStats.tasks.completed} / {currentStats.tasks.total} tasks
          </p>
        </div>
      </div>

      {/* Note for per-project */}
      {selectedProject !== 'all' && (
        <div className="text-center text-gray-500 text-sm font-mono mt-6 italic">
          Individual project performance analytics coming soon
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs font-mono mt-8">
        Data synced • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default PerformanceReport;