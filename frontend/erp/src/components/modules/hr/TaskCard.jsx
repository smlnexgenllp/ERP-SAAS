// src/components/modules/hr/TaskCard.jsx
import React, { useState } from 'react';
import TaskUpdateForm from './TaskUpdateForm';
import TaskHistory from './TaskHistory';
import { Target, Calendar, CheckCircle2, User, ChevronDown, ChevronUp, Clock, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

const TaskCard = ({ task, onUpdate }) => {
  const progress = task.progress_percentage || 0;
  const isCompleted = task.is_completed;
  const [showDetails, setShowDetails] = useState(false);

  const latestUpdate = task.updates && task.updates.length > 0 ? task.updates[0] : null;

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Progress Bar at Top */}
      <div className="h-1.5 bg-zinc-100 relative">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900 text-lg leading-tight">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-zinc-600 line-clamp-2 mt-2">{task.description}</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-xs text-zinc-500">ASSIGNED BY</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">
              {task.assigned_by_name || 'System'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">ASSIGNED TO</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">
              {task.assigned_to_name || 'Unassigned'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">DEADLINE</p>
            <p className="text-sm font-medium text-zinc-800 mt-1">
              {task.deadline ? new Date(task.deadline).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              }) : 'No deadline'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">STATUS</p>
            <p className={`text-sm font-semibold mt-1 flex items-center gap-1.5 ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Completed' : 'In Progress'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-zinc-700">Progress</span>
            <span className="font-semibold text-zinc-900">{progress}%</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Latest Update Preview */}
        {latestUpdate && !showDetails && (
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-start gap-3 text-sm">
              <Edit3 className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-zinc-800">
                  {latestUpdate.updated_by_name || 'Someone'} updated
                </p>
                <p className="text-zinc-600 mt-1 line-clamp-2">
                  {latestUpdate.change_description || 'No description provided'}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {formatDateTime(latestUpdate.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-sm font-medium text-zinc-700 transition"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" /> Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> Show Update & History
            </>
          )}
        </button>

        {/* Expanded Content */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-zinc-100 space-y-8">
            <TaskUpdateForm task={task} onUpdate={onUpdate} />
            <TaskHistory updates={task.updates || []} />
          </div>
        )}

        {/* Footer */}
        {!showDetails && (
          <div className="mt-4 text-center">
            <p className="text-xs text-zinc-500">Task #{task.id}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;