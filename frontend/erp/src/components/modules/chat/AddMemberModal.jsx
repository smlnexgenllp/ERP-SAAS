import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Search, Users } from 'lucide-react';
import api from '../../../services/api';

export default function AddMemberModal({ group, onClose, onAdd, onRemove, existingMembers, currentUser }) {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'remove'

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        // Fetch all employees from the organization
        const res = await api.get('/hr/employees/');
        setEmployees(res.data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Get IDs of existing members
  const existingMemberIds = existingMembers.map(m => m.employee_id || m.id).filter(Boolean);
  
  // Filter for non-members (available to add)
  const nonMembers = employees.filter(emp =>
    !existingMemberIds.includes(emp.id) &&
    (emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
     emp.email?.toLowerCase().includes(search.toLowerCase()) ||
     emp.department?.name?.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter for current members (available to remove)
  const currentMembersList = existingMembers.filter(member => {
    const memberName = member.full_name?.toLowerCase() || '';
    const memberEmail = member.email?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    
    return memberName.includes(searchLower) || memberEmail.includes(searchLower);
  });

  const handleAdd = async (employee) => {
    setAdding(true);
    await onAdd(employee.id);
    setAdding(false);
  };

  const handleRemove = async (member) => {
    // Don't allow removing the creator
    if (member.id === group.created_by?.id) {
      alert('Cannot remove the group creator');
      return;
    }
    
    setRemoving(true);
    await onRemove(member.employee_id || member.id, member.full_name);
    setRemoving(false);
  };

  // Check if current user is creator (only creator can remove members)
  const isCreator = currentUser?.id === group.created_by?.id;

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

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'add'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300'
              }`}
            >
              Add Members ({nonMembers.length})
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'add' ? 'employees to add' : 'current members'}...`}
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
              <p className="text-gray-400 mt-4">Loading employees...</p>
            </div>
          ) : activeTab === 'add' ? (
            // Add Members Tab
            nonMembers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400">No employees available to add</p>
                {search && (
                  <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {nonMembers.map(emp => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {emp.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{emp.full_name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{emp.email}</span>
                          {emp.department && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-400">{emp.department.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAdd(emp)}
                      disabled={adding}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Remove Members Tab
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
                          title="Remove from group"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove
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
            {activeTab === 'add' && <span>Available: {nonMembers.length}</span>}
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