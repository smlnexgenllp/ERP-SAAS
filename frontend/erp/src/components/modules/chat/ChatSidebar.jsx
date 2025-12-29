// components/modules/chat/ChatSidebar.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { 
  MessageSquare, 
  Building, 
  Briefcase, 
  Users, 
  Clock,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

function ChatSidebar({ onSelectGroup, currentUser, selectedGroup, refreshTrigger }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get('/hr/chat/groups/');
      
      // Transform data to include icons and better grouping
      const transformedGroups = (res.data || []).map(group => ({
        ...group,
        icon: getGroupIcon(group.group_type),
        memberCount: group.member_count || 0,
        lastMessageTime: group.last_message?.timestamp 
          ? new Date(group.last_message.timestamp).getTime()
          : 0
      }));
      
      setGroups(transformedGroups);
    } catch (err) {
      console.error("Failed to load chat groups:", err);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.error || 
                      err.message ||
                      "Unable to load chat groups. Please check your connection.";
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [refreshTrigger]);

  const getGroupIcon = (groupType) => {
    switch(groupType) {
      case 'organization': return Building;
      case 'project': return Briefcase;
      case 'custom': return Users;
      default: return MessageSquare;
    }
  };

  const getGroupTypeLabel = (groupType) => {
    switch(groupType) {
      case 'organization': return 'Organization';
      case 'project': return 'Project';
      case 'custom': return 'Custom Group';
      default: return 'Chat';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  // Filter groups based on search and filter
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || group.group_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Sort groups: unread first, then by last message time
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    // Unread groups first
    if (a.unread_count > 0 && b.unread_count === 0) return -1;
    if (a.unread_count === 0 && b.unread_count > 0) return 1;
    
    // Then by most recent activity
    return b.lastMessageTime - a.lastMessageTime;
  });

  // Group by type for better organization
  const groupedChats = {
    organization: sortedGroups.filter(g => g.group_type === 'organization'),
    project: sortedGroups.filter(g => g.group_type === 'project'),
    custom: sortedGroups.filter(g => g.group_type === 'custom'),
  };

  if (loading && !refreshing) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-200">Chats</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your chats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-200">Chats</h2>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Failed to Load</h3>
          <p className="text-gray-400 text-center mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900/30">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100">Conversa\tions</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
              title="Refresh chats"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              filterType === 'all' 
                ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/50' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('organization')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              filterType === 'organization' 
                ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Building className="w-3 h-3 inline mr-1" />
            Org
          </button>
          <button
            onClick={() => setFilterType('project')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              filterType === 'project' 
                ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Briefcase className="w-3 h-3 inline mr-1" />
            Projects
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition ${
              filterType === 'custom' 
                ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Users className="w-3 h-3 inline mr-1" />
            Custom
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {sortedGroups.length === 0 ? (
          <div className="p-8 text-center">
            {searchTerm || filterType !== 'all' ? (
              <>
                <Filter className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No matching chats found</p>
                <p className="text-sm text-gray-600">
                  Try adjusting your search or filter
                </p>
              </>
            ) : (
              <>
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No chat groups yet</p>
                <p className="text-sm text-gray-600">
                  Create a group to start chatting
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800/50">
            {sortedGroups.map((group) => {
              const Icon = group.icon;
              const isSelected = selectedGroup?.id === group.id;
              
              return (
                <div
                  key={group.id}
                  onClick={() => onSelectGroup(group)}
                  className={`p-4 cursor-pointer transition-all duration-200 border-l-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-900/20 to-transparent border-l-cyan-500'
                      : 'hover:bg-gray-800/30 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      group.group_type === 'organization' ? 'bg-blue-900/30' :
                      group.group_type === 'project' ? 'bg-emerald-900/30' :
                      'bg-purple-900/30'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        group.group_type === 'organization' ? 'text-blue-400' :
                        group.group_type === 'project' ? 'text-emerald-400' :
                        'text-purple-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          group.unread_count > 0 ? 'text-gray-100' : 'text-gray-300'
                        }`}>
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {group.last_message && (
                            <span className="text-xs text-gray-500">
                              {formatTime(group.last_message.timestamp)}
                            </span>
                          )}
                          {group.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center">
                              {group.unread_count > 99 ? '99+' : group.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full ${
                          group.group_type === 'organization' ? 'bg-blue-900/20 text-blue-400' :
                          group.group_type === 'project' ? 'bg-emerald-900/20 text-emerald-400' :
                          'bg-purple-900/20 text-purple-400'
                        }`}>
                          {getGroupTypeLabel(group.group_type)}
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.memberCount} members
                        </span>
                      </div>
                      
                      {group.last_message && (
                        <p className="text-sm text-gray-400 truncate mt-2">
                          <span className="font-medium text-gray-300">
                            {group.last_message.sender}:
                          </span>{' '}
                          {group.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-bold text-gray-300">{groups.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Unread</div>
            <div className="text-lg font-bold text-cyan-400">
              {groups.reduce((sum, g) => sum + (g.unread_count || 0), 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-lg font-bold text-emerald-400">
              {groups.filter(g => g.lastMessageTime > Date.now() - 3600000).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar;