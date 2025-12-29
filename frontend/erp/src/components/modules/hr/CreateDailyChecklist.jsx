// src/components/modules/hr/CreateDailyChecklist.jsx (ALU-CORE CYBERPUNK THEME)
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Users, Target, CalendarDays, Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const CreateDailyChecklist = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [goals, setGoals] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      setFetchLoading(true);
      try {
        const res = await api.get('/hr/payroll/employees/');
        console.log('Raw employee response:', res.data);

        let employeeArray = [];
        if (Array.isArray(res.data)) {
          employeeArray = res.data;
        } else if (res.data && Array.isArray(res.data.employees)) {
          employeeArray = res.data.employees;
        } else if (res.data && Array.isArray(res.data.results)) {
          employeeArray = res.data.results;
        } else if (res.data && typeof res.data === 'object') {
          const possibleArray = Object.values(res.data).find(Array.isArray);
          employeeArray = possibleArray || [];
        }

        setEmployees(employeeArray);
      } catch (err) {
        console.error('Failed to load operatives:', err);
        setMessage('OPERATIVE DATABASE OFFLINE — Unable to retrieve team roster');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !goals.trim()) {
      setMessage('TARGET OPERATIVE AND DAILY OBJECTIVES REQUIRED');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/hr/daily-checklists/', {
        for_employee: Number(selectedEmployee),
        goals_description: goals.trim(),
        date: new Date().toISOString().split('T')[0],
      });

      setMessage('DAILY OBJECTIVES DEPLOYED SUCCESSFULLY — AWAITING EXECUTION');
      setGoals('');
      setSelectedEmployee('');
    } catch (err) {
      console.error('Deployment failed:', err);
      const errorMsg = err.response?.data?.detail ||
                       err.response?.data?.non_field_errors?.[0] ||
                       'TRANSMISSION ERROR — Daily objectives deployment rejected';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-8 mb-8">
            <CalendarDays className="w-20 h-20 text-cyan-400 animate-pulse" />
            <h2 className=" font-bold text-cyan-300">
              DEPLOY DAILY OBJECTIVES
            </h2>
            <Target className="w-20 h-20 text-cyan-400 animate-pulse" />
          </div>
          <p className=" text-gray-400 font-mono">
            Set mission-critical goals for field operatives today
          </p>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-12 p-8 rounded-2xl text-center  font-mono border-4 ${
            message.includes('SUCCESSFULLY') || message.includes('DEPLOYED')
              ? 'bg-green-900/40 border-green-600/60 text-green-300'
              : 'bg-red-900/40 border-red-600/60 text-red-300'
          }`}>
            {message.includes('SUCCESSFULLY') && (
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            )}
            {!message.includes('SUCCESSFULLY') && (
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <p>{message}</p>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-gray-900/60 backdrop-blur-lg border-4 border-cyan-900/70 rounded-3xl shadow-2xl p-12">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Operative Selection */}
            <div>
              <div className="flex items-center gap-6 mb-6">
                <Users className="w-12 h-12 text-cyan-400" />
                <label className=" font-bold text-cyan-300">
                  TARGET OPERATIVE
                </label>
              </div>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full p-6 bg-gray-800/60 border-2 border-cyan-900 rounded-2xl text-cyan-200 text-xl font-mono focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/50 transition-all"
                required
                disabled={fetchLoading || employees.length === 0}
              >
                <option value="">
                  {fetchLoading ? 'SYNCING ROSTER...' : '-- SELECT OPERATIVE --'}
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name || emp.email} {emp.department_name ? `• ${emp.department_name}` : ''}
                  </option>
                ))}
              </select>
              {employees.length === 0 && !fetchLoading && (
                <p className="text-red-400  mt-4 font-mono">
                  NO OPERATIVES DETECTED IN DATABASE
                </p>
              )}
            </div>

            {/* Daily Objectives */}
            <div>
              <div className="flex items-center gap-6 mb-6">
                <Target className="w-12 h-12 text-cyan-400" />
                <label className=" font-bold text-cyan-300">
                  DAILY OBJECTIVES <span className="text-red-400">*</span>
                </label>
              </div>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows="10"
                placeholder="> Enter today's mission-critical objectives (one per line)

Example:
• Complete React task dashboard UI
• Implement role-based access control
• Test task assignment and rating flow
• Document performance module"
                required
                className="w-full p-8 bg-gray-800/60 border-2 border-cyan-900 rounded-2xl text-cyan-200  font-mono focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/50 transition-all resize-none"
              />
            </div>

            {/* Deploy Button */}
            <button
              type="submit"
              disabled={loading || fetchLoading || employees.length === 0}
              className="w-full py-8 rounded-2xl font-bold  transition-all duration-500 flex items-center justify-center gap-8
                         bg-gradient-to-r from-cyan-600 via-cyan-400 to-green-600
                         hover:from-cyan-500 hover:via-cyan-300 hover:to-green-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-2xl shadow-cyan-500/70 hover:shadow-green-500/70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-16 h-16 animate-spin" />
                  <span>DEPLOYING OBJECTIVES...</span>
                </>
              ) : (
                <>
                  <Send className="w-16 h-16" />
                  <span>DEPLOY DAILY OBJECTIVES</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-16 text-center text-gray-500 font-mono">
            Daily objectives are logged with timestamp • Performance will be evaluated at EOD
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDailyChecklist;