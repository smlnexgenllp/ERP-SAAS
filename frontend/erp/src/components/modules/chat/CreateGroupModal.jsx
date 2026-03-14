// components/modules/chat/CreateGroupModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  X, Users, Briefcase, Building, Check,
  Search, AlertCircle, Loader2, Filter, ChevronDown
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
  
  // State for user type filter
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all', 'employee', 'org_user', 'sub_admin'

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

  // FIXED: Added null checks and safe access
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError('');

      // Fetch all three types of users in parallel
      const [employeesRes, orgUsersRes, subAdminsRes] = await Promise.all([
        api.get('/hr/employees/').catch(err => {
          console.error('Employees API failed:', err);
          return { data: [] };
        }),
        api.get('/hr/organizations/users/').catch(err => {
          console.error('Org Users API failed:', err);
          return { data: [] };
        }),
        api.get('/hr/organizations/sub-org-admins/').catch(err => {
          console.error('Sub Admins API failed:', err);
          return { data: [] };
        })
      ]);

      console.log('Employees response:', employeesRes.data);
      console.log('Org Users response:', orgUsersRes.data);
      console.log('Sub Admins response:', subAdminsRes.data);

      // Process employees with null checks
      let employeesList = [];
      if (employeesRes.data && Array.isArray(employeesRes.data)) {
        employeesList = employeesRes.data;
      } else if (employeesRes.data && Array.isArray(employeesRes.data.results)) {
        employeesList = employeesRes.data.results;
      }

      const employees = employeesList
        .filter(item => item && (item.user || item)) // Filter out null items
        .map(item => {
          const userPart = item.user || item;
          // Skip if userPart is null or missing id
          if (!userPart || !userPart.id) return null;
          
          return {
            id: userPart.id,
            first_name: userPart.first_name || '',
            last_name: userPart.last_name || '',
            email: userPart.email || '',
            full_name: item.full_name ||
              `${item.first_name || userPart.first_name || ''} ${item.last_name || userPart.last_name || ''}`.trim() ||
              userPart.email ||
              'Unknown',
            photo: item.photo?.url || item.photo || userPart.photo?.url || null,
            department: item.department?.name || null,
            designation: item.designation?.title || null,
            user_type: 'employee',
            user_type_label: 'Employee',
            organization: item.organization?.name || null,
            selected: (item.id || userPart.id) === currentUser?.id
          };
        })
        .filter(user => user !== null); // Remove null entries

      // Process organization users with null checks
      let orgUsersList = [];
      if (orgUsersRes.data && Array.isArray(orgUsersRes.data)) {
        orgUsersList = orgUsersRes.data;
      } else if (orgUsersRes.data && Array.isArray(orgUsersRes.data.results)) {
        orgUsersList = orgUsersRes.data.results;
      }

      const orgUsers = orgUsersList
        .filter(item => item && (item.user || item))
        .map(item => {
          const userData = item.user || item;
          if (!userData || !userData.id) return null;
          
          return {
            id: userData.id,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            full_name: userData.full_name || 
              `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
              userData.email ||
              'Unknown',
            photo: userData.photo?.url || userData.photo || null,
            department: item.department?.name || userData.department?.name || null,
            designation: item.designation?.title || userData.designation?.title || null,
            user_type: 'org_user',
            user_type_label: 'Organization User',
            role: item.role || userData.role,
            organization: item.organization?.name || userData.organization?.name || null,
            selected: userData.id === currentUser?.id
          };
        })
        .filter(user => user !== null);

      // Process sub-organization admins with null checks
      let subAdminsList = [];
      if (subAdminsRes.data && Array.isArray(subAdminsRes.data)) {
        subAdminsList = subAdminsRes.data;
      } else if (subAdminsRes.data && Array.isArray(subAdminsRes.data.results)) {
        subAdminsList = subAdminsRes.data.results;
      }

      const subAdmins = subAdminsList
        .filter(item => item && (item.user || item))
        .map(item => {
          const userData = item.user || item;
          if (!userData || !userData.id) return null;
          
          return {
            id: userData.id,
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            full_name: userData.full_name || 
              `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
              userData.email ||
              'Unknown',
            photo: userData.photo?.url || userData.photo || null,
            department: item.department?.name || userData.department?.name || null,
            designation: item.designation?.title || userData.designation?.title || null,
            user_type: 'sub_admin',
            user_type_label: 'Sub-Organization Admin',
            sub_organization: item.sub_organization?.name || item.organization?.name || null,
            role: 'Admin',
            selected: userData.id === currentUser?.id
          };
        })
        .filter(user => user !== null);

      // Combine all users
      const allUsers = [...employees, ...orgUsers, ...subAdmins];
      
      // Remove duplicates by ID (keep the first occurrence)
      const uniqueUsers = Array.from(
        new Map(allUsers.map(user => [user.id, user])).values()
      );

      console.log('Combined unique users:', uniqueUsers);

      // Auto-add current user if found
      if (currentUser && currentUser.id) {
        const currentUserObj = uniqueUsers.find(u => u.id === currentUser.id);
        if (currentUserObj) {
          setMembers([currentUserObj]);
        }
      }

      setAvailableUsers(uniqueUsers);

      if (uniqueUsers.length === 0) {
        setError('No users found in your organization.');
      }

    } catch (err) {
      console.error('Failed to load users:', err);

      let errorMsg = 'Failed to load users. Please try again.';
      if (err.response) {
        if (err.response.status === 403) errorMsg = 'Permission denied – you may not have access to this list.';
        if (err.response.status === 401) errorMsg = 'Please log in again.';
        if (err.response.data?.detail) errorMsg = err.response.data.detail;
        if (err.response.data?.error) errorMsg = err.response.data.error;
      }

      setError(errorMsg);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (user) => {
    // Prevent deselecting yourself
    if (!user || !user.id || user.id === currentUser?.id) return;

    setAvailableUsers(prev =>
      prev.map(u => u.id === user.id ? { ...u, selected: !u.selected } : u)
    );

    setMembers(prev =>
      prev.find(m => m.id === user.id)
        ? prev.filter(m => m.id !== user.id)
        : [...prev, user]
    );
  };

  // Filter users based on search term and user type
  const filteredUsers = availableUsers.filter(user => {
    if (!user) return false;
    
    const term = searchTerm.toLowerCase();
    const fullName = (user.full_name || `${user.first_name} ${user.last_name}`).toLowerCase();
    const email = user.email?.toLowerCase() || '';
    
    // Search filter
    const matchesSearch = fullName.includes(term) || email.includes(term);
    
    // User type filter
    const matchesUserType = userTypeFilter === 'all' || user.user_type === userTypeFilter;
    
    return matchesSearch && matchesUserType;
  });

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

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
        response = await api.post('/hr/chat/custom-groups/create/', {
          name: name.trim(),
          description: description.trim() || undefined,
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
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to create group. Please try again.'
      );
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
            className={`p-4 rounded-xl border-2 transition-all relative ${groupType === 'custom'
              ? 'border-purple-500 bg-purple-900/20'
              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
              }`}
          >
            <Users className={`w-6 h-6 mb-3 ${groupType === 'custom' ? 'text-purple-400' : 'text-gray-400'
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
            className={`p-4 rounded-xl border-2 transition-all relative ${groupType === 'project'
              ? 'border-emerald-500 bg-emerald-900/20'
              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
              }`}
          >
            <Briefcase className={`w-6 h-6 mb-3 ${groupType === 'project' ? 'text-emerald-400' : 'text-gray-400'
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
            className={`p-4 rounded-xl border-2 transition-all relative ${groupType === 'organization'
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
              }`}
            disabled
            title="Organization chat is automatically created"
          >
            <Building className={`w-6 h-6 mb-3 ${groupType === 'organization' ? 'text-blue-400' : 'text-gray-400 opacity-50'
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
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
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
          {/* Group Name Input */}
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

          {/* Description Input */}
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

          {/* Member Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">
                Select Members *
              </label>
              <span className="text-xs text-gray-500">
                {members.length} selected
              </span>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3 mb-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* User Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="employee">Employees Only</option>
                  <option value="org_user">Organization Users</option>
                  <option value="sub_admin">Sub-Organization Admins</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : (
              <>
                {/* Users List */}
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredUsers.map(user => (
                    <button
                      key={`${user.user_type}-${user.id}`}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${user.selected
                        ? 'bg-purple-900/30 border border-purple-700/50'
                        : 'hover:bg-gray-800/50'
                        } ${user.id === currentUser?.id ? 'opacity-75 cursor-default' : ''}`}
                      disabled={user.id === currentUser?.id}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.selected ? 'bg-purple-600' : 
                        user.user_type === 'sub_admin' ? 'bg-amber-600' :
                        user.user_type === 'org_user' ? 'bg-blue-600' : 'bg-gray-700'
                      }`}>
                        <span className="text-white text-sm font-bold">
                          {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-200">
                            {user.full_name || `${user.first_name} ${user.last_name}`}
                            {user.id === currentUser?.id && ' (You)'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.user_type === 'sub_admin' ? 'bg-amber-900/50 text-amber-300' :
                            user.user_type === 'org_user' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {user.user_type_label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        {(user.department || user.designation) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {user.department && user.department}
                            {user.department && user.designation && ' • '}
                            {user.designation && user.designation}
                          </p>
                        )}
                        {(user.organization || user.sub_organization) && (
                          <p className="text-xs text-gray-500">
                            {user.sub_organization || user.organization}
                          </p>
                        )}
                      </div>
                      {user.selected && user.id !== currentUser?.id && (
                        <Check className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No users found matching your criteria
                    </div>
                  )}
                </div>

                {/* Selected Members Summary */}
                {members.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Selected Members ({members.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {members.map(member => (
                        <div
                          key={member.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                            member.user_type === 'sub_admin' ? 'bg-amber-900/30 border border-amber-700/50' :
                            member.user_type === 'org_user' ? 'bg-blue-900/30 border border-blue-700/50' :
                            'bg-gray-700/50'
                          }`}
                        >
                          <span className="text-sm text-gray-200">
                            {member.full_name || member.email}
                            {member.id === currentUser?.id && ' (You)'}
                          </span>
                          {member.id !== currentUser?.id && (
                            <button
                              onClick={() => handleUserSelect(member)}
                              className="hover:text-red-400 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition ${selectedProject?.id === project.id
                    ? 'border-emerald-500 bg-emerald-900/20'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                >
                  <Briefcase className={`w-5 h-5 ${selectedProject?.id === project.id ? 'text-emerald-400' : 'text-gray-400'
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

    return null;
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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-cyan-600' : 'bg-gray-800'
              }`}>
              <span className="text-white font-bold">1</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-800'
              }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-800'
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