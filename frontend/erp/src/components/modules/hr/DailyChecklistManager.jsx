// src/components/modules/hr/DailyChecklistManager.jsx (ALU-CORE CYBERPUNK THEME)
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import ReactStars from 'react-stars';
import { CalendarDays, Target, Star, AlertCircle, Loader2 } from 'lucide-react';

const DailyChecklistManager = () => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/hr/daily-checklists/');
        // Only show unrated (pending) checklists
        const pending = (res.data || []).filter(
          c => c.rating === null || c.rating === undefined
        );
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
    try {
      await api.patch(`/hr/daily-checklists/${id}/rate/`, { rating });
      // Remove rated checklist from list
      setChecklists(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Rating submission failed:', err);
      alert('RATING TRANSMISSION FAILED — Check connection or permissions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <Loader2 className="w-32 h-32 text-cyan-400 animate-spin mb-10" />
        <p className="font-bold text-cyan-300 font-mono">
          SYNCING DAILY PERFORMANCE DATA...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-10">
        <div className="bg-red-900/40 border-4 border-red-600/60 rounded-3xl p-16 text-center max-w-3xl">
          <AlertCircle className="w-40 h-40 text-red-400 mx-auto mb-10" />
          <h2 className=" font-bold text-red-300 mb-8">
            SYSTEM ALERT
          </h2>
          <p className=" text-red-200 font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-8 mb-8">
            <CalendarDays className="w-20 h-20 text-cyan-400 animate-pulse" />
            <h2 className=" font-bold text-cyan-300">
              RATE TEAM DAILY PERFORMANCE
            </h2>
            <Star className="w-20 h-20 text-yellow-400 animate-pulse" />
          </div>
          <p className=" text-gray-400 font-mono">
            Evaluate today's mission execution across operatives
          </p>
        </div>

        {/* No Pending Ratings */}
        {checklists.length === 0 && (
          <div className="text-center py-32 bg-gray-900/40 border-4 border-cyan-900/50 rounded-3xl">
            <div className="mb-12">
              <Star className="w-48 h-48 text-yellow-400 mx-auto opacity-60" />
            </div>
            <h3 className=" font-bold text-cyan-300 mb-8">
              ALL RATINGS COMPLETE
            </h3>
            <p className=" text-gray-400 font-mono mb-6">
              No pending performance evaluations at this time
            </p>
            <p className=" text-green-400 font-bold">
              Outstanding discipline across the unit! 🎉
            </p>
          </div>
        )}

        {/* Pending Checklists Grid */}
        {checklists.length > 0 && (
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            {checklists.map(cl => (
              <div
                key={cl.id}
                className="bg-gray-900/60 backdrop-blur-lg border-4 border-cyan-900/70 rounded-3xl shadow-2xl hover:shadow-cyan-500/60 hover:border-cyan-500 transition-all duration-500 overflow-hidden"
              >
                {/* Glow Top Bar */}
                <div className="h-3 bg-gradient-to-r from-yellow-600 via-cyan-400 to-green-600"></div>

                <div className="p-10">
                  {/* Employee Header */}
                  <div className="flex items-center gap-6 mb-8">
                    <Target className="w-16 h-16 text-cyan-400" />
                    <div>
                      <h4 className=" font-bold text-cyan-300">
                        {cl.for_employee_name || 'Operative'}
                      </h4>
                      <p className=" text-gray-400 mt-2 font-mono">
                        Mission Date: {cl.date}
                      </p>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="mb-12">
                    <p className=" font-semibold text-cyan-300 mb-6 flex items-center gap-4">
                      <Target className="w-10 h-10" />
                      DAILY OBJECTIVES
                    </p>
                    <div className="bg-gray-800/50 border-2 border-cyan-900/50 rounded-2xl p-8">
                      <pre className=" text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {cl.goals_description || 'No objectives recorded'}
                      </pre>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="text-center">
                    <p className=" font-bold text-cyan-300 mb-8">
                      PERFORMANCE RATING
                    </p>
                    <div className="flex justify-center">
                      <ReactStars
                        count={5}
                        size={80}
                        color2="#ffd700"
                        activeColor="#ffc107"
                        onChange={(rating) => rateChecklist(cl.id, rating)}
                      />
                    </div>
                    <p className=" text-gray-500 mt-6 font-mono">
                      Click stars to submit evaluation
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyChecklistManager;