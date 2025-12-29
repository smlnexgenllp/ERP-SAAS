// src/components/modules/hr/ProjectList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  FolderOpen, 
  Edit3, 
  Trash2, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', end_date: '' });

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

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
        <p className="text-cyan-300 font-mono">SYNCING PROJECT DATABASE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-cyan-300 flex items-center justify-center gap-4">
          <FolderOpen className="w-10 h-10" />
          ACTIVE PROJECTS
        </h2>
        <p className="text-sm text-gray-400 mt-2 font-mono">
          {projects.length} project{projects.length !== 1 ? 's' : ''} in system
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-center font-mono border-2 ${
          message.includes('UPDATED') || message.includes('TERMINATED')
            ? 'bg-green-900/30 border-green-600 text-green-300'
            : 'bg-red-900/30 border-red-600 text-red-300'
        }`}>
          {message.includes('UPDATED') || message.includes('TERMINATED') ? (
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
          ) : (
            <AlertCircle className="w-6 h-6 mx-auto mb-1" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/40 border-2 border-dashed border-cyan-900/50 rounded-2xl">
          <FolderOpen className="w-20 h-20 text-cyan-400 mx-auto mb-4 opacity-40" />
          <p className="text-xl text-gray-400 font-mono">NO PROJECTS INITIATED</p>
          <p className="text-sm text-gray-500 mt-2">Create one to begin task organization</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-gray-900/60 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-5 hover:border-cyan-500 transition"
            >
              {editingId === project.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/60 border border-cyan-900 rounded-lg text-cyan-200 focus:border-cyan-500"
                    autoFocus
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows="2"
                    className="w-full px-3 py-2 bg-gray-800/60 border border-cyan-900 rounded-lg text-cyan-200 focus:border-cyan-500 resize-none"
                  />
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800/60 border border-cyan-900 rounded-lg text-cyan-200 focus:border-cyan-500"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdate}
                      className="flex-1 py-2 bg-green-600/70 hover:bg-green-500 rounded-lg font-mono text-sm flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      SAVE
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-700/70 hover:bg-gray-600 rounded-lg font-mono text-sm"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-cyan-300">
                      {project.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(project)}
                        className="p-2 bg-gray-800/60 hover:bg-cyan-900/60 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-cyan-300" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 bg-gray-800/60 hover:bg-red-900/60 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-400 mb-3">
                      {project.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Start: {project.start_date}
                    </span>
                    {project.end_date && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Calendar className="w-3 h-3" />
                        Target: {project.end_date}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;