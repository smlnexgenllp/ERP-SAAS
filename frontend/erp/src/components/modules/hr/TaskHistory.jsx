// src/components/modules/hr/TaskHistory.jsx (CYBERPUNK ALU-CORE THEME)
import React from 'react';
import { GitCommit, Clock, ArrowRight } from 'lucide-react';

const TaskHistory = ({ updates }) => {
  if (!updates || updates.length === 0) {
    return (
      <div className="mt-12 text-center py-16 bg-gray-900/30 border-2 border-cyan-900/30 rounded-2xl">
        <GitCommit className="w-20 h-20 text-cyan-400 mx-auto mb-6 opacity-50" />
        <p className=" text-gray-400 font-mono">
          NO UPDATE LOGS YET
        </p>
        <p className=" text-gray-500 mt-4">
          Progress history will appear here as you update the task
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16">
      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <GitCommit className="w-12 h-12 text-cyan-400 animate-pulse" />
        <h4 className=" font-bold text-cyan-300">
          TASK HISTORY LOG
        </h4>
        <span className="ml-auto text-gray-400  font-mono">
          {updates.length} commit{updates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-8 relative">
        {/* Vertical Line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-cyan-800/50"></div>

        {updates.map((update, index) => (
          <div key={update.id} className="relative flex gap-6">
            {/* Timeline Node */}
            <div className="flex-shrink-0 w-20 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-cyan-500 border-4 border-gray-950 shadow-lg shadow-cyan-500/50 z-10"></div>
              {index < updates.length - 1 && (
                <div className="w-0.5 h-full bg-cyan-800/50 absolute top-5 left-2.5"></div>
              )}
            </div>

            {/* Commit Card */}
            <div className="flex-1 bg-gray-900/40 backdrop-blur border-2 border-cyan-900/50 rounded-2xl p-8 shadow-xl hover:shadow-cyan-500/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Clock className="w-6 h-6 text-cyan-400" />
                  <span className="text-gray-400 font-mono ">
                    {new Date(update.timestamp).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className="text-cyan-400 font-mono text-sm">
                  #{updates.length - index}
                </span>
              </div>

              <div className="mb-6">
                <p className=" font-bold text-cyan-300 mb-2">
                  {update.updated_by_name || 'System'}
                </p>
                <p className="text-gray-300 leading-relaxed">
                  {update.change_description}
                </p>
              </div>

              {/* Progress Change */}
              <div className="flex items-center gap-4 bg-gray-800/50 px-6 py-4 rounded-xl border border-cyan-800/50">
                <span className="text-gray-400 font-mono">Progress:</span>
                <span className=" font-bold text-red-400">
                  {update.old_progress}%
                </span>
                <ArrowRight className="w-8 h-8 text-cyan-400" />
                <span className=" font-bold text-green-400">
                  {update.new_progress}%
                </span>
                <span className="ml-4 text-cyan-300 font-mono">
                  (+{update.new_progress - update.old_progress}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm font-mono">
        End of task history • All changes are permanently logged for audit
      </div>
    </div>
  );
};

export default TaskHistory;