import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";

// Update the hover panel in TreeNode component
function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {/* Expand/Collapse Button */}
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-gray-800 border-2 border-cyan-600 flex items-center justify-center text-cyan-300 text-xl font-bold hover:bg-cyan-900 hover:border-cyan-400 transition-all shadow-lg"
        >
          {expanded ? "−" : "+"}
        </button>
      )}

      {/* Employee Card + Right Hover Panel */}
      <div className="group relative">
        {/* Compact Card - Fixed Width */}
        <div className="w-44 bg-gray-900/70 backdrop-blur-sm border border-cyan-800/60 rounded-2xl p-5 text-center transition-all duration-300 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20">
          {node.photo ? (
            <img
              src={node.photo}
              alt={node.name}
              className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-4 border-cyan-600"
            />
          ) : (
            <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
              {node.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <h3 className="font-semibold text-cyan-200 text-base line-clamp-2 px-2">
            {node.name || "—"}
          </h3>
        </div>

        {/* Right-Side Hover Details - Slightly wider to accommodate more info */}
        <div className="absolute top-0 left-full ml-6 w-96 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-2 transition-all duration-300 pointer-events-none z-50">
          <div className="bg-gray-900/98 border border-cyan-700 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            {/* Header with photo and name */}
            <div className="flex items-center gap-4 mb-4">
              {node.photo ? (
                <img src={node.photo} alt={node.name} className="w-14 h-14 rounded-full border-2 border-cyan-500 object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {node.name?.[0] || "?"}
                </div>
              )}
              <div>
                <h4 className="text-lg font-bold text-cyan-300">{node.name}</h4>
                <p className="text-pink-400 font-medium">{node.title || "No title"}</p>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-3 border-t border-cyan-800/50 pt-3">
              {/* Email */}
              {node.email && (
                <div className="flex items-start gap-3 text-sm">
                  <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-400">Email</span>
                    <div className="text-cyan-100 truncate hover:text-clip">
                      <a href={`mailto:${node.email}`} className="hover:text-cyan-300 transition-colors">
                        {node.email}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone */}
              {node.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-400">Phone</span>
                    <div className="text-cyan-100">
                      <a href={`tel:${node.phone}`} className="hover:text-cyan-300 transition-colors">
                        {node.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile */}
              {node.mobile && (
                <div className="flex items-start gap-3 text-sm">
                  <svg className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-400">Mobile</span>
                    <div className="text-cyan-100">
                      <a href={`tel:${node.mobile}`} className="hover:text-cyan-300 transition-colors">
                        {node.mobile}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional details in a grid layout */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Department */}
                {node.department && (
                  <div className="text-sm">
                    <span className="text-gray-400 block">Department</span>
                    <span className="text-cyan-100 font-medium">{node.department}</span>
                  </div>
                )}

                {/* Employee Code */}
                {node.employee_code && (
                  <div className="text-sm">
                    <span className="text-gray-400 block">Emp Code</span>
                    <span className="text-cyan-100 font-mono">{node.employee_code}</span>
                  </div>
                )}

                {/* Location */}
                {node.location && (
                  <div className="text-sm">
                    <span className="text-gray-400 block">Location</span>
                    <span className="text-cyan-100">{node.location}</span>
                  </div>
                )}

                {/* Join Date */}
                {node.join_date && (
                  <div className="text-sm">
                    <span className="text-gray-400 block">Joined</span>
                    <span className="text-cyan-100">{node.join_date}</span>
                  </div>
                )}

                {/* Status */}
                <div className="text-sm col-span-2">
                  <span className="text-gray-400 block">Status</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${node.is_active ? "bg-green-800/70 text-green-200" : "bg-red-800/70 text-red-200"}`}>
                    {node.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connector line from card to details */}
          <div className="absolute top-10 -left-6 w-6 h-0.5 bg-cyan-600"></div>
        </div>
      </div>

      {/* Children Connector Lines */}
      {hasChildren && expanded && (
        <>
          <div className="w-px bg-cyan-700/40 h-12 mt-4"></div>
          <div className="relative mt-2 w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-cyan-700/40"></div>
            <div className="flex justify-center gap-20 pt-4 flex-wrap">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center min-w-max">
                  <div className="w-px bg-cyan-700/40 h-12"></div>
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
  const [originalTree, setOriginalTree] = useState([]); // Keep original for filtering
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response;
        try {
          response = await api.get("/hr/org-tree/");
        } catch {
          response = await api.get("/hr/public-org-tree/");
        }

        const tree = response.data.tree || [];
        setTreeData(tree);
        setOriginalTree(tree);

        // Extract unique departments
        const deptSet = new Set();
        const extractDepts = (nodes) => {
          nodes.forEach((node) => {
            if (node.department) deptSet.add(node.department);
            if (node.children) extractDepts(node.children);
          });
        };
        extractDepts(tree);
        setDepartments(["all", ...Array.from(deptSet).sort()]);
      } catch (err) {
        console.error("Failed to load org tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter function: returns filtered copy of tree
  const filteredTree = useMemo(() => {
    if (!searchTerm && selectedDepartment === "all") return originalTree;

    const matchesSearch = (node) => {
      const term = searchTerm.toLowerCase();
      return (
        node.name?.toLowerCase().includes(term) ||
        node.employee_code?.toLowerCase().includes(term) ||
        node.title?.toLowerCase().includes(term)
      );
    };

    const matchesDepartment = (node) =>
      selectedDepartment === "all" || node.department === selectedDepartment;

    const filterNode = (node) => {
      if (!matchesSearch(node) && !matchesDepartment(node)) {
        // If node doesn't match, but has children that might, keep it (with filtered children)
        if (node.children) {
          const filteredChildren = node.children
            .map(filterNode)
            .filter((child) => child !== null);
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
        }
        return null; // No match and no matching descendants
      }

      // Node matches, include it and filter its children recursively
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((child) => child !== null);
        return { ...node, children: filteredChildren };
      }
      return node;
    };

    return originalTree
      .map(filterNode)
      .filter((root) => root !== null);
  }, [originalTree, searchTerm, selectedDepartment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-2xl text-cyan-400">Loading Organization Tree...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-cyan-200 py-8 px-8">
      <div className="text-center mb-6">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
          Organization Tree
        </h1>
      </div>

      {/* Search and Filter Bar */}
      <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, code, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 pl-12 bg-gray-900/70 border border-cyan-800/60 rounded-xl focus:outline-none focus:border-cyan-500 text-cyan-100 placeholder-gray-500 transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-5 py-3 bg-gray-900/70 border border-cyan-800/60 rounded-xl focus:outline-none focus:border-cyan-500 text-cyan-100 transition-all"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept === "all" ? "All Departments" : dept}
            </option>
          ))}
        </select>
      </div>

      {/* Scrollable container with centered content */}
      <div className="w-full overflow-x-auto overflow-y-visible">
        <div className="flex justify-center min-w-max pb-20">
          <div className="inline-flex gap-22">
            {filteredTree.length === 0 ? (
              <div className="text-center text-gray-500 text-xl mt-20">
                No employees found matching your filters.
              </div>
            ) : filteredTree.length === 1 ? (
              <TreeNode node={filteredTree[0]} />
            ) : (
              filteredTree.map((root) => (
                <TreeNode key={root.id} node={root} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}