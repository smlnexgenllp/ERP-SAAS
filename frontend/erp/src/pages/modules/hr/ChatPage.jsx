// src/pages/hr/ChatPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import ChatSidebar from "../../../components/modules/chat/ChatSidebar";
import ChatWindow from "../../../components/modules/chat/ChatWindow";
import CreateGroupModal from "../../../components/modules/chat/CreateGroupModal";
import { useAuth } from "../../../context/AuthContext";
import { MessageSquare, Users, Plus, AlertCircle, RefreshCw } from "lucide-react";
import api from "../../../services/api";

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/hr/chat/groups/');
      const groups = res.data || [];
      const totalUnread = groups.reduce((sum, group) => sum + (group.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      setError("Could not update unread count");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount, refreshSidebar]);

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    setRefreshSidebar(prev => prev + 1);
  };

  const handleGroupUpdated = (updatedGroup) => {
    setSelectedGroup(updatedGroup);
    setRefreshSidebar(prev => prev + 1);
  };

  const handleGroupDeleted = () => {
    setSelectedGroup(null);
    setRefreshSidebar(prev => prev + 1);
  };

  const handleRefresh = () => {
    fetchUnreadCount();
    setRefreshSidebar(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <MessageSquare className="w-9 h-9 text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {loading && (
              <RefreshCw className="absolute -top-2 -right-2 w-4 h-4 text-blue-600 animate-spin" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Team Chat
            </h1>
            <p className="text-sm text-zinc-500">
              Real-time messaging for your organization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-zinc-800 font-medium">
              {user?.employee?.full_name || user?.email || "User"}
            </p>
            {user?.employee?.department && (
              <p className="text-xs text-zinc-500">
                {user.employee.department.name}
              </p>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-zinc-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-zinc-500" />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center gap-2 transition-all duration-300 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Group
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={fetchUnreadCount} className="text-xs text-red-600 hover:text-red-700 font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Main Layout - Independent Scrolling */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar - Scrollable */}
        <div className="w-80 border-r border-zinc-200 bg-white overflow-y-auto flex-shrink-0 custom-scrollbar">
          <ChatSidebar
            onSelectGroup={setSelectedGroup}
            currentUser={user}
            selectedGroup={selectedGroup}
            refreshTrigger={refreshSidebar}
          />
        </div>

        {/* Chat Area - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedGroup ? (
            <ChatWindow
              group={selectedGroup}
              currentUser={user}
              onBack={() => setSelectedGroup(null)}
              onGroupUpdated={handleGroupUpdated}
              onGroupDeleted={handleGroupDeleted}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-start bg-zinc-50 pt-16 p-6 overflow-y-auto custom-scrollbar">
              <div className="max-w-md text-center">
                <div className="mb-5">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow">
                    <Users className="w-10 h-10 text-blue-600" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-zinc-900 mb-3">
                  Welcome to Team Chat
                </h2>
                <p className="text-zinc-600 mb-10 text-[17px] leading-relaxed">
                  Select a conversation from the sidebar or create a new group 
                  to start collaborating with your team in real-time.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-all duration-300 group">
                    <MessageSquare className="w-6 h-6 text-blue-600 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                    <h4 className="font-medium text-zinc-800">Organization Chat</h4>
                    <p className="text-sm text-zinc-500 mt-1">Company-wide announcements</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-all duration-300 group">
                    <div className="w-6 h-6 text-blue-600 mb-2 mx-auto group-hover:scale-110 transition-transform">📋</div>
                    <h4 className="font-medium text-zinc-800">Project Teams</h4>
                    <p className="text-sm text-zinc-500 mt-1">Project-specific discussions</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-zinc-100 hover:border-blue-200 transition-all duration-300 group">
                    <div className="w-6 h-6 text-blue-600 mb-2 mx-auto group-hover:scale-110 transition-transform">👥</div>
                    <h4 className="font-medium text-zinc-800">Custom Groups</h4>
                    <p className="text-sm text-zinc-500 mt-1">Create your own teams</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupCreated}
          currentUser={user}
        />
      )}
    </div>
  );
}