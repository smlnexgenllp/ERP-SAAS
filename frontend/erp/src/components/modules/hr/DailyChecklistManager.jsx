// src/components/modules/hr/DailyChecklistManager.jsx
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
        setError('Unable to retrieve performance data');
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
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered & Sorted Data
  const filteredAndSorted = useMemo(() => {
    let filtered = checklists;

    if (searchTerm) {
      filtered = filtered.filter(cl =>
        cl.for_employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(cl => new Date(cl.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(cl => new Date(cl.date) <= new Date(dateTo));
    }

    if (setByFilter) {
      filtered = filtered.filter(cl =>
        cl.set_by_name?.toLowerCase().includes(setByFilter.toLowerCase())
      );
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-zinc-600" />
          <p className="text-zinc-500 mt-4">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-3xl text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <CalendarDays className="w-12 h-12 text-emerald-600" />
            <h2 className="text-4xl font-bold text-zinc-900">Daily Performance Rating</h2>
            <Star className="w-12 h-12 text-amber-500" />
          </div>
          <p className="text-zinc-500">Rate team member performance and provide feedback</p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
            </div>

            {/* Set By Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Rated by..."
                value={setByFilter}
                onChange={(e) => setSetByFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none"
              />
            </div>

            {/* Sort By */}
            <div className="relative">
              <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-11 pr-10 py-3 border border-zinc-200 rounded-2xl focus:border-zinc-400 outline-none appearance-none cursor-pointer"
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="updates_desc">Most Updates</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-semibold text-zinc-900">{filteredAndSorted.length}</span> of{' '}
              <span className="font-medium">{checklists.length}</span> pending ratings
            </p>
          </div>
        </div>

        {/* No Results */}
        {filteredAndSorted.length === 0 && checklists.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-16 text-center">
            <p className="text-xl text-zinc-500">No checklists match your current filters</p>
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
                  className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Top Accent Bar */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-zinc-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-zinc-900 text-lg">{cl.for_employee_name}</h4>
                        <p className="text-sm text-zinc-500">
                          {new Date(cl.date).toLocaleDateString('en-IN', { 
                            weekday: 'short', month: 'short', day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Goals */}
                    <div className="mt-6">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Goals</p>
                      <div className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-100 rounded-2xl p-4">
                        {cl.goals_description || "No goals specified for today"}
                      </div>
                    </div>

                    {/* Updates */}
                    <div className="mt-6">
                      <button
                        onClick={() => toggleExpand(cl.id)}
                        className="w-full flex items-center justify-between text-sm font-medium py-2 text-zinc-700 hover:text-zinc-900"
                      >
                        <span>Task Updates ({updateCount})</span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 max-h-52 overflow-y-auto pr-1">
                          {updateCount === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No updates recorded today</p>
                          ) : (
                            cl.today_task_updates.map((update, i) => (
                              <div key={i} className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-sm">
                                <p className="font-medium">{update.task_title}</p>
                                <p className="text-zinc-600 mt-1">"{update.change_description}"</p>
                                <div className="flex justify-between text-xs text-zinc-500 mt-3">
                                  <span>{update.progress}</span>
                                  <span>{update.timestamp}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rating Section */}
                    <div className="mt-8 pt-6 border-t border-zinc-100">
                      <p className="text-center text-sm font-medium text-zinc-600 mb-4">Rate Today's Performance</p>
                      <div className="flex justify-center">
                        <ReactStars
                          count={5}
                          size={48}
                          color1="#e5e7eb"
                          color2="#10b981"
                          activeColor="#10b981"
                          onChange={(rating) => rateChecklist(cl.id, rating)}
                          value={0}
                        />
                      </div>
                      {submittingId === cl.id && (
                        <p className="text-center text-xs text-emerald-600 mt-3">Submitting rating...</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Rated Message */}
        {checklists.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <Star className="w-20 h-20 text-amber-400 mx-auto mb-6" />
            <h3 className="text-3xl font-semibold text-zinc-900 mb-3">All Ratings Completed</h3>
            <p className="text-zinc-500 text-lg">Great work! All team members have been rated for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChecklistManager;