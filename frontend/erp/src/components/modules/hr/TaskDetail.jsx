// src/components/modules/hr/TaskDetail.jsx (OPTIMIZED & RESPONSIVE - ALU-CORE THEME)
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  Target, 
  GitCommit, 
  Clock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const TaskDetail = ({ taskId }) => {
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [newProgress, setNewProgress] = useState(0);
  const [changeDesc, setChangeDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    const fetchTaskData = async () => {
      setLoading(true);
      setError('');
      try {
        const [taskRes, updatesRes] = await Promise.all([
          api.get(`/hr/tasks/${taskId}/`),
          api.get(`/hr/tasks/${taskId}/updates/`)
        ]);

        setTask(taskRes.data);
        setUpdates(updatesRes.data || []);
        setNewProgress(taskRes.data.progress_percentage || 0);
      } catch (err) {
        console.error('Failed to load task details:', err);
        setError('TASK DATA CORRUPTED — Unable to retrieve mission briefing');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) fetchTaskData();
  }, [taskId]);

  const submitUpdate = async () => {
    if (!changeDesc.trim()) {
      setError('Change log entry required for mission audit');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await api.patch(`/hr/tasks/${taskId}/update-progress/`, {
        progress_percentage: Number(newProgress),
        change_description: changeDesc.trim(),
        is_completed: newProgress === 100
      });

      const taskRes = await api.get(`/hr/tasks/${taskId}/`);
      const updatesRes = await api.get(`/hr/tasks/${taskId}/updates/`);
      setTask(taskRes.data);
      setUpdates(updatesRes.data || []);
      setChangeDesc('');
      setNewProgress(taskRes.data.progress_percentage);
    } catch (err) {
      console.error('Update failed:', err);
      setError('TRANSMISSION FAILED — Progress update rejected');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
        <Loader2 className="w-20 h-20 text-cyan-400 animate-spin mb-8" />
        <p className="text-3xl text-cyan-300 font-mono">ACCESSING TASK DATABASE...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <div className="bg-red-900/40 border-4 border-red-600/60 rounded-3xl p-10 text-center max-w-2xl">
          <AlertCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-red-300 mb-4">MISSION DATA UNREACHABLE</h2>
          <p className="text-2xl text-red-200 font-mono">{error || 'Task not found in system'}</p>
        </div>
      </div>
    );
  }

  const visibleUpdates = showAllHistory ? updates : updates.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Task Header Card */}
        <div className="bg-gray-900/50 backdrop-blur-lg border-2 border-cyan-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <Target className="w-14 h-14 text-cyan-400 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-cyan-300 mb-3 break-words">
                MISSION: {task.title}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Assigned by:</span>
                  <span className="text-cyan-200 font-mono">{task.assigned_by_name || 'Command'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">Deadline:</span>
                  <span className="text-cyan-200 font-mono">{task.deadline || 'No limit'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-lg">Status</p>
              <p className={`text-3xl font-bold ${task.is_completed ? 'text-green-400' : 'text-yellow-400'}`}>
                {task.is_completed ? 'COMPLETED' : 'ACTIVE'}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-semibold">Mission Progress</span>
              <span className="text-4xl font-bold text-cyan-400 bg-gray-900/70 px-6 py-2 rounded-2xl border-2 border-cyan-700">
                {task.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-10 overflow-hidden border-2 border-cyan-900">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-green-500 transition-all duration-1000 ease-out shadow-lg shadow-cyan-500/50"
                style={{ width: `${task.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="bg-gray-900/50 backdrop-blur-lg border-2 border-cyan-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <GitCommit className="w-10 h-10 text-cyan-400" />
            <h3 className="text-3xl font-bold text-cyan-300">SUBMIT PROGRESS UPDATE</h3>
          </div>

          {error && (
            <div className="mb-6 p-5 bg-red-900/40 border-2 border-red-600/50 rounded-2xl flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-lg text-red-300 font-mono">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <div>
              <label className="text-xl font-semibold mb-3 block">New Progress Level</label>
              <input
                type="range"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
                className="w-full h-6 bg-gray-800 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #0891b2 ${newProgress}%, #1e293b ${newProgress}%)`,
                }}
              />
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  height: 32px;
                  width: 32px;
                  border-radius: 50%;
                  background: #0891b2;
                  border: 3px solid #0ea5e9;
                  box-shadow: 0 0 15px #0ea5e9;
                }
              `}</style>
            </div>

            <div>
              <label className="text-xl font-semibold mb-3 flex items-center gap-2">
                <span className="text-red-400">*</span>
                Mission Log Entry
              </label>
              <textarea
                rows="5"
                value={changeDesc}
                onChange={(e) => setChangeDesc(e.target.value)}
                placeholder="> Enter detailed progress report..."
                className="w-full p-5 bg-gray-900/50 border-2 border-cyan-900 rounded-2xl text-cyan-200 font-mono focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/30 transition-all resize-none"
              />
            </div>

            <button
              onClick={submitUpdate}
              disabled={updating}
              className="w-full py-5 rounded-2xl font-bold text-2xl flex items-center justify-center gap-5
                         bg-gradient-to-r from-cyan-600 to-green-600 hover:from-cyan-500 hover:to-green-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-2xl shadow-cyan-500/70 hover:shadow-green-500/70 transition-all"
            >
              {updating ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span>TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-10 h-10" />
                  <span>COMMIT UPDATE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-gray-900/50 backdrop-blur-lg border-2 border-cyan-900 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <GitCommit className="w-10 h-10 text-cyan-400 animate-pulse" />
              <h3 className="text-3xl font-bold text-cyan-300">
                MISSION HISTORY LOG
              </h3>
            </div>
            <span className="text-xl text-gray-400 font-mono">
              {updates.length} entries
            </span>
          </div>

          {updates.length === 0 ? (
            <div className="text-center py-16">
              <GitCommit className="w-20 h-20 text-cyan-400 mx-auto mb-6 opacity-40" />
              <p className="text-2xl text-gray-400 font-mono">NO LOG ENTRIES</p>
              <p className="text-lg text-gray-500 mt-3">Updates will appear after first submission</p>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {visibleUpdates.map((update, idx) => (
                  <div key={update.id} className="flex gap-6">
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-4 h-4 rounded-full bg-cyan-500 border-3 border-gray-950 shadow-lg shadow-cyan-500/50"></div>
                    </div>
                    <div className="flex-1 bg-gray-900/60 border border-cyan-900/50 rounded-2xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xl font-bold text-cyan-300">
                            {update.updated_by_name || 'Operator'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(update.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-cyan-400 font-mono">#{updates.length - idx}</span>
                      </div>
                      <p className="text-gray-300 mb-5 leading-relaxed">
                        {update.change_description}
                      </p>
                      <div className="flex items-center gap-4 bg-gray-800/60 p-4 rounded-xl">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-xl font-bold text-red-400">{update.old_progress}%</span>
                        <ArrowRight className="w-6 h-6 text-cyan-400" />
                        <span className="text-xl font-bold text-green-400">{update.new_progress}%</span>
                        <span className="ml-4 text-cyan-300 font-mono">
                          (+{update.new_progress - update.old_progress}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {updates.length > 3 && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gray-800/60 border-2 border-cyan-900 rounded-xl text-cyan-300 font-mono hover:bg-gray-700/60 transition"
                  >
                    {showAllHistory ? (
                      <>
                        <ChevronUp className="w-6 h-6" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-6 h-6" />
                        Show All {updates.length} Entries
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;