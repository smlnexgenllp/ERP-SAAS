// src/pages/hr/ChatPage.jsx
import React, { useState, useEffect } from "react";
import ChatSidebar from "../../../components/modules/chat/ChatSidebar";
import ChatWindow from "../../../components/modules/chat/ChatWindow";
import CreateGroupModal from "../../../components/modules/chat/CreateGroupModal";
import { useAuth } from "../../../context/AuthContext";
import { MessageSquare, Users, Plus, AlertCircle } from "lucide-react";
import api from "../../../services/api";

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshSidebar, setRefreshSidebar] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch total unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // You might need to add an endpoint for total unread count
        // For now, we'll calculate from groups
        const res = await api.get('/hr/chat/groups/');
        const groups = res.data || [];
        const totalUnread = groups.reduce((sum, group) => sum + (group.unread_count || 0), 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds for unread count
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshSidebar]);

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    setRefreshSidebar(prev => prev + 1); // Trigger sidebar refresh
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between shadow-2xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <MessageSquare className="w-9 h-9 text-cyan-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-300 tracking-tight">
              Team Chat
            </h1>
            <p className="text-sm text-gray-400">
              Real-time messaging for your organization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-cyan-300 font-medium">
              {user?.employee?.full_name || user?.email || "User"}
            </p>
            {user?.employee?.department && (
              <p className="text-xs text-gray-500">
                {user.employee.department.name}
              </p>
            )}
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
          >
            <Plus className="w-5 h-5" />
            New Group
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <ChatSidebar
            onSelectGroup={setSelectedGroup}
            currentUser={user}
            selectedGroup={selectedGroup}
            refreshTrigger={refreshSidebar}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <ChatWindow 
              group={selectedGroup} 
              onBack={() => setSelectedGroup(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-950/50 p-8">
              <div className="max-w-md text-center">
                <div className="mb-6">
                  <Users className="w-32 h-32 text-cyan-900/30 mx-auto" />
                </div>
                <h2 className="text-3xl font-bold text-gray-300 mb-4">
                  Welcome to Team Chat
                </h2>
                <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                  Select a conversation from the sidebar or create a new group 
                  to start collaborating with your team in real-time.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <MessageSquare className="w-6 h-6 text-cyan-400 mb-2 mx-auto" />
                    <h4 className="font-medium text-gray-300">Organization Chat</h4>
                    <p className="text-sm text-gray-500 mt-1">Company-wide announcements</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="w-6 h-6 text-cyan-400 mb-2 mx-auto">📋</div>
                    <h4 className="font-medium text-gray-300">Project Teams</h4>
                    <p className="text-sm text-gray-500 mt-1">Project-specific discussions</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <div className="w-6 h-6 text-cyan-400 mb-2 mx-auto">👥</div>
                    <h4 className="font-medium text-gray-300">Custom Groups</h4>
                    <p className="text-sm text-gray-500 mt-1">Create your own teams</p>
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