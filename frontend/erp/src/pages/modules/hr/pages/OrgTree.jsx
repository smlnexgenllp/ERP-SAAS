import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";

function TreeNode({ node, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-gray-800 border-2 border-cyan-600 flex items-center justify-center text-cyan-300 text-xl font-bold hover:bg-cyan-900 hover:border-cyan-400 transition-all shadow-lg"
        >
          {expanded ? "−" : "+"}
        </button>
      )}

      <button
        onClick={() => onSelect(node)}
        className="w-44 bg-gray-900/70 backdrop-blur-sm border border-cyan-800/60 rounded-2xl p-5 text-center transition-all duration-300 hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-600/50"
      >
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
        <p className="text-pink-400 text-sm mt-1">{node.title || "No title"}</p>
      </button>

      {hasChildren && expanded && (
        <>
          <div className="w-px bg-cyan-700/40 h-12 mt-4"></div>
          <div className="relative mt-2 w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-cyan-700/40"></div>
            <div className="flex justify-center gap-20 pt-4 flex-wrap">
              {node.children.map((child) => (
                <div
                  key={child.id}
                  className="flex flex-col items-center min-w-max"
                >
                  <div className="w-px bg-cyan-700/40 h-12"></div>
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
  const [fullTreeData, setFullTreeData] = useState([]);
  const [filteredTreeData, setFilteredTreeData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchName, setSearchName] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedManager, setSelectedManager] = useState("All");

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
      } catch (err) {
        console.error("Failed to load org tree:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { departments, managers } = useMemo(() => {
    const depts = new Set(["All"]);
    const mgrs = [{ id: "All", name: "All Managers" }];

    const traverse = (node) => {
      if (node.department) depts.add(node.department);
      if (node.children?.length > 0 && node.id && node.name) {
        mgrs.push({ id: node.id, name: node.name });
      }
      node.children?.forEach(traverse);
    };

    fullTreeData.forEach(traverse);
    return {
      departments: Array.from(depts).sort(),
      managers: mgrs.sort((a, b) =>
        a.id === "All" ? -1 : b.id === "All" ? 1 : a.name.localeCompare(b.name)
      ),
    };
  }, [fullTreeData]);

  // Fixed recursive filter
  useEffect(() => {
    const lowerSearch = searchName.toLowerCase().trim();

    const filterNode = (node) => {
      const nodeMatchesSearch =
        !lowerSearch || node.name?.toLowerCase().includes(lowerSearch);
      const nodeMatchesDept =
        selectedDepartment === "All" || node.department === selectedDepartment;
      const nodeMatchesManager =
        selectedManager === "All" ||
        String(node.id) === String(selectedManager);

      const filteredChildren = node.children
        ? node.children.map(filterNode).filter(Boolean)
        : [];
      const hasMatchingChild = filteredChildren.length > 0;

      const shouldInclude =
        nodeMatchesSearch ||
        nodeMatchesDept ||
        nodeMatchesManager ||
        hasMatchingChild;

      if (shouldInclude) {
        return {
          ...node,
          children:
            filteredChildren.length > 0
              ? filteredChildren
              : hasMatchingChild
              ? node.children
              : [],
        };
      }
      return null;
    };

    let filtered = fullTreeData.map(filterNode).filter(Boolean);

    // If no filters active, show full tree
    if (
      !lowerSearch &&
      selectedDepartment === "All" &&
      selectedManager === "All"
    ) {
      filtered = fullTreeData;
    }

    setFilteredTreeData(filtered);
  }, [searchName, selectedDepartment, selectedManager, fullTreeData]);

  const formatDate = (dateStr) =>
    !dateStr
      ? "—"
      : new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
  const formatCurrency = (amount) =>
    !amount
      ? "—"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-2xl text-cyan-400">
          Loading Organization Tree...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-cyan-200 py-8 px-8 flex">
      <div className="flex-1 overflow-auto pr-8">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
            Organization Tree
          </h1>
        </div>

        <div className="flex justify-center gap-6 mb-12 flex-wrap">
          <div className="w-72">
            <label className="block text-cyan-300 font-medium mb-2">
              Search by Name
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g. Kavitha, Praveen"
              className="w-full bg-gray-900 border border-cyan-700 rounded-lg p-3 text-cyan-200 placeholder-gray-500 focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="w-64">
            <label className="block text-cyan-300 font-medium mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-gray-900 border border-cyan-700 rounded-lg p-3 text-cyan-200 focus:border-cyan-400 outline-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="w-64">
            <label className="block text-cyan-300 font-medium mb-2">
              Manager
            </label>
            <select
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              className="w-full bg-gray-900 border border-cyan-700 rounded-lg p-3 text-cyan-200 focus:border-cyan-400 outline-none"
            >
              {managers.map((mgr) => (
                <option key={mgr.id} value={mgr.id}>
                  {mgr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto overflow-y-visible pb-20">
          <div className="flex justify-center min-w-max">
            <div className="inline-flex gap-22">
              {filteredTreeData.length === 0 ? (
                <div className="text-2xl text-gray-400 mt-20">
                  No employees found matching filters.
                </div>
              ) : (
                filteredTreeData.map((root) => (
                  <TreeNode
                    key={root.id}
                    node={root}
                    onSelect={setSelectedEmployee}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSelectedEmployee(null)}
          />
          <div className="fixed inset-y-0 right-0 w-96 bg-gray-900/95 backdrop-blur-xl border-l border-cyan-800 shadow-2xl z-50 overflow-y-auto">
            <div className="p-8">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-6 right-6 text-cyan-400 hover:text-cyan-200 text-3xl"
              >
                ×
              </button>

              <div className="flex items-center gap-6 mb-8">
                {selectedEmployee.photo ? (
                  <img
                    src={selectedEmployee.photo}
                    alt={selectedEmployee.name}
                    className="w-24 h-24 rounded-full border-4 border-cyan-500 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                    {selectedEmployee.name[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-bold text-cyan-300">
                    {selectedEmployee.name}
                  </h2>
                  <p className="text-xl text-pink-400">
                    {selectedEmployee.title || "No designation"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedEmployee.employee_code || "No code"}
                  </p>
                </div>
              </div>

              <div className="space-y-6 text-lg">
                <div>
                  <h3 className="text-cyan-300 font-semibold mb-3">
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Department</span>
                      <span>{selectedEmployee.department || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Role</span>
                      <span>{selectedEmployee.role || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Joining Date</span>
                      <span>
                        {formatDate(selectedEmployee.date_of_joining)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Probation</span>
                      <span>
                        {selectedEmployee.is_probation ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CTC</span>
                      <span>{formatCurrency(selectedEmployee.ctc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={
                          selectedEmployee.is_active
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {selectedEmployee.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-cyan-300 font-semibold mb-3">Contact</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email</span>
                      <span>{selectedEmployee.email || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone</span>
                      <span>{selectedEmployee.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-cyan-300 font-semibold mb-3">Personal</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date of Birth</span>
                      <span>{formatDate(selectedEmployee.date_of_birth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Notes</span>
                      <span className="text-sm">
                        {selectedEmployee.notes || "—"}
                      </span>
                    </div>
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
