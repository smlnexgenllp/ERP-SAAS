// src/pages/production/WorkOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Trash2, Loader2, AlertCircle, Clock, Calendar,
  Package, Factory, RefreshCw, Search, Filter,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../../../services/api';

const ITEMS_PER_PAGE = 10; // You can change this

const WorkOrderList = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'nearing', 'overdue'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/production/in-progress-workorders/');
      setWorkOrders(res.data);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (err) {
      console.error(err);
      setMessage('Failed to load Work Orders. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm(`Mark Work Order #${id} as Completed?`)) return;
    setActionLoading(id);
    try {
      const res = await api.post(`/production/workorders/${id}/complete/`);
      setMessage(res.data.message || 'Work Order completed successfully!');
      setSuccess(true);
      fetchWorkOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to complete Work Order');
      setSuccess(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to DELETE Work Order #${id}?`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/production/workorders/${id}/delete/`);
      setMessage(`Work Order #${id} deleted successfully.`);
      setSuccess(true);
      fetchWorkOrders();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete Work Order');
      setSuccess(false);
    } finally {
      setActionLoading(null);
    }
  };

  // Sort by recent created first + filter + search
  const processedWorkOrders = useMemo(() => {
    let result = [...workOrders];

    // Sort: Most recent first (assumes created_at field exists)
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || a.start_date || 0);
      const dateB = new Date(b.created_at || b.start_date || 0);
      return dateB - dateA;
    });

    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(wo =>
        wo.id.toString().includes(term) ||
        (wo.manufacturing_order?.product || '').toLowerCase().includes(term) ||
        (wo.machine?.name || '').toLowerCase().includes(term)
      );
    }

    // Status Filter (nearing / overdue)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === 'nearing') {
      result = result.filter(wo => {
        const finishDate = new Date(wo.finish_date);
        const diffTime = finishDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
        return diffDays > 0 && diffDays <= 7;
      });
    } else if (filterType === 'overdue') {
      result = result.filter(wo => {
        const finishDate = new Date(wo.finish_date);
        return finishDate < today;
      });
    }

    return result;
  }, [workOrders, searchTerm, filterType]);

  // Pagination logic
  const totalPages = Math.ceil(processedWorkOrders.length / ITEMS_PER_PAGE);
  const paginatedWorkOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedWorkOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [processedWorkOrders, currentPage]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Pagination handlers
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const prevPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              In-Progress Work Orders
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage ongoing production tasks</p>
          </div>
          <button
            onClick={fetchWorkOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh List
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by WO #, Product or Machine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 pl-11 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-3">
            <div className="text-gray-400 flex items-center gap-2">
              <Filter size={18} />
              <span className="text-sm">Filter:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-all"
            >
              <option value="all">All In-Progress</option>
              <option value="nearing">Nearing Deadline (≤ 7 days)</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 rounded-xl border-l-4 p-4 ${success ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
            <div className="flex items-center gap-3">
              {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium text-sm">{message}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && workOrders.length === 0 ? (
          <div className="flex justify-center items-center h-80">
            <Loader2 size={40} className="animate-spin text-cyan-400" />
          </div>
        ) : processedWorkOrders.length === 0 ? (
          <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">No matching Work Orders found</h3>
            <p className="text-gray-500 mt-2 text-sm">Try changing search term or filter</p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {paginatedWorkOrders.map((wo) => {
                const finishDate = new Date(wo.finish_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = finishDate < today;
                const daysLeft = Math.ceil((finishDate - today) / (1000 * 3600 * 24));

                return (
                  <div
                    key={wo.id}
                    className={`bg-gray-900/70 border rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/30 ${
                      isOverdue ? 'border-red-500/30' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="px-4 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/20">
                            IN PROGRESS
                          </div>
                          {isOverdue && (
                            <div className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded-full">
                              OVERDUE
                            </div>
                          )}
                          <h2 className="text-2xl font-semibold text-white">Work Order #{wo.id}</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">PRODUCT</p>
                            <p className="font-medium text-white flex items-center gap-2">
                              <Package size={16} className="text-cyan-400" />
                              {wo.manufacturing_order?.product || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">MACHINE</p>
                            <p className="font-medium text-white flex items-center gap-2">
                              <Factory size={16} className="text-purple-400" />
                              {wo.machine?.name}
                              <span className="text-gray-500 text-xs">({wo.machine?.code})</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">QUANTITY</p>
                            <p className="font-medium text-white">
                              {parseFloat(wo.quantity || 0).toLocaleString()} units
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">START DATE</p>
                            <p className="font-medium text-white flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              {new Date(wo.start_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-0.5">PLANNED FINISH</p>
                            <p className={`font-medium flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                              <Clock size={16} className={isOverdue ? 'text-red-400' : 'text-orange-400'} />
                              {new Date(wo.finish_date).toLocaleDateString('en-IN')}
                              {daysLeft > 0 && !isOverdue && (
                                <span className="text-xs text-gray-500">({daysLeft} days left)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[260px]">
                        <button
                          onClick={() => handleComplete(wo.id)}
                          disabled={actionLoading === wo.id}
                          className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {actionLoading === wo.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Complete
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(wo.id)}
                          disabled={actionLoading === wo.id}
                          className="flex-1 px-5 py-3 bg-red-600/80 hover:bg-red-700 disabled:bg-gray-700 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {actionLoading === wo.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <Trash2 size={18} />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-all"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <div className="flex gap-1 px-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-cyan-500 text-black font-semibold'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm transition-all"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Results info */}
            {processedWorkOrders.length > 0 && (
              <div className="mt-4 text-center text-gray-500 text-sm">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, processedWorkOrders.length)} of{' '}
                {processedWorkOrders.length} work orders
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkOrderList;