import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";
import { Search, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function TreeNode({ node, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 w-9 h-9 rounded-full bg-white border-2 border-zinc-300 flex items-center justify-center text-zinc-600 text-xl font-bold hover:border-zinc-400 hover:bg-zinc-50 transition-all shadow-md"
        >
          {expanded ? "−" : "+"}
        </button>
      )}

      <button
        onClick={() => onSelect(node)}
        className="w-52 bg-white border border-zinc-200 rounded-3xl p-6 text-center transition-all duration-300 hover:border-zinc-400 hover:shadow-xl hover:-translate-y-1 focus:outline-none"
      >
        {node.photo ? (
          <img
            src={node.photo}
            alt={node.name}
            className="w-24 h-24 rounded-2xl mx-auto mb-4 object-cover border-4 border-white shadow-md"
            onError={(e) => {
              e.target.src = "/fallback-avatar.png";
              e.target.onerror = null;
            }}
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl mx-auto mb-4 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white text-4xl font-semibold shadow-md">
            {node.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <h3 className="font-semibold text-zinc-900 text-lg line-clamp-2">
          {node.name || "—"}
        </h3>
        <p className="text-zinc-500 text-sm mt-1">{node.title || "No title"}</p>
      </button>

      {hasChildren && expanded && (
        <>
          <div className="w-px bg-zinc-300 h-12 mt-6"></div>
          <div className="relative mt-2 w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-zinc-300"></div>
            <div className="flex justify-center gap-20 pt-6 flex-wrap">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center min-w-max">
                  <div className="w-px bg-zinc-300 h-12"></div>
                  <TreeNode node={child} onSelect={onSelect} />
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
  const navigate = useNavigate();
  
  const [fullTreeData, setFullTreeData] = useState([]);
  const [filteredTreeData, setFilteredTreeData] = useState([]);
  const [displayedTreeData, setDisplayedTreeData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Fetch tree data
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
        setFullTreeData(tree);
        setFilteredTreeData(tree);
        setDisplayedTreeData(tree);
      } catch (err) {
        console.error("Failed to load org tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applySearch = () => {
    const lowerSearch = appliedSearch.toLowerCase().trim();
    if (!lowerSearch) {
      setFilteredTreeData(fullTreeData);
      setDisplayedTreeData(fullTreeData);
      return;
    }

    const nodeOrDescendantMatches = (node) => {
      if (node.name?.toLowerCase().includes(lowerSearch)) return true;
      return node.children?.some(nodeOrDescendantMatches) || false;
    };

    const filterNode = (node) => {
      if (!nodeOrDescendantMatches(node)) return null;
      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];
      return { ...node, children: filteredChildren };
    };

    const newFiltered = fullTreeData.map(filterNode).filter(Boolean);
    setFilteredTreeData(newFiltered);
    setDisplayedTreeData(newFiltered);
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput);
    applySearch();
  };

  const handleClear = () => {
    setSearchInput("");
    setAppliedSearch("");
    setFilteredTreeData(fullTreeData);
    setDisplayedTreeData(fullTreeData);
  };

  useEffect(() => {
    applySearch();
  }, [appliedSearch, fullTreeData]);

  const formatDate = (dateStr) => 
    !dateStr ? "—" : new Date(dateStr).toLocaleDateString("en-US", { 
      year: "numeric", month: "long", day: "numeric" 
    });

  const formatCurrency = (amount) => 
    !amount ? "—" : new Intl.NumberFormat("en-IN", { 
      style: "currency", currency: "INR" 
    }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-xl text-zinc-600">Loading Organization Tree...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Organization Tree
                </h1>
                <p className="text-zinc-500">Visual hierarchy of your company structure</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-md">
            <label className="block text-zinc-600 font-medium mb-2">Search by Employee Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name (e.g. Kavitha, Priya...)"
                className="flex-1 bg-white border border-zinc-200 rounded-2xl px-5 py-3 focus:border-zinc-400 outline-none text-zinc-800 placeholder-zinc-400"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl flex items-center gap-2 transition font-medium"
              >
                <Search size={20} />
                Search
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-2xl flex items-center gap-2 transition"
              >
                <X size={20} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Tree Area */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm overflow-x-auto">
          <div className="flex justify-center min-w-max py-8">
            <div className="inline-flex gap-20">
              {displayedTreeData.length === 0 ? (
                <div className="text-xl text-zinc-500 py-20">
                  No employees found matching "{appliedSearch}"
                </div>
              ) : (
                displayedTreeData.map((root) => (
                  <TreeNode key={root.id} node={root} onSelect={setSelectedEmployee} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Details Sidebar */}
      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSelectedEmployee(null)}
          />
          <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-zinc-200 shadow-2xl z-50 overflow-y-auto">
            <div className="p-8">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-6 right-6 text-3xl text-zinc-400 hover:text-zinc-600"
              >
                ×
              </button>

              <div className="flex items-center gap-6 mb-8">
                {selectedEmployee.photo ? (
                  <img
                    src={selectedEmployee.photo}
                    alt={selectedEmployee.name}
                    className="w-28 h-28 rounded-3xl border-4 border-white shadow-md object-cover"
                    onError={(e) => {
                      e.target.src = "/fallback-avatar.png";
                      e.target.onerror = null;
                    }}
                  />
                ) : (
                  <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white text-6xl font-bold shadow-md">
                    {selectedEmployee.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-zinc-900">{selectedEmployee.name}</h2>
                  <p className="text-xl text-zinc-600 mt-1">{selectedEmployee.title || "No designation"}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Employment Details</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Department", selectedEmployee.department],
                      ["Role", selectedEmployee.role],
                      ["Employee Code", selectedEmployee.employee_code],
                      ["Joining Date", formatDate(selectedEmployee.date_of_joining)],
                      ["CTC", formatCurrency(selectedEmployee.ctc)],
                      ["Status", selectedEmployee.is_active ? "Active" : "Inactive"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1">
                        <span className="text-zinc-500">{label}</span>
                        <span className="font-medium text-zinc-800">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Email", selectedEmployee.email],
                      ["Phone", selectedEmployee.phone],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1">
                        <span className="text-zinc-500">{label}</span>
                        <span className="font-medium text-zinc-800">{value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}