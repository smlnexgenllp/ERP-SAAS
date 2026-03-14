// components/modules/chat/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import {
  Send, Paperclip, Smile, MoreVertical, ArrowLeft,
  User, Image as ImageIcon, File, Download, Trash2,
  Copy, Edit, Pin, Bell, BellOff, Users, Info,
  Check, CheckCheck, Clock, RefreshCw, Building,
  Briefcase, MessageSquare, Loader2, AlertTriangle,
  ChevronLeft, Phone, Video, Search, Filter, Shield,
  Calendar, FileText, X, Eye, EyeOff, AtSign, Mic,
  MicOff, ThumbsUp, Award, Crown, Star, Target,
  UserPlus, UserMinus, Settings, LogOut
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import EditGroupModal from './EditGroupModal';
import AddMemberModal from './AddMemberModal';

// Cache for storing messages by group ID
const messagesCache = new Map();
// Cache for pinned messages by group ID
const pinnedCache = new Map();
// Cache for group members by group ID
const membersCache = new Map();

const ChatWindow = ({ group, currentUser, onBack, onGroupUpdated, onGroupDeleted }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [socket, setSocket] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);

  // State for group management
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  // Check if current user is group creator
  useEffect(() => {
    if (group && currentUser) {
      let creatorId = null;

      if (group.created_by_details?.id) {
        creatorId = group.created_by_details.id;
      } else if (group.created_by?.id) {
        creatorId = group.created_by.id;
      } else if (typeof group.created_by === 'number') {
        creatorId = group.created_by;
      } else if (group.created_by_id) {
        creatorId = group.created_by_id;
      }

      setIsCreator(creatorId === currentUser?.id);
    }
  }, [group, currentUser]);

  // Fetch group members
  const fetchGroupMembers = useCallback(async () => {
    if (!group?.id) return;

    // Check cache first
    if (membersCache.has(group.id)) {
      setGroupMembers(membersCache.get(group.id));
      return;
    }

    try {
      const res = await api.get(`/hr/chat/groups/${group.id}/members/`);
      const members = res.data || [];
      membersCache.set(group.id, members);
      setGroupMembers(members);
    } catch (error) {
      console.error('Failed to fetch group members:', error);
      if (group?.created_by) {
        const fallbackMembers = [{
          id: group.created_by.id,
          email: group.created_by.email || '',
          full_name: group.created_by.full_name || 'Creator',
          is_creator: true
        }];
        membersCache.set(group.id, fallbackMembers);
        setGroupMembers(fallbackMembers);
      }
    }
  }, [group?.id, group?.created_by]);

  // Load messages with cache
  const loadMessages = useCallback(async (showLoading = false) => {
    if (!group?.id) return;

    // Check cache first for instant display
    if (messagesCache.has(group.id)) {
      const cachedMessages = messagesCache.get(group.id);
      setMessages(cachedMessages);
      setFilteredMessages(cachedMessages);
      
      // If we already have cached messages, don't show loading
      if (!showLoading) {
        // Still fetch in background for updates
        fetchMessagesInBackground();
        return;
      }
    }

    // Show loading only if explicitly requested and no cache
    if (showLoading) setLoading(true);
    
    try {
      setError(null);
      const res = await api.get(`/hr/chat/groups/${group.id}/messages/`);
      const newMessages = res.data || [];
      
      // Update cache
      messagesCache.set(group.id, newMessages);
      
      setMessages(newMessages);
      setFilteredMessages(newMessages);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [group?.id]);

  // Background fetch for updates
  const fetchMessagesInBackground = useCallback(async () => {
    if (!group?.id) return;

    try {
      const res = await api.get(`/hr/chat/groups/${group.id}/messages/`);
      const newMessages = res.data || [];
      
      // Update cache
      messagesCache.set(group.id, newMessages);
      
      setMessages(newMessages);
      setFilteredMessages(prev => {
        if (!searchQuery) return newMessages;
        const query = searchQuery.toLowerCase();
        return newMessages.filter(msg =>
          msg.content?.toLowerCase().includes(query) ||
          msg.sender?.full_name?.toLowerCase().includes(query) ||
          msg.sender?.email?.toLowerCase().includes(query)
        );
      });
    } catch (err) {
      console.error("Background fetch failed:", err);
    }
  }, [group?.id, searchQuery]);

  // Load pinned messages with cache
  const loadPinnedMessages = useCallback(async () => {
    if (!group?.id) return;

    // Check cache first
    if (pinnedCache.has(group.id)) {
      setPinnedMessages(pinnedCache.get(group.id));
      return;
    }

    try {
      const res = await api.get(`/hr/chat/groups/${group.id}/pinned/`);
      const pinned = res.data || [];
      pinnedCache.set(group.id, pinned);
      setPinnedMessages(pinned);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    }
  }, [group.id]);

  // Fetch project members
  const fetchProjectMembers = useCallback(async () => {
    if (group.group_type !== 'project' || !group.project) return;

    try {
      setLoadingMembers(true);
      const res = await api.get(`/hr/projects/${group.project}/chat-members/`);
      setProjectMembers(res.data.members || []);
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [group]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/chat/${group.id}/`;

    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setError(null);

      newSocket.send(JSON.stringify({
        type: 'presence',
        action: 'join',
        user_id: currentUser?.id
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'new_message':
            setMessages(prev => {
              const updated = [...prev, data.message];
              // Update cache
              messagesCache.set(group.id, updated);
              return updated;
            });
            setFilteredMessages(prev => {
              if (!searchQuery) return [...prev, data.message];
              const query = searchQuery.toLowerCase();
              const matches = data.message.content?.toLowerCase().includes(query) ||
                data.message.sender?.full_name?.toLowerCase().includes(query) ||
                data.message.sender?.email?.toLowerCase().includes(query);
              return matches ? [...prev, data.message] : prev;
            });
            break;

          case 'message_deleted':
            setMessages(prev => {
              const updated = prev.filter(msg => msg.id !== data.message_id);
              messagesCache.set(group.id, updated);
              return updated;
            });
            setFilteredMessages(prev => prev.filter(msg => msg.id !== data.message_id));
            break;

          case 'typing':
            setTyping(data.is_typing);
            break;

          case 'presence':
            if (data.action === 'join') {
              setOnlineUsers(prev => [...new Set([...prev, data.user_id])]);
            } else if (data.action === 'leave') {
              setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
            }
            break;

          case 'user_joined':
            setOnlineUsers(prev => [...prev, data.user_id]);
            break;

          case 'user_left':
            setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
            break;

          case 'message_pinned':
            setPinnedMessages(prev => {
              const updated = [...prev, data.message];
              pinnedCache.set(group.id, updated);
              return updated;
            });
            break;

          case 'message_unpinned':
            setPinnedMessages(prev => {
              const updated = prev.filter(msg => msg.id !== data.message_id);
              pinnedCache.set(group.id, updated);
              return updated;
            });
            break;

          case 'group_updated':
            if (onGroupUpdated) {
              onGroupUpdated(data.group);
            }
            fetchGroupMembers();
            break;

          case 'member_added':
            fetchGroupMembers();
            break;

          case 'member_removed':
            fetchGroupMembers();
            break;

          case 'group_deleted':
            if (onGroupDeleted) {
              onGroupDeleted();
            }
            onBack();
            break;

          case 'error':
            console.error('WebSocket error:', data.error);
            setError(data.error);
            break;

          default:
            console.log('Unknown WebSocket message:', data);
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    newSocket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError("Connection error");
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);

      if (event.code !== 1000 && event.code !== 1001) {
        setError("Connection lost — reconnecting...");
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      }
    };

    setSocket(newSocket);
    return newSocket;
  }, [group.id, currentUser?.id, onGroupUpdated, onBack, fetchGroupMembers, onGroupDeleted, searchQuery]);

  // Initial load - use cache first
  useEffect(() => {
    if (!group?.id) return;

    // Reset states for new group
    setSearchQuery('');
    setError(null);
    setTyping(false);
    
    // Check cache first for instant display
    if (messagesCache.has(group.id)) {
      setMessages(messagesCache.get(group.id));
      setFilteredMessages(messagesCache.get(group.id));
    } else {
      // Only show loading if no cache
      setLoading(true);
    }
    
    if (pinnedCache.has(group.id)) {
      setPinnedMessages(pinnedCache.get(group.id));
    }
    
    if (membersCache.has(group.id)) {
      setGroupMembers(membersCache.get(group.id));
    }

    // Fetch fresh data in background
    const fetchAll = async () => {
      await Promise.allSettled([
        loadMessages(true), // Pass true to update loading state if needed
        fetchGroupMembers(),
        loadPinnedMessages(),
        fetchProjectMembers()
      ]);
    };

    fetchAll();

    // WebSocket connection
    const ws = connectWebSocket();

    return () => {
      if (ws) ws.close(1000, 'Leaving chat');
      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [group.id, connectWebSocket, loadMessages, fetchGroupMembers, loadPinnedMessages, fetchProjectMembers]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = messages.filter(msg =>
      msg.content?.toLowerCase().includes(query) ||
      msg.sender?.full_name?.toLowerCase().includes(query) ||
      msg.sender?.email?.toLowerCase().includes(query)
    );

    setFilteredMessages(filtered);
  }, [searchQuery, messages]);

  const handleTyping = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing', is_typing: true }));

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'typing', is_typing: false }));
        }
      }, 2000);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !file) || sending || !socket) return;

    setSending(true);
    let fileUrl = null;

    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/hr/chat/upload-file/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = res.data.url;
      } catch (err) {
        console.error('File upload failed:', err);
        alert('Failed to upload file. Please try again.');
        setSending(false);
        return;
      }
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat_message',
        content: input.trim(),
        file_url: fileUrl,
        group_id: group.id
      }));
    }

    setInput('');
    setFile(null);
    setSending(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('File type not supported. Please upload images, PDFs, or documents.');
      return;
    }

    setFile(selectedFile);
  };

  const togglePinMessage = async (messageId) => {
    try {
      const res = await api.post(`/hr/chat/messages/${messageId}/pin/`);
      if (res.data.pinned) {
        setPinnedMessages(prev => {
          const updated = [...prev, res.data.message];
          pinnedCache.set(group.id, updated);
          return updated;
        });
      } else {
        setPinnedMessages(prev => {
          const updated = prev.filter(msg => msg.id !== messageId);
          pinnedCache.set(group.id, updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/hr/chat/messages/${messageId}/`);
      setMessages(prev => {
        const updated = prev.filter(msg => msg.id !== messageId);
        messagesCache.set(group.id, updated);
        return updated;
      });
      setFilteredMessages(prev => prev.filter(msg => msg.id !== messageId));
      setPinnedMessages(prev => {
        const updated = prev.filter(msg => msg.id !== messageId);
        pinnedCache.set(group.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const reactToMessage = async (messageId, reaction) => {
    try {
      await api.post(`/hr/chat/messages/${messageId}/react/`, { reaction });
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
            : msg
        );
        messagesCache.set(group.id, updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  // Group management functions
  const handleUpdateGroup = async (updatedGroup) => {
    if (onGroupUpdated) {
      onGroupUpdated(updatedGroup);
    }
    setShowEditModal(false);
    fetchGroupMembers();
  };

  const handleAddMember = async (payload) => {
    try {
      console.log('Adding member with payload:', payload);
      const response = await api.post(`/hr/chat/groups/${group.id}/add-member/`, payload);
      console.log('Add member response:', response.data);

      fetchGroupMembers();

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'member_added',
          group_id: group.id,
          ...payload
        }));
      }

      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Failed to add member:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (payload, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from the group?`)) return;

    try {
      console.log('Removing member with payload:', payload);
      const response = await api.post(`/hr/chat/groups/${group.id}/remove-member/`, payload);
      console.log('Remove member response:', response.data);

      fetchGroupMembers();

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'member_removed',
          group_id: group.id,
          ...payload
        }));
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await api.delete(`/hr/chat/groups/${group.id}/delete/`);

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'group_deleted',
          group_id: group.id
        }));
      }

      setShowDeleteConfirm(false);
      if (onGroupDeleted) {
        onGroupDeleted();
      }
      onBack();
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const getGroupIcon = () => {
    switch (group.group_type) {
      case 'organization': return Building;
      case 'project': return Briefcase;
      case 'custom': return Users;
      default: return MessageSquare;
    }
  };

  const getGroupTypeLabel = () => {
    switch (group.group_type) {
      case 'organization': return 'Organization Chat';
      case 'project': return 'Project Team';
      case 'custom': return 'Custom Group';
      default: return 'Chat';
    }
  };

  const renderFilePreview = () => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');

    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-3">
        {isImage ? (
          <ImageIcon className="w-6 h-6 text-cyan-400" />
        ) : (
          <File className="w-6 h-6 text-cyan-400" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button onClick={() => setFile(null)} className="p-1 hover:bg-gray-700 rounded">
          <Trash2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  };

  const renderMessage = (msg) => {
    const isOwn = msg.sender?.id === currentUser?.id;
    const isImage = msg.file_url && msg.file_url.match(/\.(jpg|jpeg|png|gif)$/i);
    const isFile = msg.file_url && !isImage;
    const isOnline = onlineUsers?.includes(msg.sender?.id);
    const isPinned = pinnedMessages.some(pm => pm.id === msg.id);

    return (
      <div key={msg.id} className={`flex gap-3 mb-4 hover:bg-gray-800/10 p-2 rounded-lg transition ${isOwn ? 'flex-row-reverse' : ''}`} id={`message-${msg.id}`}>
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? 'bg-gradient-to-br from-cyan-600 to-blue-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
            {msg.sender?.photo ? (
              <img src={msg.sender.photo} alt={msg.sender.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold">{msg.sender?.full_name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          {!isOwn && isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
          )}
        </div>

        <div className={`flex-1 max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
          {!isOwn && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-300">
                {msg.sender?.full_name || msg.sender?.email || 'Unknown User'}
              </span>
              {msg.sender?.employee?.designation && (
                <span className="text-xs px-2 py-0.5 bg-gray-800/50 rounded-full">
                  {msg.sender.employee.designation}
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
              </span>
              {isPinned && <Pin className="w-3 h-3 text-amber-500" />}
            </div>
          )}

          <div className={`relative rounded-2xl px-4 py-2.5 ${isOwn ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
            {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

            {msg.file_url && (
              <div className="mt-2">
                {isImage ? (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-gray-700">
                    <img src={msg.file_url} alt="Attachment" className="max-w-full max-h-64 object-cover hover:opacity-90 transition" loading="lazy" />
                  </a>
                ) : (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition">
                    <File className="w-4 h-4" />
                    <span className="text-sm">{msg.file_url.split('/').pop()}</span>
                    <Download className="w-3 h-3 ml-2" />
                  </a>
                )}
              </div>
            )}

            {msg.reactions && msg.reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {msg.reactions.map((reaction, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-900/70 rounded-full text-xs">{reaction}</span>
                ))}
              </div>
            )}

            <div className={`absolute -bottom-6 ${isOwn ? '-right-2' : '-left-2'} flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity`}>
              <button onClick={() => reactToMessage(msg.id, '👍')} className="p-1 hover:bg-gray-700 rounded" title="Like">
                <ThumbsUp className="w-3 h-3 text-gray-400" />
              </button>
              <button onClick={() => togglePinMessage(msg.id)} className="p-1 hover:bg-gray-700 rounded" title={isPinned ? "Unpin message" : "Pin message"}>
                <Pin className={`w-3 h-3 ${isPinned ? 'text-amber-500' : 'text-gray-400'}`} />
              </button>
              <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-gray-700 rounded text-red-400" title="Delete">
                <Trash2 className="w-3 h-3" />
              </button>
              <button onClick={() => navigator.clipboard.writeText(msg.content || '')} className="p-1 hover:bg-gray-700 rounded" title="Copy">
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {isOwn && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <CheckCheck className="w-3 h-3" />
              <span>Delivered</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMembersSidebar = () => {
    const Icon = getGroupIcon();
    const isProject = group.group_type === 'project';
    const creatorId = group.created_by?.id || group.created_by;

    return (
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl z-10 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-900/30 to-blue-900/30">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-100">Group Info</h3>
            </div>
            <button onClick={() => setShowMembers(false)} className="p-2 hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <h4 className="font-medium text-gray-300 mb-3">About</h4>
          <p className="text-gray-400 text-sm mb-4">{getGroupTypeLabel()}</p>

          {(group.created_by || group.created_by_details) && (
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-400">
                Created by {
                  group.created_by_details?.full_name ||
                  group.created_by?.full_name ||
                  group.created_by?.email ||
                  'Creator'
                }
                {creatorId === currentUser?.id && ' (You)'}
              </span>
            </div>
          )}

          {isProject && group.project_name && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Briefcase className="w-4 h-4" />
              <span>Project: {group.project_name}</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-4 h-4" />
              <span>{group.member_count || groupMembers.length || 0} members</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>{(onlineUsers || []).length} online</span>
            </div>
          </div>

          {isCreator && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition"
              >
                <Edit className="w-4 h-4" />
                Edit Group
              </button>

              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <UserPlus className="w-4 h-4" />
                Add Members
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition border border-red-900/50"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            </div>
          )}
        </div>

        {pinnedMessages.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-300">Pinned Messages</h4>
              <button onClick={() => setShowPinned(true)} className="text-xs text-cyan-400 hover:text-cyan-300">
                View all
              </button>
            </div>
            <div className="space-y-2">
              {pinnedMessages.slice(0, 3).map(msg => (
                <div
                  key={msg.id}
                  className="p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => {
                    const element = document.getElementById(`message-${msg.id}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      element.classList.add('bg-amber-900/20');
                      setTimeout(() => element.classList.remove('bg-amber-900/20'), 2000);
                    }
                  }}
                >
                  <p className="text-xs text-gray-300 truncate">{msg.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.sender?.full_name} • {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-300">Members ({groupMembers.length})</h4>
              {loadingMembers && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            {loadingMembers ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-2 w-16 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {groupMembers.map(member => {
                  const isOnline = onlineUsers?.includes(member.id);
                  const isMemberCreator = member.is_creator || member.id === creatorId;
                  const isCurrentUser = member.id === currentUser?.id;

                  return (
                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-800/30 rounded-lg group">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMemberCreator
                            ? 'bg-gradient-to-br from-amber-600 to-orange-600'
                            : 'bg-gradient-to-br from-cyan-600 to-blue-600'
                          }`}>
                          {member.photo ? (
                            <img src={member.photo} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-lg">
                              {member.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-200 truncate">
                            {member.full_name || member.email}
                          </p>
                          {isMemberCreator && (
                            <Crown className="w-3 h-3 text-amber-500" title="Group Creator" />
                          )}
                          {isCurrentUser && (
                            <span className="text-xs px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 rounded">You</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {member.designation && (
                            <span className="text-xs text-gray-400 truncate">{member.designation}</span>
                          )}
                          {isOnline && (
                            <span className="text-xs text-emerald-400">Online</span>
                          )}
                        </div>
                      </div>

                      {isCreator && !isMemberCreator && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.employee_id || member.id, member.full_name)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 rounded transition"
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition">
            <Phone className="w-4 h-4" />
            Start Voice Call
          </button>
        </div>
      </div>
    );
  };

  const renderPinnedModal = () => {
    if (!showPinned) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-800 shadow-2xl">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-100">Pinned Messages</h3>
                <p className="text-gray-400 mt-1">{pinnedMessages.length} messages pinned in {group.name}</p>
              </div>
              <button onClick={() => setShowPinned(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-12">
                <Pin className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No pinned messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pinnedMessages.map(msg => (
                  <div
                    key={msg.id}
                    className="p-4 bg-gray-800/30 rounded-xl border border-gray-700 hover:border-gray-600 transition cursor-pointer"
                    onClick={() => {
                      setShowPinned(false);
                      const element = document.getElementById(`message-${msg.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                        element.classList.add('bg-amber-900/20');
                        setTimeout(() => element.classList.remove('bg-amber-900/20'), 2000);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {msg.sender?.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{msg.sender?.full_name}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(msg.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                    {msg.file_url && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <File className="w-3 h-3" />
                          Attachment
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinMessage(msg.id);
                        }}
                        className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                      >
                        <Pin className="w-3 h-3" />
                        Unpin
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(msg.content || '');
                        }}
                        className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-900/30 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-100">Delete Group</h3>
                <p className="text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-bold text-cyan-400">{group.name}</span>?
              All messages and group data will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If no group selected
  if (!group) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950 p-8">
        <div className="max-w-md text-center">
          <Users className="w-32 h-32 text-cyan-900/20 mx-auto mb-8" />
          <h3 className="text-2xl font-bold text-gray-300 mb-4">
            Select a Conversation
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            Choose a chat from the sidebar to start messaging with your team.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 relative">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg lg:hidden transition">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-900/30 to-blue-900/30">
            {React.createElement(getGroupIcon(), { className: "w-5 h-5 text-cyan-400" })}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-gray-100">{group.name}</h2>
              {group.group_type === 'project' && (
                <span className="px-2 py-0.5 text-xs bg-emerald-900/30 text-emerald-400 rounded-full">Project</span>
              )}
              {isCreator && (
                <span className="px-2 py-0.5 text-xs bg-amber-900/30 text-amber-400 rounded-full">Creator</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Users className="w-3 h-3" />
                <span>{group.member_count || groupMembers.length || 0} members</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-emerald-400">
                <div className="flex -space-x-1">
                  {(onlineUsers || []).slice(0, 3).map((userId, idx) => (
                    <div key={idx} className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-gray-900" title="Online" />
                  ))}
                </div>
                <span>{(onlineUsers || []).length} online</span>
              </div>
              {typing && (
                <div className="flex items-center gap-1 text-sm text-cyan-400 animate-pulse">
                  <Clock className="w-3 h-3" />
                  <span>typing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-lg transition ${showMembers ? 'bg-gray-800' : 'hover:bg-gray-800'}`} title="Group info">
            <Info className="w-5 h-5 text-gray-400" />
          </button>
          <button onClick={() => setShowPinned(true)} className="p-2 hover:bg-gray-800 rounded-lg transition relative" title="Pinned messages">
            <Pin className="w-5 h-5 text-gray-400" />
            {pinnedMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                {pinnedMessages.length}
              </span>
            )}
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition">
            <Bell className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {showMembers && renderMembersSidebar()}
      {renderPinnedModal()}
      {renderDeleteConfirmModal()}

      {/* Modals for group management */}
      {showEditModal && isCreator && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUpdateGroup}
          currentUser={currentUser}
        />
      )}

      {showAddMemberModal && isCreator && (
        <AddMemberModal
          group={group}
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleAddMember}
          onRemove={handleRemoveMember}
          existingMembers={groupMembers}
          currentUser={currentUser}
        />
      )}

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 relative">
        {/* Loading indicator - only shown when no cached data */}
        {loading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-300 font-medium mb-2">Failed to load messages</p>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">{error}</p>
              <button onClick={() => loadMessages(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium">
                Retry
              </button>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-md text-center">
              <MessageSquare className="w-24 h-24 text-cyan-900/30 mx-auto mb-6" />
              {searchQuery ? (
                <>
                  <h3 className="text-2xl font-bold text-gray-300 mb-4">No results found</h3>
                  <p className="text-gray-400 text-lg mb-8">No messages match "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="text-cyan-400 hover:text-cyan-300">Clear search</button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-gray-300 mb-4">No messages yet</h3>
                  <p className="text-gray-400 text-lg mb-8">Start the conversation! Send your first message to {group.name}.</p>
                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                    <h4 className="font-medium text-gray-300 mb-3">Quick tips:</h4>
                    <ul className="text-gray-400 text-sm space-y-2 text-left">
                      <li className="flex items-center gap-2"><AtSign className="w-4 h-4" /><span>Use @mentions to notify specific members</span></li>
                      <li className="flex items-center gap-2"><Paperclip className="w-4 h-4" /><span>Upload files by clicking the paperclip icon</span></li>
                      <li className="flex items-center gap-2"><Pin className="w-4 h-4" /><span>Pin important messages for quick access</span></li>
                      <li className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>Your messages are end-to-end encrypted</span></li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {searchQuery && (
              <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Found {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">Search: "{searchQuery}"</p>
                  </div>
                  <button onClick={() => setSearchQuery('')} className="text-cyan-400 hover:text-cyan-300 text-sm">Clear search</button>
                </div>
              </div>
            )}

            <div className="text-center my-8">
              <span className="px-4 py-1 bg-gray-800 text-gray-400 text-sm rounded-full">Today</span>
            </div>

            {filteredMessages.map(renderMessage)}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        {renderFilePreview()}

        <div className="flex gap-3">
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx" />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-gray-800 rounded-xl transition" title="Attach file">
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>

          <button className="p-3 hover:bg-gray-800 rounded-xl transition" title="Add emoji">
            <Smile className="w-5 h-5 text-gray-400" />
          </button>

          <button className="p-3 hover:bg-gray-800 rounded-xl transition" title="Mention someone">
            <AtSign className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${group.name}...`}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-200 placeholder-gray-500"
              rows="1"
              disabled={sending}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-500">Shift+Enter for new line</div>
          </div>

          <button
            onClick={sendMessage}
            disabled={sending || (!input.trim() && !file)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/20 disabled:shadow-none disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;