// src/components/modules/hr/ProjectList.jsx
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
      setMessage('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? Tasks will remain but lose project link.')) return;

    try {
      await api.delete(`/hr/projects/${id}/`);
      setMessage('Project deleted successfully');
      fetchProjects();
    } catch (err) {
      setMessage('Deletion failed');
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
      setMessage('Project name is required');
      return;
    }

    try {
      await api.patch(`/hr/projects/${editingId}/`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        end_date: editForm.end_date || null
      });
      setMessage('Project updated successfully');
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      setMessage('Update failed');
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

    if (dateFrom) filtered = filtered.filter(p => p.start_date >= dateFrom);
    if (dateTo) filtered = filtered.filter(p => p.start_date <= dateTo);

    const today = new Date().toISOString().split('T')[0];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'active') return !p.end_date || p.end_date >= today;
        if (statusFilter === 'completed') return p.end_date && p.end_date < today;
        return true;
      });
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'start_asc': return new Date(a.start_date) - new Date(b.start_date);
        case 'start_desc': return new Date(b.start_date) - new Date(a.start_date);
        case 'end_asc': return new Date(a.end_date || '9999-12-31') - new Date(b.end_date || '9999-12-31');
        case 'end_desc': return new Date(b.end_date || '9999-12-31') - new Date(a.end_date || '9999-12-31');
        default: return 0;
      }
    });
  }, [projects, searchTerm, dateFrom, dateTo, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-zinc-400 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-zinc-900 flex items-center justify-center gap-4">
            <FolderOpen className="w-10 h-10 text-zinc-700" />
            Projects
          </h2>
          <p className="text-zinc-500 mt-2">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-2xl text-center mb-8 text-sm border ${
            message.includes('success') || message.includes('updated') || message.includes('deleted')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.includes('success') || message.includes('updated') || message.includes('deleted') ? (
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            {/* Sort By */}
            <div className="relative">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 appearance-none cursor-pointer"
              >
                <option value="start_desc">Newest First</option>
                <option value="start_asc">Oldest First</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="end_asc">End Date Soonest</option>
                <option value="end_desc">End Date Latest</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-semibold text-zinc-900">{filteredAndSorted.length}</span> of{' '}
              <span className="font-medium">{projects.length}</span> projects
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && projects.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <FolderOpen className="w-20 h-20 text-zinc-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-zinc-900 mb-2">No matching projects</h3>
            <p className="text-zinc-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <FolderOpen className="w-24 h-24 text-zinc-300 mx-auto mb-6" />
            <h3 className="text-3xl font-semibold text-zinc-900 mb-3">No Projects Yet</h3>
            <p className="text-zinc-500">Create your first project to get started</p>
          </div>
        )}

        {/* Projects Grid */}
        {filteredAndSorted.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-zinc-700 to-zinc-400"></div>

                <div className="p-6">
                  {editingId === project.id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 text-lg font-medium"
                        autoFocus
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows="3"
                        placeholder="Project description..."
                        className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 resize-none"
                      />
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400"
                      />
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={handleUpdate}
                          className="flex-1 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl font-medium transition"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-6 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-zinc-900">{project.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(project)}
                            className="p-2.5 hover:bg-zinc-100 rounded-xl transition"
                            title="Edit"
                          >
                            <Edit3 className="w-5 h-5 text-zinc-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2.5 hover:bg-red-50 rounded-xl transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-zinc-600 mb-6 line-clamp-3">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Calendar className="w-4 h-4" />
                          Start: <span className="text-zinc-700 font-medium">{project.start_date}</span>
                        </div>
                        {project.end_date && (
                          <div className={`flex items-center gap-2 ${project.end_date < new Date().toISOString().split('T')[0] ? 'text-red-600' : 'text-amber-600'}`}>
                            <Calendar className="w-4 h-4" />
                            Target: <span className="font-medium">{project.end_date}</span>
                          </div>
                        )}
                      </div>

                      {project.end_date && project.end_date < new Date().toISOString().split('T')[0] && (
                        <div className="mt-5 inline-block px-4 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-2xl">
                          COMPLETED
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