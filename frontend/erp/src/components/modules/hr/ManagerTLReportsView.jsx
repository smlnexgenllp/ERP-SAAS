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
      const res = await api.get('/api/hr/daily-tl-reports/');
      // Backend filters to only reports where manager = current user
      setReports(res.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center text-gray-400">Loading incoming reports...</p>;
  if (reports.length === 0) return <p className="text-center text-gray-400">No team lead reports received yet.</p>;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-cyan-300 mb-6">Incoming Daily Reports from Team Leads</h3>

      {reports.map(report => (
        <div key={report.id} className="bg-gray-800/60 border border-cyan-900/50 rounded-xl overflow-hidden hover:border-cyan-500 transition">
          <div
            className="p-6 cursor-pointer flex items-center justify-between"
            onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
          >
            <div className="flex items-center gap-4">
              <User className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="font-bold text-lg text-cyan-200">
                  {report.team_lead_name} {report.team_lead_code && `(${report.team_lead_code})`}
                </p>
                <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  <Clock className="w-4 h-4 ml-4" />
                  {new Date(report.sent_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-6 h-6 text-cyan-400 transition ${expandedId === report.id ? 'rotate-180' : ''}`} />
          </div>

          {expandedId === report.id && (
            <div className="px-6 pb-6 border-t border-gray-700 pt-4">
              <div className="bg-gray-900/50 rounded-lg p-5">
                <p className="text-cyan-200 whitespace-pre-wrap leading-relaxed">{report.report_summary}</p>
              </div>

              {report.data && (
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer text-cyan-400 font-mono hover:text-cyan-300">
                    Structured Data
                  </summary>
                  <pre className="mt-3 bg-black/60 p-4 rounded text-xs overflow-x-auto text-gray-300">
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