import React, { useEffect, useState } from 'react';
import { fetchOrgTree } from '../api/hrApi';

// Static sample data for demonstration
const staticOrgData = {
  organization: "TechCorp Inc.",
  tree: [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      role: "admin",
      position_title: "CEO",
      can_manage_people: true,
      children: [
        {
          id: "2",
          name: "Mike Chen",
          email: "mike.chen@techcorp.com",
          role: "hr_manager",
          position_title: "HR Director",
          can_manage_people: true,
          children: [
            {
              id: "3",
              name: "Emily Davis",
              email: "emily.davis@techcorp.com",
              role: "manager",
              position_title: "HR Manager",
              can_manage_people: true,
              children: [
                {
                  id: "4",
                  name: "Alex Rodriguez",
                  email: "alex.rodriguez@techcorp.com",
                  role: "employee",
                  position_title: "HR Specialist",
                  can_manage_people: false,
                  children: []
                },
                {
                  id: "5",
                  name: "Priya Patel",
                  email: "priya.patel@techcorp.com",
                  role: "employee",
                  position_title: "Recruiter",
                  can_manage_people: false,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: "6",
          name: "David Kim",
          email: "david.kim@techcorp.com",
          role: "manager",
          position_title: "CTO",
          can_manage_people: true,
          children: [
            {
              id: "7",
              name: "Lisa Wang",
              email: "lisa.wang@techcorp.com",
              role: "team_lead",
              position_title: "Lead Developer",
              can_manage_people: true,
              children: [
                {
                  id: "8",
                  name: "James Wilson",
                  email: "james.wilson@techcorp.com",
                  role: "employee",
                  position_title: "Senior Developer",
                  can_manage_people: false,
                  children: []
                },
                {
                  id: "9",
                  name: "Maria Garcia",
                  email: "maria.garcia@techcorp.com",
                  role: "employee",
                  position_title: "Frontend Developer",
                  can_manage_people: false,
                  children: []
                }
              ]
            },
            {
              id: "10",
              name: "Tom Baker",
              email: "tom.baker@techcorp.com",
              role: "team_lead",
              position_title: "DevOps Lead",
              can_manage_people: true,
              children: [
                {
                  id: "11",
                  name: "Sarah Miller",
                  email: "sarah.miller@techcorp.com",
                  role: "employee",
                  position_title: "DevOps Engineer",
                  can_manage_people: false,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: "12",
          name: "Robert Brown",
          email: "robert.brown@techcorp.com",
          role: "manager",
          position_title: "Sales Director",
          can_manage_people: true,
          children: [
            {
              id: "13",
              name: "Jennifer Lee",
              email: "jennifer.lee@techcorp.com",
              role: "employee",
              position_title: "Sales Manager",
              can_manage_people: false,
              children: []
            }
          ]
        }
      ]
    }
  ],
  multiple_roots: false
};

// TreeNode Component with enhanced UI
function TreeNode({ node, isRoot = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-700 border-red-300',
      hr_manager: 'bg-orange-100 text-orange-700 border-orange-300',
      manager: 'bg-blue-100 text-blue-700 border-blue-300',
      team_lead: 'bg-green-100 text-green-700 border-green-300',
      employee: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return colors[role] || 'bg-purple-100 text-purple-700 border-purple-300';
  };

  const getRoleBadge = (role) => {
    const names = { admin: 'Admin', hr_manager: 'HR Mgr', manager: 'Mgr', team_lead: 'Lead', employee: 'Emp' };
    return names[role] || role;
  };

  return (
    <div className={`flex flex-col items-center ${!isRoot && 'mt-6'}`}>
      {/* Node Card - Super Compact */}
      <div className="relative">
        {/* Tiny Expand Button */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow border border-gray-300 flex items-center justify-center hover:bg-gray-100 text-xs z-10"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 w-48 text-center hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center">
            {/* Smaller Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2">
              {node.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>

            {/* Name & Title */}
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{node.name}</h3>
            <p className="text-xs text-gray-600 leading-tight">{node.position_title}</p>

            {/* Role Badges - Tiny */}
            <div className="flex gap-1 mt-2 flex-wrap justify-center">
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getRoleColor(node.role)}`}>
                {getRoleBadge(node.role)}
              </span>
              {node.can_manage_people && (
                <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Mgr</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Children - Compact Layout */}
      {hasChildren && isExpanded && (
        <>
          {/* Short Vertical Line */}
          <div className="w-0.5 bg-gray-300 h-8"></div>

          {/* Horizontal Connector + Children */}
          <div className="relative w-full flex justify-center">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-300"></div>
            
            <div className="flex flex-wrap gap-6 justify-center relative z-10 px-4">
              {node.children.map((child, i) => (
                <div key={child.id || i} className="flex flex-col items-center">
                  <div className="w-0.5 bg-gray-300 h-6"></div>
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Search and Filter Component
function OrgTreeFilters({ onSearch, onFilterRole }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'hr_manager', label: 'HR Manager' },
    { value: 'manager', label: 'Manager' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'employee', label: 'Employee' }
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Employees
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="sm:w-48">
          <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            id="role-filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            onChange={(e) => onFilterRole(e.target.value)}
            defaultValue=""
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Main OrgTree Component
export default function OrgTreePage() {
  const [tree, setTree] = useState([]);
  const [filteredTree, setFilteredTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organization, setOrganization] = useState('');
  const [useStaticData, setUseStaticData] = useState(false);

  // Fetch organization tree
  useEffect(() => {
    const loadOrgTree = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchOrgTree();
        
        // Check if API returned valid data
        if (response.data && (response.data.tree || response.data.length > 0)) {
          setTree(response.data.tree || response.data);
          setFilteredTree(response.data.tree || response.data);
          setOrganization(response.data.organization || 'Organization');
          setUseStaticData(false);
        } else {
          // If API returns empty data, use static data
          console.log('API returned empty data, using static data instead');
          setTree(staticOrgData.tree);
          setFilteredTree(staticOrgData.tree);
          setOrganization(staticOrgData.organization);
          setUseStaticData(true);
        }
      } catch (err) {
        console.error('Error fetching organization tree:', err);
        setError('Failed to load organization tree from API');
        
        // Fallback to static data on error
        console.log('Falling back to static data due to API error');
        setTree(staticOrgData.tree);
        setFilteredTree(staticOrgData.tree);
        setOrganization(staticOrgData.organization);
        setUseStaticData(true);
      } finally {
        setLoading(false);
      }
    };

    loadOrgTree();
  }, []);

  // Filter tree based on search and role
  const filterTree = (searchTerm = '', roleFilter = '') => {
    const filterNode = (node) => {
      const matchesSearch = !searchTerm || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = !roleFilter || node.role === roleFilter;
      
      // Filter children recursively
      const filteredChildren = node.children 
        ? node.children.map(filterNode).filter(child => child !== null)
        : [];
      
      // Keep node if it matches or has matching children
      if (matchesSearch && matchesRole) {
        return { ...node, children: filteredChildren };
      }
      
      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      
      return null;
    };

    const filtered = tree.map(filterNode).filter(node => node !== null);
    setFilteredTree(filtered);
  };

  const handleSearch = (searchTerm) => {
    filterTree(searchTerm);
  };

  const handleFilterRole = (role) => {
    filterTree('', role);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading organization structure...</span>
        </div>
      </div>
    );
  }

  if (error && !useStaticData) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Tree</h2>
            <p className="text-gray-600">
              {organization} - {filteredTree.length} {filteredTree.length === 1 ? 'root member' : 'root members'}
            </p>
          </div>
          {useStaticData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-yellow-700">Showing demo data</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <OrgTreeFilters 
        onSearch={handleSearch}
        onFilterRole={handleFilterRole}
      />

      {/* Organization Tree */}
      {filteredTree.length > 0 ? (
  <div className="bg-gray-50 rounded-xl shadow-inner p-6 overflow-x-auto">
    <div className="flex justify-center min-w-max">
      {filteredTree.length === 1 ? (
        <TreeNode node={filteredTree[0]} isRoot={true} />
      ) : (
        <div className="flex gap-12">
          {filteredTree.map((node, i) => (
            <TreeNode key={node.id || i} node={node} isRoot={true} />
          ))}
        </div>
      )}
    </div>
  </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}

      {/* Demo Information */}
      {useStaticData && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800">Demo Mode</h4>
              <p className="text-sm text-blue-700 mt-1">
                This is showing sample organization data. When your backend API is properly configured, 
                real organizational data will be displayed here automatically.
              </p>
              <ul className="text-xs text-blue-600 mt-2 list-disc list-inside">
                <li>Try using the search to filter employees</li>
                <li>Use the role filter to view specific positions</li>
                <li>Click the arrows to expand/collapse departments</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}