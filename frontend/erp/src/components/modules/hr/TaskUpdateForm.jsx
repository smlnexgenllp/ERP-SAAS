// src/components/modules/hr/TaskUpdateForm.jsx (CYBERPUNK THEME - ALU-CORE STYLE)
import React, { useState } from 'react';
import api from '../../../services/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TaskUpdateForm = ({ task, onUpdate }) => {
  const [progress, setProgress] = useState(task.progress_percentage);
  const [changeDescription, setChangeDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(task.is_completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!changeDescription.trim()) {
      setError('Change description is required for audit trail.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.patch(`/hr/tasks/${task.id}/update-progress/`, {
        progress_percentage: Number(progress),
        change_description: changeDescription.trim(),
        is_completed: isCompleted,
      });

      setChangeDescription('');
      onUpdate();
    } catch (err) {
      console.error('Task update failed:', err);
      setError(err.response?.data?.detail || 'Update failed — check connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t-2 border-cyan-800/50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <CheckCircle2 className="w-10 h-10 text-cyan-400" />
        <h4 className=" font-bold text-cyan-300">
          UPDATE TASK PROGRESS
        </h4>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-8 p-5 bg-red-900/30 border-2 border-red-600/50 rounded-xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <p className="text-red-300 font-mono">{error}</p>
        </div>
      )}

      {/* Progress Slider */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <label className=" font-semibold text-cyan-300">
            Progress Level
          </label>
          <span className=" font-bold text-cyan-400 bg-gray-900/50 px-6 py-2 rounded-lg border border-cyan-700">
            {progress}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(e.target.value)}
          className="w-full h-4 bg-gray-800 rounded-full appearance-none cursor-pointer slider-thumb-cyan"
          style={{
            background: `linear-gradient(to right, #0891b2 ${progress}%, #1e293b ${progress}%)`,
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #0891b2;
            border: 3px solid #0ea5e9;
            box-shadow: 0 0 15px #0ea5e9;
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 28px;
            width: 28px;
            border-radius: 50%;
            background: #0891b2;
            border: 3px solid #0ea5e9;
            box-shadow: 0 0 15px #0ea5e9;
            cursor: pointer;
          }
        `}</style>
      </div>

      {/* Change Description */}
      <div className="mb-10">
        <label className="  font-semibold text-cyan-300 mb-4 flex items-center gap-3">
          <span className="text-red-400">*</span>
          Change Log Entry
        </label>
        <textarea
          rows="6"
          value={changeDescription}
          onChange={(e) => setChangeDescription(e.target.value)}
          placeholder="> Describe your progress in detail (required for git-style audit trail)..."
          className="w-full p-6 bg-gray-900/40 border-2 border-cyan-900 rounded-xl text-cyan-200 font-mono text-base focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/30 transition-all resize-none"
          required
        />
      </div>

      {/* Mark as Completed */}
      <div className="mb-12">
        <label className="flex items-center gap-5 cursor-pointer ">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            className="w-8 h-8 text-cyan-400 rounded focus:ring-cyan-500 focus:ring-4"
          />
          <span className="text-cyan-300 font-semibold">
            Mark task as <span className="text-green-400">FULLY COMPLETED</span>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-6 rounded-xl font-bold  transition-all duration-300 flex items-center justify-center gap-4
                   bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-lg shadow-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-400/70"
      >
        {loading ? (
          <>
            <Loader2 className="w-10 h-10 animate-spin" />
            <span>UPDATING TASK...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-10 h-10" />
            <span>SUBMIT PROGRESS UPDATE</span>
          </>
        )}
      </button>

      {/* Footer Hint */}
      <p className="text-center text-gray-500 text-sm mt-8 font-mono">
        All updates are logged with timestamp and author for full traceability
      </p>
    </div>
  );
};

export default TaskUpdateForm;