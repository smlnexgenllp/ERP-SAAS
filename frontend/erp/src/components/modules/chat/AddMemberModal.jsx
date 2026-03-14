import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Search, Users, Building2, Shield } from 'lucide-react';
import api from '../../../services/api';

export default function AddMemberModal({ group, onClose, onAdd, onRemove, existingMembers, currentUser }) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [userType, setUserType] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch employees and organization users
        const [employeesRes, orgUsersRes] = await Promise.all([
          api.get('/hr/employees/'),
          api.get('/hr/organizations/users/').catch((err) => {
            console.log('Organization users fetch error:', err);
            return { data: [] };
          })
        ]);

        console.log('Employees data:', employeesRes.data);
        console.log('Organization users data:', orgUsersRes.data);

        // Process employees
        const employees = employeesRes.data.map(emp => ({
          ...emp,
          userType: 'employee',
          userTypeLabel: 'Employee',
          id: emp.id,
          userId: emp.user?.id,
          employeeId: emp.id,
          name: emp.full_name || 'Unknown',
          email: emp.email || 'No email',
          department: emp.department?.name || 'No Department',
          avatar: emp.photo || emp.avatar,
          designation: emp.designation?.title
        }));

        // Create a map of users who already have employee records
        const employeeUserIds = new Set(
          employeesRes.data
            .map(emp => emp.user?.id)
            .filter(id => id != null)
        );

        // Process organization users - FIXED MAPPING
        const orgUsers = orgUsersRes.data.map(orgUser => {
          // Get the full name from the response
          const fullName = orgUser.full_name || 
                          `${orgUser.first_name || ''} ${orgUser.last_name || ''}`.trim() || 
                          orgUser.email || 
                          'Unknown';
          
          const userEmail = orgUser.email || 'No email';
          
          // Check if this user already has an employee record
          const hasEmployeeRecord = employeeUserIds.has(orgUser.id);
          
          // Get department name
          const departmentName = orgUser.department?.name || 
                                orgUser.department || 
                                'Organization';
          
          return {
            id: orgUser.id, // This is the user ID
            userId: orgUser.id,
            orgUserId: orgUser.id, // Store user ID as orgUserId for consistency
            employeeId: null, // No employee ID unless they have an employee record
            userType: 'org_user',
            userTypeLabel: 'Organization User',
            name: fullName,
            email: userEmail,
            role: orgUser.role || 'No Role',
            department: departmentName,
            designation: orgUser.designation?.title,
            avatar: orgUser.photo,
            organization: orgUser.organization?.name,
            hasEmployeeRecord,
            first_name: orgUser.first_name,
            last_name: orgUser.last_name
          };
        });

        // Combine all users
        setAllUsers([...employees, ...orgUsers]);
        
        console.log('Processed employees:', employees);
        console.log('Processed organization users:', orgUsers);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []);

  // Get IDs of existing members
  const existingMemberIds = existingMembers.map(m => m.employee_id || m.id || m.userId).filter(Boolean);
  
  // Filter users based on search and user type
  const filteredUsers = allUsers.filter(user => {
    if (userType !== 'all' && user.userType !== userType) {
      return false;
    }
    
    // Filter out existing members
    if (existingMemberIds.includes(user.id) || 
        existingMemberIds.includes(user.userId) ||
        (user.employeeId && existingMemberIds.includes(user.employeeId))) {
      return false;
    }
    
    const searchLower = search.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(searchLower)) ||
      (user.email?.toLowerCase().includes(searchLower)) ||
      (user.department?.toLowerCase().includes(searchLower)) ||
      (user.role?.toLowerCase().includes(searchLower)) ||
      (user.designation?.toLowerCase().includes(searchLower))
    );
  });

  const currentMembersList = existingMembers.filter(member => {
    const memberName = member.full_name?.toLowerCase() || '';
    const memberEmail = member.email?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return memberName.includes(searchLower) || memberEmail.includes(searchLower);
  });

  const handleAdd = async (user) => {
    setAdding(true);
    setError('');
    
    try {
      let payload = {};

      if (user.userType === 'employee') {
        // For employees, send employee_id
        payload = { employee_id: user.employeeId || user.id };
      } else if (user.userType === 'org_user') {
        // For organization users, send user_id
        payload = { user_id: user.id };
      }
      
      console.log('Adding member with payload:', payload);
      await onAdd(payload);
      onClose(); // Close modal after successful addition
    } catch (error) {
      console.error('Failed to add member:', error);
      setError(error.response?.data?.error || 'Failed to add member. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (member) => {
    if (member.id === group.created_by?.id) {
      alert('Cannot remove the group creator');
      return;
    }
    
    setRemoving(true);
    setError('');
    
    try {
      // For removal, we need to determine the correct ID type
      let payload = {};
      
      if (member.employee_id) {
        payload = { employee_id: member.employee_id };
      } else {
        // Try to find if this member is in our users list to determine type
        const foundUser = allUsers.find(u => 
          u.userId === member.id || u.id === member.id
        );
        
        if (foundUser?.userType === 'org_user') {
          payload = { user_id: foundUser.id || member.id };
        } else {
          payload = { user_id: member.id };
        }
      }
      
      console.log('Removing member with payload:', payload);
      await onRemove(payload, member.full_name);
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError(error.response?.data?.error || 'Failed to remove member. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const isCreator = currentUser?.id === group.created_by?.id;

  const getUserTypeBadge = (userType) => {
    switch(userType) {
      case 'employee':
        return { bg: 'bg-blue-900/30', text: 'text-blue-400', icon: Users };
      case 'org_user':
        return { bg: 'bg-purple-900/30', text: 'text-purple-400', icon: Building2 };
      default:
        return { bg: 'bg-gray-900/30', text: 'text-gray-400', icon: Users };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-100">Manage Members</h3>
              <p className="text-gray-400 mt-1">
                {group.name} • {existingMembers.length} members
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'add'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Add Members ({filteredUsers.length})
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'remove'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Current Members ({existingMembers.length})
            </button>
          </div>

          {activeTab === 'add' && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setUserType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  userType === 'all'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setUserType('employee')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  userType === 'employee'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Employees
              </button>
              <button
                onClick={() => setUserType('org_user')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  userType === 'org_user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-300'
                }`}
              >
                Organization Users
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'add' ? 'users to add' : 'current members'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading users...</p>
            </div>
          ) : activeTab === 'add' ? (
            filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No users available to add</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => {
                  const badge = getUserTypeBadge(user.userType);
                  const Icon = badge.icon;
                  
                  return (
                    <div
                      key={`${user.userType}-${user.id}`}
                      className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-200">{user.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} flex items-center gap-1`}>
                              <Icon className="w-3 h-3" />
                              {user.userTypeLabel}
                            </span>
                            {user.role && (
                              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                                {user.role}
                              </span>
                            )}
                            {user.designation && user.userType === 'employee' && (
                              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                                {user.designation}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{user.email}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400">{user.department}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdd(user)}
                        disabled={adding}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        {adding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Remove members tab
            currentMembersList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No members found</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentMembersList.map(member => {
                  const isCreator_ = member.id === group.created_by?.id;
                  const isSelf = member.id === currentUser?.id;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCreator_ 
                            ? 'bg-gradient-to-br from-amber-600 to-orange-600' 
                            : 'bg-gradient-to-br from-cyan-600 to-blue-600'
                        }`}>
                          <span className="text-white font-bold">
                            {member.full_name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-200">{member.full_name}</p>
                            {isCreator_ && (
                              <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded-full">
                                Creator
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-xs px-2 py-0.5 bg-cyan-900/30 text-cyan-400 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{member.email}</span>
                            {member.department && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-400">{member.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isCreator && !isCreator_ && !isSelf && (
                        <button
                          onClick={() => handleRemove(member)}
                          disabled={removing}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          {removing ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                      
                      {isCreator_ && (
                        <span className="text-sm text-gray-500 px-2">Creator</span>
                      )}
                      
                      {isSelf && !isCreator_ && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to leave this group?')) {
                              handleRemove(member);
                            }
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          Leave
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <span>Total members: {existingMembers.length}</span>
            {activeTab === 'add' && <span>Available: {filteredUsers.length}</span>}
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}