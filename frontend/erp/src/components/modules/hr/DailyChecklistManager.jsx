// src/components/modules/hr/DailyChecklistManager.jsx (FINAL - PERFECT ALIGNMENT & RESPONSIVE)
import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../services/api';
import ReactStars from 'react-stars';
import { 
  CalendarDays, Target, Star, AlertCircle, Loader2, User, Edit3, 
  ChevronDown, ChevronUp, Search, Filter, Calendar, ArrowUpDown 
} from 'lucide-react';

const DailyChecklistManager = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [setByFilter, setSetByFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/hr/daily-checklists/');
        const pending = (res.data || []).filter(c => c.rating === null || c.rating === undefined);
        setChecklists(pending);
      } catch (err) {
        console.error('Failed to load daily checklists:', err);
        setError('CHECKLIST SYSTEM OFFLINE — Unable to retrieve performance data');
      } finally {
        setLoading(false);
      }
    };
    fetchChecklists();
  }, []);

  const rateChecklist = async (id, rating) => {
    if (rating < 1 || rating > 5) return;
    setSubmittingId(id);
    try {
      await api.patch(`/hr/daily-checklists/${id}/rate/`, { rating });
      setChecklists(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Rating submission failed:', err);
      alert('RATING FAILED — Please try again or check permissions');
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered & Sorted Data (Instant, client-side)
  const filteredAndSorted = useMemo(() => {
    let filtered = checklists;

    // Search by employee name
    if (searchTerm) {
      filtered = filtered.filter(cl =>
        cl.for_employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter(cl => new Date(cl.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(cl => new Date(cl.date) <= new Date(dateTo));
    }

    // Filter by set_by
    if (setByFilter) {
      filtered = filtered.filter(cl =>
        cl.set_by_name?.toLowerCase().includes(setByFilter.toLowerCase())
      );
    }

    // Sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.for_employee_name || '').localeCompare(b.for_employee_name || '');
        case 'name_desc':
          return (b.for_employee_name || '').localeCompare(a.for_employee_name || '');
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'date_desc':
          return new Date(b.date) - new Date(a.date);
        case 'updates_desc':
          return (b.today_task_updates?.length || 0) - (a.today_task_updates?.length || 0);
        default:
          return 0;
      }
    });
  }, [checklists, searchTerm, dateFrom, dateTo, setByFilter, sortBy]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
      <Loader2 className="w-24 h-24 text-cyan-400 animate-spin mb-8" />
      <p className="text-2xl font-bold text-cyan-300 font-mono">SYNCING PERFORMANCE DATA...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-8">
      <div className="bg-red-900/40 border-4 border-red-600/60 rounded-3xl p-12 text-center max-w-2xl">
        <AlertCircle className="w-32 h-32 text-red-400 mx-auto mb-8" />
        <h2 className="text-4xl font-bold text-red-300 mb-6">SYSTEM ALERT</h2>
        <p className="text-xl text-red-200 font-mono">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-6 mb-4">
            <CalendarDays className="w-16 h-16 text-cyan-400" />
            <h2 className="text-4xl font-bold text-cyan-300">RATE DAILY PERFORMANCE</h2>
            <Star className="w-16 h-16 text-yellow-400" />
          </div>
          <p className="text-lg text-gray-400 font-mono">Search, filter, and evaluate pending ratings</p>
        </div>

        {/* Filters - PERFECT ALIGNMENT & RESPONSIVE */}
        <div className="bg-gray-900/70 backdrop-blur-md border border-cyan-900/60 rounded-2xl p-6 mb-10 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Search employee..."
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

            {/* Set By Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <input
                type="text"
                placeholder="Set by (TL/Manager)"
                value={setByFilter}
                onChange={(e) => setSetByFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
              />
            </div>

            {/* Sort By - NO OVERLAP */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-800/60 border border-cyan-900/50 rounded-lg text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="updates_desc">Most Updates</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-cyan-900/40">
            <p className="text-sm text-gray-400 font-mono">
              Showing <span className="text-cyan-400 font-bold">{filteredAndSorted.length}</span> of{' '}
              <span className="text-gray-400">{checklists.length}</span> pending rating{filteredAndSorted.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && checklists.length > 0 && (
          <div className="text-center py-16 bg-gray-900/50 rounded-2xl border border-cyan-900/40">
            <p className="text-xl text-gray-400 font-mono mb-4">No checklists match your filters</p>
            <p className="text-sm text-gray-500">Try adjusting search, date range, or clear all filters</p>
          </div>
        )}

        {/* Cards Grid */}
        {filteredAndSorted.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((cl) => {
              const isExpanded = expandedCards[cl.id];
              const updateCount = cl.today_task_updates?.length || 0;

              return (
                <div
                  key={cl.id}
                  className="bg-gray-900/70 backdrop-blur-md border-2 border-cyan-900/80 rounded-2xl shadow-xl hover:shadow-cyan-500/60 hover:border-cyan-500 transition-all duration-400 overflow-hidden group"
                >
                  <div className="h-1.5 bg-gradient-to-r from-yellow-500 via-cyan-400 to-green-500"></div>
                  
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <User className="w-9 h-9 text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-lg font-bold text-cyan-300 truncate">{cl.for_employee_name || 'Operative'}</h4>
                          <p className="text-xs text-gray-400 font-mono">
                            {new Date(cl.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          {cl.set_by_name && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              <Edit3 className="w-3 h-3 inline mr-1" /> {cl.set_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Goals - Compact */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-cyan-300 flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5" />
                        Goals
                      </p>
                      <div className="bg-gray-800/60 border border-cyan-900/50 rounded-lg p-3 text-xs text-gray-300 font-mono line-clamp-3 hover:line-clamp-none group-hover:line-clamp-none transition-all">
                        {cl.goals_description || 'No goals set'}
                      </div>
                    </div>

                    {/* Task Updates - Collapsible */}
                    <div className="mb-5">
                      <button
                        onClick={() => toggleExpand(cl.id)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-yellow-400 hover:text-yellow-300 py-2 transition-all group-hover:scale-[1.02]"
                      >
                        <span className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5" />
                          Task Updates ({updateCount})
                        </span>
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-2">
                          {updateCount === 0 ? (
                            <p className="text-xs text-gray-500 italic px-3 py-2 bg-gray-900/50 rounded">No updates today</p>
                          ) : (
                            cl.today_task_updates.map((update, i) => (
                              <div key={i} className="bg-gray-900/50 border border-cyan-900/40 rounded-lg p-3 text-xs hover:bg-gray-900/70 transition">
                                <p className="font-medium text-cyan-200 truncate">{update.task_title}</p>
                                <p className="text-gray-300 mt-1 line-clamp-2 leading-tight">"{update.change_description}"</p>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-cyan-900/30">
                                  <span className="text-green-400 font-mono text-xs">{update.progress}</span>
                                  <span className="text-gray-500 text-xs font-mono">{update.timestamp}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="text-center pt-4 border-t border-cyan-900/40 pb-2">
                      <p className="text-sm font-bold text-cyan-300 mb-3">Rate Performance</p>
                      <ReactStars
                        count={5}
                        size={52}
                        color1="#1e293b"
                        color2="#fbbf24"
                        activeColor="#f59e0b"
                        onChange={(rating) => rateChecklist(cl.id, rating)}
                        value={0}
                      />
                      {submittingId === cl.id ? (
                        <p className="text-xs text-cyan-400 font-mono mt-3 animate-pulse">Submitting...</p>
                      ) : (
                        <p className="text-xs text-gray-500 font-mono mt-3">Click stars to rate</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Complete */}
        {checklists.length === 0 && (
          <div className="text-center py-24 bg-gray-900/50 border-4 border-dashed border-cyan-900/50 rounded-3xl">
            <Star className="w-40 h-40 text-yellow-400 mx-auto mb-8 opacity-60 animate-pulse" />
            <h3 className="text-4xl font-bold text-cyan-300 mb-6">ALL RATINGS COMPLETE</h3>
            <p className="text-2xl text-green-400 font-bold">Outstanding discipline across the team! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChecklistManager;