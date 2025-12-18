import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import { ChevronDown, ChevronUp, Calendar, Cake, DollarSign, Users, Building2, IndianRupee } from "lucide-react";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      let allEmployees = [];
      let url = "/hr/employees/";

      while (url) {
        const response = await api.get(url);
        const data = response.data;

        if (Array.isArray(data)) {
          allEmployees = data;
          break;
        }

        allEmployees = [...allEmployees, ...data.results];
        url = data.next ? data.next.replace(api.defaults.baseURL, "") : null;
      }

      setEmployees(allEmployees);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const formatCTC = (ctc) => ctc ? `₹${Number(ctc).toLocaleString("en-IN")}` : "—";

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-cyan-300 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Clean & Elegant Header */}
        <div className="flex items-center justify-between mb-10 border-b border-cyan-800/60 pb-5">
          <div className="flex items-center gap-4">
            <Users className="w-9 h-9 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
                Employee Directory
              </h1>
              <p className="text-lg text-gray-500">{employees.length} Members</p>
            </div>
          </div>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="px-7 py-3 bg-gradient-to-r from-cyan-800/40 to-purple-800/40 border border-cyan-700 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-600/30 transition-all flex items-center gap-3"
          >
            {loading ? "Syncing..." : "Refresh List"}
          </button>
        </div>
        {/* Loading */}
        {loading && employees.length === 0 && (
          <div className="text-center py-28">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-cyan-600 border-t-transparent"></div>
            <p className="mt-6 text-xl text-gray-400">Loading employee data...</p>
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="mb-8 p-6 bg-red-900/30 border border-red-700 rounded-xl text-center">
            <p className="text-lg text-red-400 font-bold mb-2">Connection Error</p>
            <p className="text-red-300 mb-4">{error}</p>
            <button onClick={fetchEmployees} className="px-7 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-medium">
              Retry
            </button>
          </div>
        )}
        {/* Empty State */}
        {!loading && !error && employees.length === 0 && (
          <div className="text-center py-28 bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-cyan-800/50">
            <Users className="w-20 h-20 mx-auto text-gray-700 mb-5 opacity-40" />
            <p className="text-2xl text-gray-500">No employees found</p>
          </div>
        )}
        {/* Compact & Professional Expandable Table */}
        {employees.length > 0 && (
          <div className="bg-gray-900/60 backdrop-blur-xl border border-cyan-800/70 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border-b border-cyan-800/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-200 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-pink-300 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/40">
                  {employees.map((employee) => {
                    const isExpanded = expandedRows.has(employee.id);
                    return (
                      <React.Fragment key={employee.id}>
                        {/* Main Row - Compact & Clean */}
                        <tr
                          onClick={() => toggleRow(employee.id)}
                          className="hover:bg-gray-800/40 transition-all duration-200 cursor-pointer group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              {employee.photo ? (
                                <img src={employee.photo} alt="" className="w-11 h-11 rounded-full border border-cyan-700 object-cover" />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-600 to-pink-600 flex items-center justify-center text-lg font-bold text-gray-900">
                                  {employee.full_name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-cyan-200">{employee.full_name}</p>
                                <p className="text-xs text-gray-500">{employee.email || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-pink-300 font-medium">
                              {employee.designation?.title || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-cyan-300">
                              {employee.department?.name || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="text-cyan-400 group-hover:text-cyan-200 transition">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row - Clean & Balanced */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 bg-gray-800/50 border-t border-cyan-700/50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {/* DOJ */}
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-cyan-900/40 rounded-lg border border-cyan-700">
                                    <Calendar className="w-7 h-7 text-cyan-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Joined On</p>
                                    <p className="text-lg font-semibold text-cyan-200">{formatDate(employee.date_of_joining)}</p>
                                  </div>
                                </div>

                                {/* DOB */}
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-pink-900/40 rounded-lg border border-pink-700">
                                    <Cake className="w-7 h-7 text-pink-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Birthday</p>
                                    <p className="text-lg font-semibold text-pink-200">{formatDate(employee.date_of_birth)}</p>
                                  </div>
                                </div>

                                {/* CTC */}
                                {employee.ctc && (
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-900/40 rounded-lg border border-emerald-700">
                                      <IndianRupee className="w-7 h-7 text-emerald-400" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wider">Annual CTC</p>
                                      <p className="text-xl font-bold text-emerald-300">{formatCTC(employee.ctc)}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Reports To */}
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-purple-900/40 rounded-lg border border-purple-700">
                                    <Building2 className="w-7 h-7 text-purple-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Reports To</p>
                                    <p className="text-lg font-semibold text-purple-300">
                                      {employee.reporting_to?.full_name || employee.reporting_to || "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>                        
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}