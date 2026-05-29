import React, { useEffect, useState, useMemo } from "react";
import api from "../../../../services/api";
import {
  Search,
  X,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  BadgeIndianRupee,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function TreeNode({ node, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div className="relative">
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
          >
            {expanded ? "−" : "+"}
          </button>
        )}

        <button
  onClick={() => onSelect(node)}
  className="group w-48 bg-white border border-zinc-200 rounded-2xl p-4 hover:shadow-xl hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1"
>
  {/* Avatar */}
  <div className="relative">
    {node.photo ? (
      <img
        src={node.photo}
        alt={node.name}
        className="w-16 h-16 mx-auto rounded-2xl object-cover border-2 border-white shadow-md"
        onError={(e) => {
          e.target.src = "/fallback-avatar.png";
          e.target.onerror = null;
        }}
      />
    ) : (
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-white text-2xl font-bold shadow-md">
        {node.name?.[0]?.toUpperCase() || "?"}
      </div>
    )}

    <div className="absolute bottom-0 right-[34%] w-3 h-3 rounded-full border-2 border-white bg-emerald-500"></div>
  </div>

  {/* Info */}
  <div className="mt-3">
    <h3 className="text-sm font-bold text-zinc-900 line-clamp-1">
      {node.name || "—"}
    </h3>

    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
      {node.title || "No Designation"}
    </p>

    {node.department && (
      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 rounded-lg text-[11px] text-zinc-600">
        <Building2 size={11} />
        <span className="truncate max-w-[100px]">
          {node.department}
        </span>
      </div>
    )}
  </div>
</button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <>
          <div className="w-px h-10 bg-zinc-300"></div>

          <div className="relative pt-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-zinc-300 w-full"></div>

            <div className="flex justify-center gap-16 flex-wrap">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px h-8 bg-zinc-300"></div>
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
  const [displayedTreeData, setDisplayedTreeData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch tree
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
        setDisplayedTreeData(tree);
      } catch (err) {
        console.error("Failed to load org tree:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Flatten all employees
  const flattenEmployees = (nodes) => {
    let result = [];

    nodes.forEach((node) => {
      result.push(node);

      if (node.children?.length) {
        result = result.concat(flattenEmployees(node.children));
      }
    });

    return result;
  };

  const allEmployees = useMemo(() => {
    return flattenEmployees(fullTreeData);
  }, [fullTreeData]);

  // Filtered employee cards
  const filteredEmployees = useMemo(() => {
    if (!searchInput.trim()) return [];

    return allEmployees.filter((emp) =>
      emp.name?.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [searchInput, allEmployees]);

  const formatDate = (dateStr) =>
    !dateStr
      ? "—"
      : new Date(dateStr).toLocaleDateString("en-IN", {
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-5 text-zinc-600 font-medium text-lg">
            Loading organization tree...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-[1700px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate("/hr/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Organization Tree
                </h1>

                <p className="text-zinc-500 mt-1">
                  Company hierarchy and employee structure
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="w-full lg:w-[420px]">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search employee name..."
                className="w-full bg-white border border-zinc-200 rounded-2xl pl-14 pr-14 py-4 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 shadow-sm"
              />

              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchInput.trim() ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  Search Results
                </h2>

                <p className="text-zinc-500 mt-1">
                  {filteredEmployees.length} employee
                  {filteredEmployees.length !== 1 && "s"} found
                </p>
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-zinc-400" />
                </div>

                <h3 className="text-xl font-semibold text-zinc-800">
                  No employee found
                </h3>

                <p className="text-zinc-500 mt-2">
                  Try searching with another employee name
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="text-left bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      {emp.photo ? (
                        <img
                          src={emp.photo}
                          alt={emp.name}
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-white text-2xl font-bold">
                          {emp.name?.[0]?.toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="font-bold text-zinc-900 truncate">
                          {emp.name}
                        </h3>

                        <p className="text-sm text-zinc-500 truncate">
                          {emp.title || "No Designation"}
                        </p>

                        <p className="text-xs text-zinc-400 mt-1 truncate">
                          {emp.department || "No Department"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tree View */
          <div className="bg-white border border-zinc-200 rounded-[2rem] p-6 shadow-sm overflow-hidden">
  <div className="w-full overflow-y-auto py-6">
    <div className="flex flex-wrap justify-center gap-8">
                {displayedTreeData.map((root) => (
                  <TreeNode
                    key={root.id}
                    node={root}
                    onSelect={setSelectedEmployee}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Sidebar */}
      {selectedEmployee && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSelectedEmployee(null)}
          />

          <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-zinc-200">
            <div className="p-8">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl hover:bg-zinc-100 flex items-center justify-center text-zinc-500"
              >
                <X size={24} />
              </button>

              {/* Profile */}
              <div className="text-center mb-10">
                {selectedEmployee.photo ? (
                  <img
                    src={selectedEmployee.photo}
                    alt={selectedEmployee.name}
                    className="w-36 h-36 rounded-[2rem] object-cover mx-auto border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-[2rem] bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-white text-6xl font-bold mx-auto shadow-2xl">
                    {selectedEmployee.name?.[0]?.toUpperCase()}
                  </div>
                )}

                <h2 className="text-3xl font-bold text-zinc-900 mt-6">
                  {selectedEmployee.name}
                </h2>

                <p className="text-zinc-500 text-lg mt-1">
                  {selectedEmployee.title || "No Designation"}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  {selectedEmployee.is_active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-8">
                {/* Employment */}
                <div className="bg-zinc-50 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-zinc-900 mb-5">
                    Employment Details
                  </h3>

                  <div className="space-y-4">
                    {[
                      {
                        icon: Building2,
                        label: "Department",
                        value: selectedEmployee.department,
                      },
                      {
                        icon: Briefcase,
                        label: "Role",
                        value: selectedEmployee.role,
                      },
                      {
                        icon: Calendar,
                        label: "Joining Date",
                        value: formatDate(
                          selectedEmployee.date_of_joining
                        ),
                      },
                      {
                        icon: BadgeIndianRupee,
                        label: "CTC",
                        value: formatCurrency(selectedEmployee.ctc),
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
                          <item.icon size={18} className="text-zinc-600" />
                        </div>

                        <div>
                          <p className="text-sm text-zinc-500">
                            {item.label}
                          </p>

                          <p className="font-semibold text-zinc-900">
                            {item.value || "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-zinc-50 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-zinc-900 mb-5">
                    Contact Information
                  </h3>

                  <div className="space-y-4">
                    {[
                      {
                        icon: Mail,
                        label: "Email",
                        value: selectedEmployee.email,
                      },
                      {
                        icon: Phone,
                        label: "Phone",
                        value: selectedEmployee.phone,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
                          <item.icon size={18} className="text-zinc-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm text-zinc-500">
                            {item.label}
                          </p>

                          <p className="font-semibold text-zinc-900 break-all">
                            {item.value || "—"}
                          </p>
                        </div>
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