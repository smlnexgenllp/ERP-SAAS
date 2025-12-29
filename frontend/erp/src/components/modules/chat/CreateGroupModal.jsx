// components/modules/chat/CreateGroupModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  X, Users, Briefcase, Building, Check,
  Search, UserPlus, AlertCircle, Loader2
} from 'lucide-react';

function CreateGroupModal({ onClose, onSuccess, currentUser }) {
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState('custom');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load projects and users on mount
  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get('/hr/projects/');
      setProjects(res.data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get('/hr/employees/active/'); // Adjust endpoint as needed
      const users = (res.data || []).map(user => ({
        ...user,
        selected: user.id === currentUser.id // Auto-select current user
      }));
      
      setAvailableUsers(users);
      // Auto-add current user to members
      const currentUserObj = users.find(u => u.id === currentUser.id);
      if (currentUserObj) {
        setMembers([currentUserObj]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (user) => {
    setAvailableUsers(prev => 
      prev.map(u => u.id === user.id ? { ...u, selected: !u.selected } : u)
    );
    
    if (members.find(m => m.id === user.id)) {
      setMembers(prev => prev.filter(m => m.id !== user.id));
    } else {
      setMembers(prev => [...prev, user]);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    // Validation
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    
    if (groupType === 'custom' && members.length < 2) {
      setError('Please select at least 2 members (including yourself)');
      return;
    }
    
    if (groupType === 'project' && !selectedProject) {
      setError('Please select a project');
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      
      if (groupType === 'custom') {
        response = await api.post('/hr/chat/groups/create/', {
          name: name.trim(),
          description: description.trim(),
          members: members.map(m => m.id)
        });
      } else if (groupType === 'project') {
        response = await api.post('/hr/chat/groups/create-project-chat/', {
          project_id: selectedProject.id
        });
      }
      
      setSuccess('Group created successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Failed to create group:', err);
      setError(err.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Select Group Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setGroupType('custom')}
            className={`p-4 rounded-xl border-2 transition-all ${
              groupType === 'custom'
                ? 'border-purple-500 bg-purple-900/20'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
            }`}
          >
            <Users className={`w-6 h-6 mb-3 ${
              groupType === 'custom' ? 'text-purple-400' : 'text-gray-400'
            }`} />
            <h4 className="font-medium text-gray-200">Custom Group</h4>
            <p className="text-sm text-gray-400 mt-1">
              Create a team with selected members
            </p>
            {groupType === 'custom' && (
              <Check className="w-5 h-5 text-purple-400 absolute top-3 right-3" />
            )}
          </button>
          
          <button
            onClick={() => setGroupType('project')}
            className={`p-4 rounded-xl border-2 transition-all ${
              groupType === 'project'
                ? 'border-emerald-500 bg-emerald-900/20'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
            }`}
          >
            <Briefcase className={`w-6 h-6 mb-3 ${
              groupType === 'project' ? 'text-emerald-400' : 'text-gray-400'
            }`} />
            <h4 className="font-medium text-gray-200">Project Chat</h4>
            <p className="text-sm text-gray-400 mt-1">
              Auto-include project team members
            </p>
            {groupType === 'project' && (
              <Check className="w-5 h-5 text-emerald-400 absolute top-3 right-3" />
            )}
          </button>
          
          <button
            onClick={() => setGroupType('organization')}
            className={`p-4 rounded-xl border-2 transition-all ${
              groupType === 'organization'
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
            }`}
            disabled
            title="Organization chat is automatically created"
          >
            <Building className={`w-6 h-6 mb-3 ${
              groupType === 'organization' ? 'text-blue-400' : 'text-gray-400 opacity-50'
            }`} />
            <h4 className="font-medium text-gray-200 opacity-70">Organization</h4>
            <p className="text-sm text-gray-500 mt-1">
              Automatically created
            </p>
          </button>
        </div>
      </div>
      
      <div className="flex justify-between pt-6 border-t border-gray-800">
        <button
          onClick={onClose}
          className="px-6 py-2 text-gray-400 hover:text-gray-300 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep(2)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (groupType === 'custom') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Team, Development Group"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Select Members *
              </label>
              <span className="text-xs text-gray-500">
                {members.length} selected
              </span>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            
            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading team members...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      user.selected
                        ? 'bg-purple-900/30 border border-purple-700/50'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.selected ? 'bg-purple-600' : 'bg-gray-700'
                    }`}>
                      <span className="text-white text-sm font-bold">
                        {user.first_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-200">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {user.selected && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {members.length > 0 && (
              <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Selected Members ({members.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-full"
                    >
                      <span className="text-sm text-gray-200">
                        {member.first_name} {member.last_name}
                      </span>
                      <button
                        onClick={() => handleUserSelect(member)}
                        className="hover:text-red-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between pt-6 border-t border-gray-800">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-400 hover:text-gray-300 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || members.length < 2}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Group
            </button>
          </div>
        </div>
      );
    }
    
    if (groupType === 'project') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Project *
            </label>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition ${
                    selectedProject?.id === project.id
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 ${
                    selectedProject?.id === project.id ? 'text-emerald-400' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-200">{project.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {project.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Team: {project.member_count || 0} members</span>
                      <span>Started: {new Date(project.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {selectedProject && (
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Project Details
              </h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p><strong>Name:</strong> {selectedProject.name}</p>
                <p><strong>Team Size:</strong> {selectedProject.member_count || 0} members</p>
                <p><strong>Start Date:</strong> {new Date(selectedProject.start_date).toLocaleDateString()}</p>
                {selectedProject.description && (
                  <p><strong>Description:</strong> {selectedProject.description}</p>
                )}
              </div>
              <p className="text-xs text-emerald-400 mt-4">
                Note: All project members will automatically be added to this chat.
              </p>
            </div>
          )}
          
          <div className="flex justify-between pt-6 border-t border-gray-800">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 text-gray-400 hover:text-gray-300 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedProject}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 text-white px-6 py-2 rounded-lg font-medium transition disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project Chat
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Create New Chat Group</h2>
            <p className="text-gray-400 mt-1">
              {step === 1 ? 'Choose the type of group' : 'Configure your group settings'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-cyan-600' : 'bg-gray-800'
            }`}>
              <span className="text-white font-bold">1</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step >= 2 ? 'bg-cyan-600' : 'bg-gray-800'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-cyan-600' : 'bg-gray-800'
            }`}>
              <span className="text-white font-bold">2</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Select Type</span>
            <span>Configure</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-300">Error</p>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-700/50 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-300">Success!</p>
                <p className="text-emerald-400/80 text-sm mt-1">{success}</p>
              </div>
            </div>
          )}
          
          {step === 1 ? renderStep1() : renderStep2()}
        </div>
      </div>
    </div>
  );
}

export default CreateGroupModal;