// src/pages/TaskDashboard.jsx – FINAL VERSION WITH TL REPORT HISTORY

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TaskList from '../../components/modules/hr/TaskList';
import CreateTaskForm from '../../components/modules/hr/CreateTaskForm';
import DailyChecklistManager from '../../components/modules/hr/DailyChecklistManager';
import PerformanceReport from '../../components/modules/hr/PerformanceReport';
import CreateProjectForm from '../../components/modules/hr/CreateProjectForm';
import ProjectList from '../../components/modules/hr/ProjectList';

// TL Components
import DailyTLReportForm from '../../components/modules/hr/DailyTLReportForm';           // Submit today's report
import TLReportHistory from '../../components/modules/hr/TLReportHistory';                 // View past reports (new component)
import ManagerTLReportsView from '../../components/modules/hr/ManagerTLReportsView';       // Manager sees all incoming

import {
  CheckCircle2,
  CalendarCheck,
  Users,
  CalendarDays,
  TrendingUp,
  FolderOpen,
  FileText,
  Eye,
  History
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

  const displayedRole = user?.org_role || user?.role || 'Employee';
  const userRoleLower = displayedRole.toLowerCase();

  const isTeamLead = userRoleLower === 'team lead' || userRoleLower === 'team_lead';
  const isManagerOrAbove = [
    'manager', 'hr manager', 'admin',
    'main_org_admin', 'sub_org_admin', 'super_admin'
  ].includes(userRoleLower);

  const canAssignTasks = [
    'hr manager', 'manager', 'team lead', 'team_lead',
    'admin', 'main_org_admin', 'sub_org_admin', 'super_admin'
  ].includes(userRoleLower);

  const hasFullAccess = canAssignTasks;

  const tabs = [
    { key: 'my-tasks', label: 'My Tasks', icon: CheckCircle2, alwaysShow: true },
    { key: 'assign-tasks', label: 'Assign Tasks', icon: Users, show: canAssignTasks },
    { key: 'daily-checklists', label: 'Rate Checklists', icon: CalendarCheck, show: hasFullAccess },
    { key: 'performance', label: 'Performance Report', icon: TrendingUp, show: hasFullAccess },
    { key: 'create-project', label: 'Create Project', icon: FolderOpen, show: hasFullAccess },
    { key: 'projects', label: 'Projects', icon: FolderOpen, show: hasFullAccess },

    // TEAM LEAD: Submit today's report
    {
      key: 'submit-tl-report',
      label: 'Submit Today\'s Report',
      icon: FileText,
      show: isTeamLead
    },

    // TEAM LEAD: View their own report history
    {
      key: 'my-tl-reports',
      label: 'My Daily Reports',
      icon: History,
      show: isTeamLead
    },

    // MANAGER+: View reports from all TLs reporting to them
    {
      key: 'view-tl-reports',
      label: 'Team Lead Reports',
      icon: Eye,
      show: isManagerOrAbove
    },
  ];

  const visibleTabs = tabs.filter(tab => tab.alwaysShow || tab.show);

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col">
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-6 max-w-7xl mx-auto">
          <header className="border-b-2 border-cyan-800 pb-5 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-pulse"></div>
              <h1 className="font-bold text-blue-300">
                ALU-CORE: TASK & PERFORMANCE
              </h1>
            </div>
            <div className="text-right">
              <p className="text-gray-400">
                [{user.first_name || user.email}] • [{displayedRole.toUpperCase()}]
              </p>
            </div>
          </header>

          <div className="text-center mb-12">
            <h2 className="font-bold text-cyan-300 mb-3">
              Welcome back, {user.first_name || user.email.split('@')[0]}
            </h2>
            <p className="text-gray-400">
              Manage tasks, performance, and team reporting
            </p>
          </div>

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

          <div className="bg-gray-900/40 backdrop-blur border-2 border-cyan-900 rounded-2xl shadow-2xl p-10 min-h-[600px]">
            {view === 'my-tasks' && <TaskList />}

            {view === 'assign-tasks' && canAssignTasks && <CreateTaskForm />}

            {view === 'daily-checklists' && hasFullAccess && <DailyChecklistManager />}

            {view === 'performance' && hasFullAccess && <PerformanceReport />}

            {view === 'create-project' && hasFullAccess && <CreateProjectForm />}

            {view === 'projects' && hasFullAccess && <ProjectList />}

            {/* TEAM LEAD: Submit Today's Report */}
            {view === 'submit-tl-report' && isTeamLead && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <FileText className="w-10 h-10 text-cyan-400" />
                  <h3 className="font-bold text-2xl">Submit Today's Team Report</h3>
                </div>
                <DailyTLReportForm />
              </div>
            )}

            {/* TEAM LEAD: View Their Own Report History */}
            {view === 'my-tl-reports' && isTeamLead && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <History className="w-10 h-10 text-cyan-400" />
                  <h3 className="font-bold text-2xl">My Submitted Daily Reports</h3>
                </div>
                <TLReportHistory />
              </div>
            )}

            {/* MANAGER: View Incoming TL Reports */}
            {view === 'view-tl-reports' && isManagerOrAbove && (
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <Eye className="w-10 h-10 text-cyan-400" />
                  <h3 className="font-bold text-2xl">Incoming Team Lead Reports</h3>
                </div>
                <ManagerTLReportsView />
              </div>
            )}
          </div>

          <div className="mt-12 text-center text-gray-500">
            <p>
              Task System Online • {visibleTabs.length} Modules Active • {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center shadow-2xl">
        <span className="text-green-400 font-bold mr-4">&gt;</span>
        <span className="text-gray-400">task-dashboard@{displayedRole}</span>
        <span className="text-cyan-400 mx-2">~</span>
        <span className="text-gray-500">type "help" for commands</span>
      </div>
    </div>
  );
};

export default TaskDashboard;