// src/pages/production/WorkOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Calendar,
  Package, 
  Factory, 
  RefreshCw, 
  Search, 
  Filter,
  ChevronLeft, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import api from '../../../../services/api';

const ITEMS_PER_PAGE = 10;

const WorkOrderList = () => {
  const navigate = useNavigate();

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
      setCurrentPage(1);
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

  // Processed & Filtered Data
  const processedWorkOrders = useMemo(() => {
    let result = [...workOrders];

    // Sort: Most recent first
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

    // Status Filter
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

  // Pagination
  const totalPages = Math.ceil(processedWorkOrders.length / ITEMS_PER_PAGE);
  const paginatedWorkOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedWorkOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [processedWorkOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const prevPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  In-Progress Work Orders
                </h1>
                <p className="text-zinc-500">Manage ongoing production tasks</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchWorkOrders}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition disabled:opacity-70"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            <span className="font-medium">Refresh List</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by WO #, Product or Machine..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>

          <div className="flex items-center gap-3 min-w-[240px]">
            <div className="text-zinc-500 flex items-center gap-2">
              <Filter size={20} />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl focus:outline-none focus:border-zinc-400"
            >
              <option value="all">All In-Progress</option>
              <option value="nearing">Nearing Deadline (≤ 7 days)</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 ${
            success 
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
              : 'bg-red-100 border-red-200 text-red-700'
          }`}>
            {success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Loading / Empty / Table */}
        {loading && workOrders.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="flex flex-col items-center">
              <Loader2 size={48} className="animate-spin text-zinc-400" />
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading work orders...</p>
            </div>
          </div>
        ) : processedWorkOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <Clock size={56} className="mx-auto text-zinc-300 mb-6" />
            <h3 className="text-2xl font-medium text-zinc-600">No matching Work Orders found</h3>
            <p className="text-zinc-500 mt-2">Try changing the search term or filter</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedWorkOrders.map((wo) => {
                const finishDate = new Date(wo.finish_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = finishDate < today;
                const daysLeft = Math.ceil((finishDate - today) / (1000 * 3600 * 24));

                return (
                  <div
                    key={wo.id}
                    className={`bg-white border rounded-3xl p-8 transition-all hover:shadow-sm ${
                      isOverdue ? 'border-red-200' : 'border-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      {/* Left Side - Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="px-5 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-2xl">
                            IN PROGRESS
                          </div>
                          {isOverdue && (
                            <div className="px-4 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-2xl">
                              OVERDUE
                            </div>
                          )}
                          <h2 className="text-2xl font-semibold text-zinc-900">Work Order #{wo.id}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6 text-sm">
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">PRODUCT</p>
                            <p className="font-medium text-zinc-900 flex items-center gap-2">
                              <Package size={18} className="text-blue-600" />
                              {wo.manufacturing_order?.product || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">MACHINE</p>
                            <p className="font-medium text-zinc-900 flex items-center gap-2">
                              <Factory size={18} className="text-purple-600" />
                              {wo.machine?.name}
                              <span className="text-xs text-zinc-500">({wo.machine?.code})</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">QUANTITY</p>
                            <p className="font-medium text-zinc-900">
                              {parseFloat(wo.quantity || 0).toLocaleString()} units
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">START DATE</p>
                            <p className="font-medium text-zinc-900 flex items-center gap-2">
                              <Calendar size={18} className="text-zinc-400" />
                              {new Date(wo.start_date).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-zinc-500 text-xs mb-1">PLANNED FINISH</p>
                            <p className={`font-medium flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                              <Clock size={18} className={isOverdue ? 'text-red-600' : 'text-amber-600'} />
                              {new Date(wo.finish_date).toLocaleDateString('en-IN')}
                              {daysLeft > 0 && !isOverdue && (
                                <span className="text-xs text-zinc-500">({daysLeft} days left)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-4 lg:min-w-[280px]">
                        <button
                          onClick={() => handleComplete(wo.id)}
                          disabled={actionLoading === wo.id}
                          className="flex-1 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 disabled:text-zinc-500 rounded-2xl font-medium text-sm flex items-center justify-center gap-3 transition-all"
                        >
                          {actionLoading === wo.id ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle size={20} />
                              Mark as Completed
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(wo.id)}
                          disabled={actionLoading === wo.id}
                          className="flex-1 px-8 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 disabled:text-zinc-500 rounded-2xl font-medium text-sm flex items-center justify-center gap-3 transition-all"
                        >
                          {actionLoading === wo.id ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <>
                              <Trash2 size={20} />
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
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-3 px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={20} /> Previous
                </button>

                <div className="px-8 py-3.5 bg-white border border-zinc-200 rounded-2xl font-medium text-zinc-700">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-3 px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkOrderList;