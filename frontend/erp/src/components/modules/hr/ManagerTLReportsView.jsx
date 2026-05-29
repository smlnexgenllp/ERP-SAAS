// src/components/modules/hr/ManagerTLReportsView.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Calendar, User, Clock, ChevronDown } from 'lucide-react';

const ManagerTLReportsView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/hr/daily-tl-reports/');
      setReports(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-zinc-100 rounded-3xl">
        <p className="text-zinc-500">Loading incoming reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
        <User className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
        <h3 className="text-2xl font-semibold text-zinc-900 mb-2">No Reports Yet</h3>
        <p className="text-zinc-500">Team leads haven't submitted any daily reports yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-3xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
        Incoming Daily Reports
      </h3>

      {reports.map(report => (
        <div 
          key={report.id} 
          className="bg-white border border-zinc-200 rounded-3xl overflow-hidden hover:shadow-md transition-all duration-200"
        >
          {/* Header */}
          <div
            className="p-6 cursor-pointer flex items-center justify-between hover:bg-zinc-50 transition"
            onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <User className="w-7 h-7 text-zinc-600" />
              </div>
              <div>
                <p className="font-semibold text-xl text-zinc-900">
                  {report.team_lead_name} 
                  {report.team_lead_code && (
                    <span className="text-zinc-500 text-base ml-2">({report.team_lead_code})</span>
                  )}
                </p>
                <p className="text-sm text-zinc-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {new Date(report.sent_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </p>
              </div>
            </div>

            <ChevronDown 
              className={`w-6 h-6 text-zinc-400 transition-transform ${expandedId === report.id ? 'rotate-180' : ''}`} 
            />
          </div>

          {/* Expanded Content */}
          {expandedId === report.id && (
            <div className="px-6 pb-6 border-t border-zinc-100">
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6">
                <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {report.report_summary}
                </p>
              </div>

              {report.data && (
                <details className="mt-5">
                  <summary className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-700 transition py-2">
                    View Structured Data
                  </summary>
                  <pre className="mt-3 bg-zinc-900 text-zinc-300 p-5 rounded-2xl text-xs overflow-x-auto border border-zinc-800">
                    {JSON.stringify(report.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManagerTLReportsView;