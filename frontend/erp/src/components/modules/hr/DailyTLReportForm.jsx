// src/components/modules/hr/DailyTLReportForm.jsx

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Loader2, Send, AlertCircle, CheckCircle2, Users, Calendar, FileText } from 'lucide-react';

const DailyTLReportForm = () => {
  const [reportSummary, setReportSummary] = useState('');
  const [structuredData, setStructuredData] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [todayReport, setTodayReport] = useState(null);
  const [manager, setManager] = useState(null);
  const [teamTasksToday, setTeamTasksToday] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setFetching(true);
    try {
      // Fetch today's existing report (if any)
      const reportRes = await api.get('/hr/daily-tl-reports/', {
        params: { date: today }
      });

      const myReport = reportRes.data.find(r => r.team_lead === window.currentUser?.employee?.id);
      if (myReport) {
        setTodayReport(myReport);
        setReportSummary(myReport.report_summary || '');
        setStructuredData(myReport.data ? JSON.stringify(myReport.data, null, 2) : '');
        setManager(myReport.manager ? {
          id: myReport.manager,
          full_name: myReport.manager_name,
          code: myReport.manager_code
        } : null);
      }

      // Fetch manager from current employee profile
      const profileRes = await api.get('/hr/employees/me/'); // assuming you have this endpoint
      const employee = profileRes.data;
      if (employee.reporting_to) {
        setManager({
          id: employee.reporting_to,
          full_name: employee.reporting_to_name || 'Manager',
          code: employee.reporting_to_code
        });
      }

      // Fetch today's tasks assigned to subordinates (team members)
      const tasksRes = await api.get('/hr/tasks/', {
        params: {
          assigned_to__in: employee.subordinates?.map(s => s.id).join(',') || '',
          deadline__gte: today,
          deadline__lte: today
        }
      });
      setTeamTasksToday(tasksRes.data || []);

    } catch (err) {
      console.error('Failed to load report data:', err);
      setMessage({ text: 'Failed to load report data. Please refresh.', type: 'error' });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportSummary.trim()) {
      setMessage({ text: 'Please write your daily summary before submitting.', type: 'error' });
      return;
    }

    if (!manager) {
      setMessage({ text: 'You do not have a reporting manager set. Contact HR.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const payload = {
      date: today,
      report_summary: reportSummary.trim(),
      data: structuredData.trim() ? JSON.parse(structuredData) : null,
    };

    try {
      if (todayReport) {
        // Update draft (if allowed) — but usually prevent edit after submit
        if (todayReport.is_submitted) {
          setMessage({ text: 'Report already submitted today. Cannot edit.', type: 'error' });
          return;
        }
        await api.patch(`/hr/daily-tl-reports/${todayReport.id}/`, payload);
        setMessage({ text: 'Daily report updated successfully!', type: 'success' });
      } else {
        await api.post('/hr/daily-tl-reports/', payload);
        setMessage({ text: 'Daily report submitted successfully!', type: 'success' });
      }

      // Refresh data
      fetchReportData();
    } catch (err) {
      const errMsg = err.response?.data?.detail ||
                     err.response?.data?.non_field_errors?.[0] ||
                     'Failed to submit report. Try again.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-cyan-300 flex items-center justify-center gap-4">
            <FileText className="w-12 h-12 text-cyan-400" />
            DAILY TEAM LEAD REPORT
            <Calendar className="w-10 h-10 text-cyan-400" />
          </h2>
          <p className="text-lg text-gray-300 mt-3">Date: <span className="font-mono text-cyan-300">{today}</span></p>

          {manager && (
            <p className="text-md text-green-300 mt-4">
              This report will be sent to: <strong>{manager.full_name}</strong> ({manager.code || 'Manager'})
            </p>
          )}

          {!manager && !fetching && (
            <p className="text-red-400 mt-4">⚠ No reporting manager assigned</p>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-5 rounded-xl text-center font-mono border-2 mb-8 text-lg ${
            message.type === 'success'
              ? 'bg-green-900/30 border-green-600 text-green-300'
              : 'bg-red-900/30 border-red-600 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-10 h-10 mx-auto mb-3" /> : <AlertCircle className="w-10 h-10 mx-auto mb-3" />}
            <p>{message.text}</p>
          </div>
        )}

        {/* Already Submitted Notice */}
        {todayReport?.is_submitted && (
          <div className="bg-green-900/30 border-2 border-green-600 rounded-xl p-6 text-center text-green-300 mb-8">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xl font-bold">Report Already Submitted Today</p>
            <p className="text-sm mt-2 opacity-80">
              Submitted at: {new Date(todayReport.sent_at).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team Tasks Today (Reference) */}
          {teamTasksToday.length > 0 && (
            <div className="bg-gray-900/60 border border-cyan-900/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-3 mb-4">
                <Users className="w-6 h-6" />
                Today's Active Tasks (Your Team)
              </h3>
              <div className="grid gap-3">
                {teamTasksToday.map(task => (
                  <div key={task.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between">
                      <p className="font-mono text-cyan-200"><strong>{task.title}</strong></p>
                      <span className={`px-3 py-1 rounded text-xs font-bold ${
                        task.is_completed ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'
                      }`}>
                        {task.progress_percentage}% {task.is_completed ? '✓' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Assigned to: {task.assigned_to_name || task.assigned_to}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-900/70 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-8">
            <label className="text-cyan-300 font-bold text-lg mb-4 block">
              Daily Summary (Required)
            </label>
            <textarea
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              rows="12"
              placeholder={`• Team achievements today&#10;• Tasks completed / in progress&#10;• Any blockers or issues&#10;• Attendance notes&#10;• Plan for tomorrow&#10;• Risks or escalations`}
              className="w-full px-5 py-4 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 focus:border-cyan-500 transition resize-none font-sans text-base"
              required
              disabled={todayReport?.is_submitted || loading}
            />
          </div>

          {/* Structured Data (Optional) */}
          <div className="bg-gray-900/70 backdrop-blur border-2 border-cyan-900/60 rounded-2xl p-8">
            <label className="text-cyan-300 font-bold text-lg mb-4 block">
              Structured Data (Optional JSON)
            </label>
            <textarea
              value={structuredData}
              onChange={(e) => setStructuredData(e.target.value)}
              rows="8"
              placeholder={`{
  "completed_tasks": 8,
  "pending_tasks": 3,
  "team_attendance": 12,
  "blockers": ["Server downtime", "API issue"],
  "tomorrow_plan": ["Complete deployment", "Client demo"]
}`}
              className="w-full px-5 py-4 bg-gray-800/60 border border-cyan-900 rounded-xl text-cyan-200 font-mono text-sm focus:border-cyan-500 transition resize-none"
              disabled={todayReport?.is_submitted || loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || fetching || todayReport?.is_submitted || !manager}
            className="w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-4 bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-2xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                SUBMITTING REPORT...
              </>
            ) : (
              <>
                <Send className="w-8 h-8" />
                SUBMIT DAILY REPORT TO {manager ? manager.full_name.toUpperCase() : 'MANAGER'}
              </>
            )}
          </button>
        </form>

        {fetching && (
          <div className="text-center mt-10 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
            <p>Loading your report data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTLReportForm;