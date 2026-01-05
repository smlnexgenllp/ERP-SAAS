// src/components/modules/hr/TaskCard.jsx
import React, { useState } from 'react';
import TaskUpdateForm from './TaskUpdateForm';
import TaskHistory from './TaskHistory';
import { Target, Calendar, CheckCircle2, User, ChevronDown, ChevronUp, Clock, Edit3 } from 'lucide-react';
import { format } from 'date-fns'; // Make sure you have date-fns installed: npm i date-fns

const TaskCard = ({ task, onUpdate }) => {
  const progress = task.progress_percentage || 0;
  const isCompleted = task.is_completed;
  const [showDetails, setShowDetails] = useState(false);

  // Get the latest update (most recent first because of ordering in model)
  const latestUpdate = task.updates && task.updates.length > 0 ? task.updates[0] : null;

  // Format timestamp nicely: "Jan 3, 2026 at 2:45 PM"
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg border border-cyan-900/60 rounded-2xl shadow-lg hover:shadow-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 overflow-hidden">
      {/* Thin Glow Bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-600"></div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Target className="w-7 h-7 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-cyan-300 truncate">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mt-1">{task.description}</p>
            )}
          </div>
        </div>

        {/* Stats Row - Now 4 columns including Assigned To */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center">
            <User className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">BY</p>
            <p className="text-xs text-cyan-200 font-medium truncate">
              {task.assigned_by_name || 'Command'}
            </p>
          </div>

          <div className="text-center">
            <User className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">TO</p>
            <p className="text-xs text-cyan-200 font-medium truncate">
              {task.assigned_to_name || 'Unassigned'}
            </p>
          </div>

          <div className="text-center">
            <Calendar className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">DUE</p>
            <p className="text-xs text-cyan-200 font-medium">
              {task.deadline || '∞'}
            </p>
          </div>

          <div className="text-center">
            <CheckCircle2
              className={`w-4 h-4 mx-auto mb-1 ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`}
            />
            <p className="text-xs text-gray-400">STATUS</p>
            <p className={`text-xs font-bold ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`}>
              {isCompleted ? 'DONE' : 'ACTIVE'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium text-cyan-400">{progress}%</span>
            <span className="text-sm font-bold text-cyan-300">PROGRESS</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-cyan-900/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Latest Update Preview (when collapsed) */}
        {latestUpdate && !showDetails && (
          <div className="mt-4 pt-4 border-t border-cyan-900/30">
            <div className="flex items-start gap-2 text-xs">
              <Edit3 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-cyan-200 font-medium truncate">
                  {latestUpdate.updated_by_name || 'Someone'} updated:
                </p>
                <p className="text-gray-400 line-clamp-2 mt-1">
                  {latestUpdate.change_description || 'No description'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(latestUpdate.timestamp)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-gray-800/50 hover:bg-gray-700/60 rounded-lg border border-cyan-900/60 transition"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide Details' : 'Update & Full History'}
          </button>
        </div>

        {/* Expanded Section */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-cyan-800/40 space-y-8 animate-fadeIn">
            <TaskUpdateForm task={task} onUpdate={onUpdate} />
            <TaskHistory updates={task.updates || []} />
          </div>
        )}

        {/* Footer when collapsed */}
        {!showDetails && (
          <div className="mt-3 pt-3 border-t border-cyan-900/20 text-center">
            <p className="text-xs text-gray-600 font-mono">Task #{task.id}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;