// Updated OrgTree component with compact employee nodes for large organizations
// Theme preserved, card size reduced, layout optimized for hundreds of employees

import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-6 h-6 bg-gray-900/70 border border-cyan-700 rounded-full flex items-center justify-center text-cyan-400 text-xs font-bold hover:bg-gray-900/90 transition"
        >
          {expanded ? "−" : "+"}
        </button>
      )}

      {/* Compact Card */}
      <div className="relative bg-gray-900/40 border border-cyan-800 rounded-xl p-3 w-48 text-center shadow hover:shadow-md transition-transform transform hover:scale-105">
        {node.photo ? (
          <img
            src={node.photo}
            alt={node.name}
            className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-cyan-700"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">
            {node.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        <h3 className="font-semibold text-sm text-cyan-300 truncate">{node.name || "—"}</h3>
        {node.title && <p className="text-[11px] text-pink-400 truncate">{node.title}</p>}
        {node.department && <p className="text-[10px] text-gray-400 truncate">{node.department}</p>}

        <span
          className={`inline-block px-2 py-0.5 mt-2 rounded-full text-[10px] font-medium ${
            node.is_active ? "bg-green-700/30 text-green-200" : "bg-red-700/30 text-red-200"
          }`}
        >
          {node.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {hasChildren && expanded && (
        <>
          <div className="w-px bg-gray-700/50 h-6 mt-2"></div>
          <div className="relative mt-2">
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-700/50"></div>
            <div className="flex flex-wrap justify-center gap-8 pt-4">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px bg-gray-700/50 h-6"></div>
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
  const [rawEmployees, setRawEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterActive, setFilterActive] = useState("all");
  const [filterDesignation, setFilterDesignation] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");

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

        const flat = [];
        const traverse = (node) => {
          flat.push({
            id: node.id,
            name: node.name,
            title: node.title || "-",
            department: node.department || "-",
            employee_code: node.employee_code || "-",
            is_active: node.is_active ?? true,
          });
          if (node.children) node.children.forEach(traverse);
        };
        tree.forEach(traverse);
        setRawEmployees(flat);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTree = useMemo(() => {
    if (!treeData.length) return [];

    const filterNode = (node) => {
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "yes" && node.is_active) ||
        (filterActive === "no" && !node.is_active);

      const matchesDesig = filterDesignation === "all" || node.title === filterDesignation;
      const matchesDept = filterDepartment === "all" || node.department === filterDepartment;

      const matches = matchesActive && matchesDesig && matchesDept;

      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];

      if (!matches && filteredChildren.length === 0) return null;

      return { ...node, children: filteredChildren };
    };

    return treeData.map(filterNode).filter(Boolean);
  }, [treeData, filterActive, filterDesignation, filterDepartment]);

  const counts = useMemo(() => {
    const active = rawEmployees.filter((e) => e.is_active).length;
    const inactive = rawEmployees.length - active;

    const designations = {};
    const departments = {};
    rawEmployees.forEach((e) => {
      designations[e.title] = (designations[e.title] || 0) + 1;
      departments[e.department] = (departments[e.department] || 0) + 1;
    });

    return { total: rawEmployees.length, active, inactive, designations, departments };
  }, [rawEmployees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-cyan-300 text-xl">
        Loading Organization Tree...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <header className="border-b border-cyan-800 pb-3 mb-6 flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow"></div>
        <h1 className="text-pink-400 text-lg font-bold">Organization Tree</h1>
      </header>

      {/* TREE */}
      <div className="bg-gray-900/30 border border-cyan-800 rounded-2xl p-6 overflow-x-auto shadow-lg">
        {filteredTree.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-lg">No employees match the selected filters</p>
          </div>
        ) : (
          <div className="flex justify-center">
            {filteredTree.length === 1 ? (
              <TreeNode node={filteredTree[0]} />
            ) : (
              <div className="flex gap-10 flex-wrap justify-center">
                {filteredTree.map((root) => (
                  <TreeNode key={root.id} node={root} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
