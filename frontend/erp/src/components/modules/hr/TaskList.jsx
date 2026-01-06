// src/components/TaskList.jsx (WITH SEARCH & FILTERS - CYBERPUNK STYLE)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import TaskCard from './TaskCard';
import { Search, Filter, Calendar, ArrowUpDown, User, Target, ChevronDown } from 'lucide-react';

const TaskList = ({ userRole }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
  const [progressFilter, setProgressFilter] = useState('all'); // all, 0-25, 26-50, 51-75, 76-100
  const [sortBy, setSortBy] = useState('created_desc'); // created_desc, created_asc, deadline_asc, progress_desc

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/hr/tasks/');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Task fetch failed:', err.response?.data || err);
      setError('TASK SYSTEM OFFLINE — Unable to retrieve tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filtered & Sorted Tasks
  const filteredAndSorted = useMemo(() => {
    let filtered = tasks;

    // Search by title or description
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      );
    }

    // Assigned To filter
    if (assignedToFilter) {
      filtered = filtered.filter(task =>
        task.assigned_to_name?.toLowerCase().includes(assignedToFilter.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => 
        (statusFilter === 'active' && !task.is_completed) ||
        (statusFilter === 'completed' && task.is_completed)
      );
    }

    // Progress filter
    if (progressFilter !== 'all') {
      filtered = filtered.filter(task => {
        const progress = task.progress_percentage || 0;
        switch (progressFilter) {
          case '0-25': return progress >= 0 && progress <= 25;
          case '26-50': return progress >= 26 && progress <= 50;
          case '51-75': return progress >= 51 && progress <= 75;
          case '76-100': return progress >= 76 && progress <= 100;
          default: return true;
        }
      });
    }

    // Sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'created_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'deadline_asc':
          return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
        case 'progress_desc':
          return (b.progress_percentage || 0) - (a.progress_percentage || 0);
        default:
          return 0;
      }
    });
  }, [tasks, searchTerm, assignedToFilter, statusFilter, progressFilter, sortBy]);

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
        <p className="mt-6 text-xl font-bold text-cyan-300 font-mono">LOADING TASKS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Filters - PERFECT RESPONSIVE ALIGNMENT */}
        <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-900/60 rounded-2xl p-6 mb-10 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
            </div>

            {/* Assigned To */}
            <div className="relative col-span-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Assigned to..."
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative col-span-1 lg:col-span-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>

            {/* Progress Filter */}
            <div className="relative col-span-1 lg:col-span-1">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="all">All Progress</option>
                <option value="0-25">0-25%</option>
                <option value="26-50">26-50%</option>
                <option value="51-75">51-75%</option>
                <option value="76-100">76-100%</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>

            {/* Sort By */}
            <div className="relative col-span-1 sm:col-span-1">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="deadline_asc">Earliest Deadline</option>
                <option value="progress_desc">Most Progress</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 pt-4 border-t border-cyan-900/40">
            <p className="text-sm text-gray-400 font-mono">
              Showing <span className="text-cyan-400 font-bold">{filteredAndSorted.length}</span> of{' '}
              <span className="text-gray-400">{tasks.length}</span> task{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && tasks.length > 0 && (
          <div className="text-center py-20 bg-gray-900/50 rounded-2xl border-4 border-dashed border-cyan-900/50">
            <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-3xl font-bold text-cyan-300 mb-4">NO TASKS FOUND</h3>
            <p className="text-lg text-gray-400 font-mono mb-6">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-24 bg-gray-900/50 border-4 border-dashed border-cyan-900/50 rounded-3xl">
            <div className="w-32 h-32 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Target className="w-16 h-16 text-gray-500" />
            </div>
            <h3 className="text-4xl font-bold text-cyan-300 mb-6">NO TASKS ASSIGNED</h3>
            <p className="text-2xl text-gray-400 font-mono mb-8">You're all caught up!</p>
            <p className="text-xl text-green-400 font-bold animate-pulse">🎉 Excellent work!</p>
          </div>
        )}

        {/* Tasks Grid */}
        {filteredAndSorted.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;