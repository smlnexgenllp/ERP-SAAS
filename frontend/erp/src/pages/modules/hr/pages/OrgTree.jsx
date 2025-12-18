import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";

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

        {/* Right-Side Hover Details - Fixed Small Box */}
        <div className="absolute top-0 left-full ml-6 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-2 transition-all duration-300 pointer-events-none z-50">
          <div className="bg-gray-900/98 border border-cyan-700 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-4 mb-4">
              {node.photo ? (
                <img src={node.photo} alt={node.name} className="w-14 h-14 rounded-full border-2 border-cyan-500 object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                  {node.name[0]}
                </div>
              )}
              <div>
                <h4 className="text-lg font-bold text-cyan-300">{node.name}</h4>
                <p className="text-pink-400 font-medium">{node.title || "No title"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm border-t border-cyan-800/50 pt-3">
              {node.department && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Department</span>
                  <span className="text-cyan-100 font-medium">{node.department}</span>
                </div>
              )}
              {node.employee_code && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Emp Code</span>
                  <span className="text-cyan-100 font-mono">{node.employee_code}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${node.is_active ? "bg-green-800/70 text-green-200" : "bg-red-800/70 text-red-200"}`}>
                  {node.is_active ? "Active" : "Inactive"}
                </span>
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
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error("Failed to load org tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-2xl text-cyan-400">Loading Organization Tree...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-cyan-200 py-8 px-8">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
          Organization Tree
        </h1>
      </div>

      {/* Scrollable container with centered content */}
      <div className="w-full overflow-x-auto overflow-y-visible">
        <div className="flex justify-center min-w-max pb-20">
          <div className="inline-flex gap-22"> {/* Changed from justify-center to inline-flex for better centering */}
            {treeData.length === 1 ? (
              <TreeNode node={treeData[0]} />
            ) : (
              treeData.map((root) => (
                <TreeNode key={root.id} node={root} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}