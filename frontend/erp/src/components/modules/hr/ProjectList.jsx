// src/components/modules/hr/ProjectList.jsx (text-2xl REMOVED - CLEAN SIZES)
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { 
  FolderOpen, Edit3, Trash2, Loader2, AlertCircle, CheckCircle2, 
  Calendar, Search, Filter, ArrowUpDown, ChevronDown 
} from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', end_date: '' });

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('start_desc');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hr/projects/');
      setProjects(res.data || []);
    } catch (err) {
      setMessage('FAILED TO LOAD PROJECTS');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? Tasks will remain but lose project link.')) return;

    try {
      await api.delete(`/hr/projects/${id}/`);
      setMessage('PROJECT TERMINATED');
      fetchProjects();
    } catch (err) {
      setMessage('DELETION FAILED');
    }
  };

  const startEdit = (project) => {
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      description: project.description || '',
      end_date: project.end_date || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', end_date: '' });
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) {
      setMessage('PROJECT NAME REQUIRED');
      return;
    }

    try {
      await api.patch(`/hr/projects/${editingId}/`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        end_date: editForm.end_date || null
      });
      setMessage('PROJECT UPDATED');
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      setMessage('UPDATE FAILED');
    }
  };

  // Filtered & Sorted Projects
  const filteredAndSorted = useMemo(() => {
    let filtered = projects;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(p => p.start_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(p => p.start_date <= dateTo);
    }

    const today = new Date().toISOString().split('T')[0];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'active') {
          return !p.end_date || p.end_date >= today;
        }
        if (statusFilter === 'completed') {
          return p.end_date && p.end_date < today;
        }
        return true;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'start_asc':
          return new Date(a.start_date) - new Date(b.start_date);
        case 'start_desc':
          return new Date(b.start_date) - new Date(a.start_date);
        case 'end_asc':
          return new Date(a.end_date || '9999-12-31') - new Date(b.end_date || '9999-12-31');
        case 'end_desc':
          return new Date(b.end_date || '9999-12-31') - new Date(a.end_date || '9999-12-31');
        default:
          return 0;
      }
    });
  }, [projects, searchTerm, dateFrom, dateTo, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <Loader2 className="w-24 h-24 text-cyan-400 animate-spin mb-8" />
        <p className=" font-bold text-cyan-300 font-mono">SYNCING PROJECT DATABASE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className=" font-bold text-cyan-300 flex items-center justify-center gap-6 mb-4">
            <FolderOpen className="w-16 h-16" />
            ACTIVE PROJECTS
          </h2>
          <p className=" text-gray-400 font-mono">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in system
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl text-center font-mono border-2 mb-8 ${
            message.includes('UPDATED') || message.includes('TERMINATED')
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}>
            {message.includes('UPDATED') || message.includes('TERMINATED') ? (
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            ) : (
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            )}
            <p className="text-base">{message}</p>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-900/60 rounded-2xl p-6 mb-10 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>

            {/* Sort By */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="start_desc">Newest First</option>
                <option value="start_asc">Oldest First</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="end_asc">End Date Soonest</option>
                <option value="end_desc">End Date Latest</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cyan-900/40">
            <p className=" text-gray-400 font-mono">
              Showing <span className="text-cyan-400 font-bold">{filteredAndSorted.length}</span> of{' '}
              <span className="text-gray-400">{projects.length}</span> project{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && projects.length > 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-4 border-dashed border-cyan-900/50">
            <FolderOpen className="w-24 h-24 text-gray-500 mx-auto mb-6" />
            <h3 className=" font-bold text-cyan-300 mb-4">NO PROJECTS MATCH</h3>
            <p className=" text-gray-400 font-mono">Try adjusting your filters</p>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-24 bg-gray-900/50 border-4 border-dashed border-cyan-900/50 rounded-3xl">
            <FolderOpen className="w-32 h-32 text-cyan-400 mx-auto mb-8 opacity-40" />
            <h3 className=" font-bold text-cyan-300 mb-6">NO PROJECTS INITIATED</h3>
            <p className=" text-gray-400 font-mono">Create one to begin task organization</p>
          </div>
        )}

        {/* Project Grid */}
        {filteredAndSorted.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900/70 backdrop-blur-md border-2 border-cyan-900/80 rounded-2xl shadow-xl hover:shadow-cyan-500/60 hover:border-cyan-500 transition-all duration-400 overflow-hidden group"
              >
                <div className="h-1.5 bg-gradient-to-r from-purple-600 via-cyan-400 to-green-500"></div>

                <div className="p-6">
                  {editingId === project.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-lg text-cyan-200 focus:border-cyan-500 text-lg font-medium"
                        autoFocus
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows="3"
                        placeholder="Project description..."
                        className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-lg text-gray-300 focus:border-cyan-500 resize-none"
                      />
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800/60 border border-cyan-900 rounded-lg text-gray-200 focus:border-cyan-500"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={handleUpdate}
                          className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-mono text-white font-bold flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          SAVE CHANGES
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-3 bg-gray-700/70 hover:bg-gray-600 rounded-lg font-mono text-gray-300"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <h3 className=" font-bold text-cyan-300 group-hover:text-cyan-200 transition">
                          {project.name}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(project)}
                            className="p-2.5 bg-gray-800/60 hover:bg-cyan-900/60 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5 text-cyan-300" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2.5 bg-gray-800/60 hover:bg-red-900/60 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {project.description && (
                        <p className=" text-gray-300 mb-5 leading-relaxed">
                          {project.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          Start: <span className="text-cyan-300">{project.start_date}</span>
                        </span>
                        {project.end_date && (
                          <span className={`flex items-center gap-2 ${project.end_date < new Date().toISOString().split('T')[0] ? 'text-red-400' : 'text-yellow-400'}`}>
                            <Calendar className="w-4 h-4" />
                            Target: <span className="font-mono">{project.end_date}</span>
                          </span>
                        )}
                      </div>

                      {project.end_date && project.end_date < new Date().toISOString().split('T')[0] && (
                        <div className="mt-4 inline-block px-4 py-2 bg-red-900/40 border border-red-600/60 rounded-lg text-red-300 font-mono text-sm">
                          COMPLETED / ARCHIVED
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;