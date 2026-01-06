// src/components/modules/hr/TaskUpdateForm.jsx (CYBERPUNK THEME - FIXED & OPTIMIZED)
import React, { useState } from 'react';
import api from '../../../services/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TaskUpdateForm = ({ task, onUpdate }) => {
  const [progress, setProgress] = useState(task.progress_percentage || 0);
  const [changeDescription, setChangeDescription] = useState('');
  const [isCompleted, setIsCompleted] = useState(task.is_completed || false);
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
      // api.patch returns the response with updated task data
      const response = await api.patch(`/hr/tasks/${task.id}/update-progress/`, {
        progress_percentage: Number(progress),
        change_description: changeDescription.trim(),
        is_completed: isCompleted,
      });

      // CRITICAL: Get the fresh task object from response
      const updatedTask = response.data;

      // Pass the fresh task (with new updates array) to parent
      onUpdate(updatedTask);

      // Success: reset form
      setChangeDescription('');
      // Optional: update progress slider to new value
      // setProgress(updatedTask.progress_percentage);

      // Optional: success feedback (you can replace with toast later)
      // alert('Progress updated successfully!');

    } catch (err) {
      console.error('Task update failed:', err);
      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Update failed — check connection or permissions.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t-2 border-cyan-800/50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <CheckCircle2 className="w-10 h-10 text-cyan-400" />
        <h4 className="text-2xl font-bold text-cyan-300">UPDATE TASK PROGRESS</h4>
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
          <label className="text-lg font-semibold text-cyan-300">Progress Level</label>
          <span className="text-2xl font-bold text-cyan-400 bg-gray-900/50 px-6 py-3 rounded-lg border border-cyan-700 shadow-lg shadow-cyan-600/30">
            {progress}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full h-4 bg-gray-800 rounded-full appearance-none cursor-pointer slider-thumb-cyan"
          style={{
            background: `linear-gradient(to right, #0891b2 ${progress}%, #1e293b ${progress}%)`,
          }}
        />
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            height: 32px;
            width: 32px;
            border-radius: 50%;
            background: #06b6d4;
            border: 4px solid #0ea5e9;
            box-shadow: 0 0 20px #0ea5e9;
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            height: 32px;
            width: 32px;
            border-radius: 50%;
            background: #06b6d4;
            border: 4px solid #0ea5e9;
            box-shadow: 0 0 20px #0ea5e9;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>

      {/* Change Description */}
      <div className="mb-10">
        <label className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-3">
          <span className="text-red-400">*</span>
          Change Log Entry
        </label>
        <textarea
          rows="6"
          value={changeDescription}
          onChange={(e) => setChangeDescription(e.target.value)}
          placeholder="> Describe your progress in detail (required for git-style audit trail)..."
          className="w-full p-6 bg-gray-900/40 border-2 border-cyan-900 rounded-xl text-cyan-100 font-mono text-base placeholder-gray-500 focus:border-cyan-500 focus:shadow-lg focus:shadow-cyan-500/40 transition-all resize-none"
          required
        />
      </div>

      {/* Mark as Completed */}
      <div className="mb-12">
        <label className="flex items-center gap-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => setIsCompleted(e.target.checked)}
            className="w-8 h-8 text-cyan-500 rounded-lg focus:ring-4 focus:ring-cyan-500/50"
          />
          <span className="text-xl text-cyan-300 font-semibold">
            Mark task as <span className="text-green-400">FULLY COMPLETED</span>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-6 rounded-xl font-bold text-xl tracking-wider transition-all duration-300 flex items-center justify-center gap-5
                   bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-2xl shadow-cyan-500/60 hover:shadow-cyan-400/80"
      >
        {loading ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin" />
            <span>UPDATING TASK...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-12 h-12" />
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