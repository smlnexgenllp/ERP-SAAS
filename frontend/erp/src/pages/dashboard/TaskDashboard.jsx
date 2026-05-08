// src/pages/TaskDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TaskList from '../../components/modules/hr/TaskList';
import CreateTaskForm from '../../components/modules/hr/CreateTaskForm';
import DailyChecklistManager from '../../components/modules/hr/DailyChecklistManager';
import PerformanceReport from '../../components/modules/hr/PerformanceReport';
import CreateProjectForm from '../../components/modules/hr/CreateProjectForm';
import ProjectList from '../../components/modules/hr/ProjectList';

// TL Components
import DailyTLReportForm from '../../components/modules/hr/DailyTLReportForm';
import TLReportHistory from '../../components/modules/hr/TLReportHistory';
import ManagerTLReportsView from '../../components/modules/hr/ManagerTLReportsView';

import {
  CheckCircle2,
  CalendarCheck,
  Users,
  CalendarDays,
  TrendingUp,
  FolderOpen,
  FileText,
  Eye,
  History,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

const TaskDashboard = () => {
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 text-zinc-600">
        Please log in to access Task Dashboard
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-500 mt-4">Initializing Task System...</p>
        </div>
      </div>
    );
  }

  const displayedRole = user?.org_role || user?.role || 'employee';
  const userRoleLower = displayedRole.toLowerCase();

  const isTeamLead = userRoleLower === 'team lead' || userRoleLower === 'team_lead';
  const isManagerOrAbove = [
    'manager', 'hr manager', 'admin',
    'main_org_admin', 'sub_org_admin', 'super_admin'
  ].includes(userRoleLower);

  const canAssignTasks = [
    'hr manager', 'manager', 'team lead', 'team_lead',
    'admin', 'main_org_admin', 'sub_org_admin', 'super_admin',
  ].includes(userRoleLower);

  const hasFullAccess = canAssignTasks;

  const tabs = [
    { key: 'my-tasks', label: 'My Tasks', icon: CheckCircle2, alwaysShow: true },
    { key: 'assign-tasks', label: 'Assign Tasks', icon: Users, show: canAssignTasks },
    { key: 'daily-checklists', label: 'Rate Checklists', icon: CalendarCheck, show: hasFullAccess },
    { key: 'performance', label: 'Performance Report', icon: TrendingUp, show: hasFullAccess },
    { key: 'create-project', label: 'Create Project', icon: FolderOpen, show: hasFullAccess },
    { key: 'projects', label: 'Projects', icon: FolderOpen, show: hasFullAccess },

    // TEAM LEAD
    { key: 'submit-tl-report', label: "Submit Today's Report", icon: FileText, show: isTeamLead },
    { key: 'my-tl-reports', label: 'My Daily Reports', icon: History, show: isTeamLead },

    // MANAGER+
    { key: 'view-tl-reports', label: 'Team Lead Reports', icon: Eye, show: isManagerOrAbove },
  ];

  const visibleTabs = tabs.filter(tab => tab.alwaysShow || tab.show);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Task & Performance
                </h1>
                <p className="text-zinc-500">Manage tasks, performance, and team reporting</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-zinc-600 font-medium">
              {user.first_name || user.email.split('@')[0]}
            </p>
            <p className="text-sm text-zinc-500">[{displayedRole.toUpperCase()}]</p>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Welcome back, {user.first_name || user.email.split('@')[0]}
          </h2>
          <p className="text-zinc-500">Manage your tasks and team performance</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-medium transition-all ${
                view === tab.key
                  ? "bg-zinc-900 text-white shadow"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-8 min-h-[650px]">
          {view === 'my-tasks' && <TaskList />}

          {view === 'assign-tasks' && canAssignTasks && <CreateTaskForm />}

          {view === 'daily-checklists' && hasFullAccess && <DailyChecklistManager />}

          {view === 'performance' && hasFullAccess && <PerformanceReport />}

          {view === 'create-project' && hasFullAccess && <CreateProjectForm />}

          {view === 'projects' && hasFullAccess && <ProjectList />}

          {/* TEAM LEAD: Submit Today's Report */}
          {view === 'submit-tl-report' && isTeamLead && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <FileText className="w-8 h-8 text-emerald-600" />
                <h3 className="text-2xl font-semibold text-zinc-900">Submit Today's Team Report</h3>
              </div>
              <DailyTLReportForm />
            </div>
          )}

          {/* TEAM LEAD: View Their Own Report History */}
          {view === 'my-tl-reports' && isTeamLead && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <History className="w-8 h-8 text-emerald-600" />
                <h3 className="text-2xl font-semibold text-zinc-900">My Submitted Daily Reports</h3>
              </div>
              <TLReportHistory />
            </div>
          )}

          {/* MANAGER: View Incoming TL Reports */}
          {view === 'view-tl-reports' && isManagerOrAbove && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Eye className="w-8 h-8 text-emerald-600" />
                <h3 className="text-2xl font-semibold text-zinc-900">Incoming Team Lead Reports</h3>
              </div>
              <ManagerTLReportsView />
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-zinc-500 text-sm">
          Task System Online • {visibleTabs.length} Modules Active • {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard;