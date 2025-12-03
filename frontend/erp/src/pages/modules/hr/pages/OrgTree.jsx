import React, { useEffect, useState, useMemo } from 'react';
import api from '../../../../services/api';

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 hover:bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-600"
        >
          {expanded ? '−' : '+'}
        </button>
      )}

      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-80 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300">
        {node.photo ? (
          <img src={node.photo} alt={node.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg" />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {node.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}

        <h3 className="font-bold text-lg text-gray-900">{node.name || 'No Name'}</h3>
        {node.title && <p className="text-sm text-indigo-600 font-medium mt-1">{node.title}</p>}
        {node.department && <p className="text-xs text-gray-600 mt-1">{node.department}</p>}
        {node.employee_code && <p className="text-xs text-gray-500 mt-1">ID: {node.employee_code}</p>}
        
        <div className="mt-3 flex justify-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${node.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {node.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {hasChildren && expanded && (
        <>
          <div className="w-px bg-gray-300 h-12 mt-4"></div>
          <div className="relative mt-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
            <div className="flex flex-wrap justify-center gap-12 pt-8">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px bg-gray-300 h-10"></div>
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

export default function OrgTree() {
  const [treeData, setTreeData] = useState([]);
  const [rawEmployees, setRawEmployees] = useState([]); // All employees flat
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterActive, setFilterActive] = useState('all'); // all, yes, no
  const [filterDesignation, setFilterDesignation] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');

  // Fetch all employees once (better for filtering)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to get full tree (hierarchical)
        let response;
        try {
          response = await api.get('/hr/org-tree/');
        } catch (err) {
          response = await api.get('/hr/public-org-tree/');
        }

        const tree = response.data.tree || [];
        setTreeData(tree);

        // Extract flat list for filtering stats
        const flat = [];
        const traverse = (node) => {
          flat.push({
            id: node.id,
            name: node.name,
            title: node.title || '-',
            department: node.department || '-',
            employee_code: node.employee_code || '-',
            is_active: node.is_active ?? true,
          });
          if (node.children) node.children.forEach(traverse);
        };
        tree.forEach(traverse);
        setRawEmployees(flat);

      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute filtered tree
  const filteredTree = useMemo(() => {
    if (!treeData.length) return [];

    const filterNode = (node) => {
      const matchesActive = filterActive === 'all' || 
        (filterActive === 'yes' && node.is_active) || 
        (filterActive === 'no' && !node.is_active);

      const matchesDesig = filterDesignation === 'all' || node.title === filterDesignation;
      const matchesDept = filterDepartment === 'all' || node.department === filterDepartment;

      const matches = matchesActive && matchesDesig && matchesDept;

      if (!matches && (!node.children || node.children.length === 0)) {
        return null; // Remove leaf
      }

      const filteredChildren = node.children 
        ? node.children.map(filterNode).filter(Boolean)
        : [];

      if (!matches && filteredChildren.length === 0) {
        return null; // Remove empty parent
      }

      return { ...node, children: filteredChildren };
    };

    return treeData.map(filterNode).filter(Boolean);
  }, [treeData, filterActive, filterDesignation, filterDepartment]);

  // Counts for filter buttons
  const counts = useMemo(() => {
    const active = rawEmployees.filter(e => e.is_active).length;
    const inactive = rawEmployees.length - active;

    const designations = {};
    const departments = {};
    rawEmployees.forEach(e => {
      designations[e.title] = (designations[e.title] || 0) + 1;
      departments[e.department] = (departments[e.department] || 0) + 1;
    });

    return { total: rawEmployees.length, active, inactive, designations, departments };
  }, [rawEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Organization Structure</h1>
          <p className="text-xl text-gray-600 mt-2">
            Total: <strong>{counts.total}</strong> employees
          </p>
        </div>

        {/* Filter Panel */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Active Status */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Active Status</h3>
              <div className="space-y-2">
                {['all', 'yes', 'no'].map(val => (
                  <button
                    key={val}
                    onClick={() => setFilterActive(val)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      filterActive === val 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {val === 'all' ? 'All' : val === 'yes' ? 'Active' : 'Inactive'}
                    {' '}
                    <span className="float-right font-medium">
                      {val === 'all' ? counts.total : val === 'yes' ? counts.active : counts.inactive}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Designation */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Designation</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterDesignation('all')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${filterDesignation === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  All <span className="float-right">{counts.total}</span>
                </button>
                {Object.entries(counts.designations).map(([desig, count]) => (
                  desig !== '-' && (
                    <button
                      key={desig}
                      onClick={() => setFilterDesignation(desig)}
                      className={`w-full text-left px-4 py-2 rounded-lg ${filterDesignation === desig ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {desig} <span className="float-right">{count}</span>
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Department */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Department</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterDepartment('all')}
                  className={`w-full text-left px-4 py-2 rounded-lg ${filterDepartment === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  All <span className="float-right">{counts.total}</span>
                </button>
                {Object.entries(counts.departments).map(([dept, count]) => (
                  dept !== '-' && (
                    <button
                      key={dept}
                      onClick={() => setFilterDepartment(dept)}
                      className={`w-full text-left px-4 py-2 rounded-lg ${filterDepartment === dept ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {dept} <span className="float-right">{count}</span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 overflow-x-auto">
          {filteredTree.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-2xl">No employees match the selected filters</p>
            </div>
          ) : (
            <div className="flex justify-center">
              {filteredTree.length === 1 ? (
                <TreeNode node={filteredTree[0]} />
              ) : (
                <div className="flex gap-20 flex-wrap justify-center">
                  {filteredTree.map((root) => (
                    <TreeNode key={root.id} node={root} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}