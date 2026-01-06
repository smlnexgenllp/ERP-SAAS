// src/components/modules/hr/TaskHistory.jsx (CYBERPUNK FIXED + COMPACT)
import React from 'react';
import { GitCommit, Clock, ArrowRight } from 'lucide-react';

const TaskHistory = ({ updates = [] }) => {
  if (!updates || updates.length === 0) {
    return (
      <div className="mt-12 text-center py-16 bg-gray-900/30 border-2 border-dashed border-cyan-900/40 rounded-2xl">
        <GitCommit className="w-20 h-20 text-cyan-400 mx-auto mb-6 opacity-40 animate-pulse" />
        <p className="text-lg text-gray-400 font-mono">NO UPDATE LOGS YET</p>
        <p className="text-sm text-gray-500 mt-4">Progress history will appear here as you update the task</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <GitCommit className="w-10 h-10 text-cyan-400 animate-pulse" />
        <h4 className="text-xl font-bold text-cyan-300 uppercase tracking-wide">Task History Log</h4>
        <span className="ml-auto text-sm text-gray-400 font-mono">
          {updates.length} commit{updates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Scrollable Timeline Container */}
      <div className="max-h-96 overflow-y-auto pr-2"> {/* Prevents scrollbar overlap */}
        <div className="space-y-6 relative">
          {/* Vertical Line - thinner and closer */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-cyan-800/50 to-transparent"></div>

          {updates.map((update, index) => (
            <div key={update.id} className="relative flex gap-5">
              {/* Timeline Node - Smaller & Closer */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-cyan-500 border-4 border-gray-950 shadow-lg shadow-cyan-500/60 z-10"></div>
              </div>

              {/* Commit Card - Full width, no overflow */}
              <div className="flex-1 min-w-0"> {/* min-w-0 allows breaking */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/60 rounded-xl p-5 shadow-xl hover:shadow-cyan-500/40 transition-all duration-300">
                  {/* Header: Time + Commit # */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <span className="text-gray-400 font-mono">
                        {new Date(update.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-cyan-400 font-bold font-mono">#{updates.length - index}</span>
                  </div>

                  {/* User + Description - FULLY VISIBLE */}
                  <div className="mb-4">
                    <p className="text-cyan-300 font-bold text-lg mb-1">
                      {update.updated_by_name || 'System'}
                    </p>
                    <p className="text-gray-200 text-sm leading-relaxed break-words">
                      {update.change_description || 'No description provided'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {/* Progress Change - Compact & No Overlap */}
                  <div className="flex items-center gap-3 mt-4 px-5 py-3 bg-gray-800/60 rounded-lg border border-cyan-900/40">
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Progress</span>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-400">{update.old_progress}%</span>
                      <ArrowRight className="w-5 h-5 text-cyan-400" />
                      <span className="text-sm font-bold text-green-400">{update.new_progress}%</span>
                    </div>

                    <span className="ml-auto text-xs font-bold text-cyan-300 font-mono">
                      ({update.new_progress > update.old_progress ? '+' : ''}{update.new_progress - update.old_progress}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 font-mono">
          End of task history • All changes are permanently logged for audit
        </p>
      </div>
    </div>
  );
};

export default TaskHistory;