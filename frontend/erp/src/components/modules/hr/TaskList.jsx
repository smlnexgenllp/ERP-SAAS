// src/components/TaskList.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../../../services/api';
import TaskCard from './TaskCard';
import { Search, Filter, Calendar, ArrowUpDown, User, Target, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const TaskList = ({ userRole }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToFilter, setAssignedToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/hr/tasks/');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Task fetch failed:', err);
      setError('Unable to retrieve tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, assignedToFilter, statusFilter, progressFilter, sortBy]);

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

  // Pagination Logic
  const totalItems = filteredAndSorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSorted.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-500 mt-4">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Filters Bar */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              />
            </div>

            {/* Assigned To */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Assigned to..."
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Progress Filter */}
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 appearance-none cursor-pointer"
              >
                <option value="all">All Progress</option>
                <option value="0-25">0-25%</option>
                <option value="26-50">26-50%</option>
                <option value="51-75">51-75%</option>
                <option value="76-100">76-100%</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="relative">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none text-zinc-800 appearance-none cursor-pointer"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="deadline_asc">Earliest Deadline</option>
                <option value="progress_desc">Most Progress</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-6 pt-4 border-t border-zinc-100">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-semibold text-zinc-900">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> tasks
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && tasks.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center">
            <Search className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-zinc-900 mb-2">No tasks found</h3>
            <p className="text-zinc-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <Target className="w-20 h-20 text-zinc-300 mx-auto mb-6" />
            <h3 className="text-3xl font-semibold text-zinc-900 mb-3">No Tasks Assigned</h3>
            <p className="text-zinc-500 text-lg">You're all caught up!</p>
          </div>
        )}

        {/* Tasks Grid */}
        {currentItems.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentItems.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleTaskUpdate}
                />
              ))}
            </div>

            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-sm focus:border-zinc-400 outline-none cursor-pointer"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                  <span className="text-sm text-zinc-600">per page</span>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                  </button>
                  
                  <div className="flex gap-1">
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-zinc-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[38px] h-10 px-3 rounded-xl font-medium transition-all ${
                            currentPage === page
                              ? 'bg-zinc-900 text-white shadow-sm'
                              : 'hover:bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                  </button>
                </div>

                {/* Page info */}
                <div className="text-sm text-zinc-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskList;