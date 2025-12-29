// src/pages/TaskDashboard.jsx (CLEAN, ALIGNED & PROFESSIONAL)
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TaskList from '../../components/modules/hr/TaskList';
import CreateTaskForm from '../../components/modules/hr/CreateTaskForm';
import DailyChecklistManager from '../../components/modules/hr/DailyChecklistManager';
import PerformanceReport from '../../components/modules/hr/PerformanceReport';
import CreateProjectForm from '../../components/modules/hr/CreateProjectForm';
import ProjectList from '../../components/modules/hr/ProjectList';

import {
  CheckCircle2,
  CalendarCheck,
  Target,
  Users,
  CalendarDays,
  TrendingUp,
  FolderOpen
} from 'lucide-react';

const TaskDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [view, setView] = useState('my-tasks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300 font-mono">
        Please log in to access Task Dashboard
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-300 font-mono">
        Initializing Task System...
      </div>
    );
  }

  const userRole = user?.role || 'user';

  const isTLOrAbove = [
    'tl', 'team_lead', 'hr_manager',
    'main_org_admin', 'sub_org_admin', 'super_admin'
  ].includes(userRole);

  const isManagerOrAbove = [
    'hr_manager', 'main_org_admin', 'sub_org_admin', 'super_admin'
  ].includes(userRole);

  const tabs = [
    { key: 'my-tasks', label: 'My Tasks', icon: CheckCircle2, alwaysShow: true },
    { key: 'assign-tasks', label: 'Assign Tasks', icon: Users, show: isTLOrAbove },
    { key: 'daily-checklists', label: 'Rate Daily Checklists', icon: CalendarCheck, show: isManagerOrAbove },
    { key: 'performance', label: 'Performance Report', icon: TrendingUp, show: isManagerOrAbove },
    { key: 'create-project', label: 'Create Project', icon: FolderOpen, show: isManagerOrAbove },
    { key: 'projects', label: 'Projects', icon: FolderOpen, show: isManagerOrAbove },
  ];

  const visibleTabs = tabs.filter(tab => tab.alwaysShow || tab.show);

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col">
      {/* Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-6 max-w-7xl mx-auto">

          {/* Header */}
          <header className="border-b-2 border-cyan-800 pb-5 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse"></div>
              <h1 className=" font-bold text-blue-300">
                ALU-CORE: TASK & PERFORMANCE
              </h1>
            </div>
            <div className="text-right">
              <p className=" text-gray-400">
                [{user.first_name || user.email}] • [{userRole.toUpperCase()}]
              </p>
            </div>
          </header>

          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h2 className=" font-bold text-cyan-300 mb-3">
              Welcome back, {user.first_name || user.email.split('@')[0]}
            </h2>
            <p className=" text-gray-400">
              Manage tasks, performance, and projects across your team
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={`flex items-center gap-4 px-8 py-5 rounded-xl transition-all duration-300 font-semibold
                  ${view === tab.key
                    ? 'bg-cyan-900/50 border-2 border-cyan-500 shadow-lg shadow-cyan-500/50 scale-105'
                    : 'bg-gray-900/30 border border-cyan-900 hover:bg-gray-800/40 hover:shadow-cyan-800/30'
                  }`}
              >
                <tab.icon className="w-8 h-8 text-cyan-400" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="bg-gray-900/40 backdrop-blur border-2 border-cyan-900 rounded-2xl shadow-2xl p-10 min-h-[600px]">
            {/* My Tasks */}
            {view === 'my-tasks' && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <CheckCircle2 className="w-10 h-10 text-cyan-400" />
                  <h3 className=" font-bold">My Assigned Tasks</h3>
                </div>
                <TaskList />
              </div>
            )}

            {/* Assign Tasks */}
            {view === 'assign-tasks' && isTLOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <Users className="w-10 h-10 text-cyan-400" />
                  <h3 className="font-bold">Assign New Tasks</h3>
                </div>
                <CreateTaskForm />
              </div>
            )}

            {/* Rate Daily Checklists */}
            {view === 'daily-checklists' && isManagerOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <CalendarDays className="w-10 h-10 text-cyan-400" />
                  <h3 className=" font-bold">Rate Team Daily Performance</h3>
                </div>
                <DailyChecklistManager />
              </div>
            )}

            {/* Performance Report */}
            {view === 'performance' && isManagerOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <TrendingUp className="w-10 h-10 text-cyan-400" />
                  <h3 className=" font-bold">Team Performance Report</h3>
                </div>
                <PerformanceReport />
              </div>
            )}

            {/* Create Project */}
            {view === 'create-project' && isManagerOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <FolderOpen className="w-10 h-10 text-cyan-400" />
                  <h3 className=" font-bold">Launch New Project</h3>
                </div>
                <CreateProjectForm />
              </div>
            )}

            {/* Projects List */}
            {view === 'projects' && isManagerOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <FolderOpen className="w-10 h-10 text-cyan-400" />
                  <h3 className=" font-bold">Project Management</h3>
                </div>
                <ProjectList />
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="mt-12 text-center text-gray-500">
            <p>
              Task System Online • {visibleTabs.length} Modules Active • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Terminal Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center shadow-2xl">
        <span className="text-green-400 font-bold mr-4">&gt;</span>
        <span className="text-gray-400">task-dashboard@{userRole}</span>
        <span className="text-cyan-400 mx-2">~</span>
        <span className="text-gray-500">type "help" for commands</span>
      </div>
    </div>
  );
};

export default TaskDashboard;