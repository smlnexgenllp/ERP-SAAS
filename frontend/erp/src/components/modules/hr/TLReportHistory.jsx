// src/components/modules/hr/TLReportHistory.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Calendar, FileText, User, Clock } from 'lucide-react';

const TLReportHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await api.get('/api/hr/daily-tl-reports/');
      // Backend already filters to only user's reports if TL
      setReports(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400">Loading your report history...</p>;
  }

  if (reports.length === 0) {
    return <p className="text-center text-gray-400">No reports submitted yet.</p>;
  }

  return (
    <div className="space-y-6">
      {reports.sort((a, b) => new Date(b.date) - new Date(a.date)).map(report => (
        <div key={report.id} className="bg-gray-800/60 border border-cyan-900/50 rounded-xl p-6 hover:border-cyan-600 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <h4 className="font-bold text-lg">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              {new Date(report.sent_at).toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-300 mb-4">
            <User className="w-4 h-4" />
            Sent to: <strong>{report.manager_name || 'Manager'}</strong>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-cyan-200 whitespace-pre-wrap">{report.report_summary}</p>
          </div>

          {report.data && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300">View Structured Data</summary>
              <pre className="mt-2 text-xs bg-black/50 p-3 rounded overflow-x-auto">
                {JSON.stringify(report.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};

export default TLReportHistory;