import React, { useState, useEffect } from "react";
import api from "../../../../services/api"; // Adjust path if needed

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load employees";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-cyan-300 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-cyan-800 pb-3">
          <h1 className="text-3xl font-bold text-pink-400">Employees</h1>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 border border-cyan-700 ${
              loading
                ? "bg-gray-800 cursor-not-allowed text-gray-400"
                : "bg-cyan-800 hover:bg-cyan-700 text-pink-400"
            }`}
          >
            {loading ? "Loading..." : "Refresh List"}
          </button>
        </div>

        {/* Loading */}
        {loading && employees.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
            <p className="mt-6 text-lg">Fetching employees...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-5 bg-red-900/40 border border-red-600 text-red-400 rounded-lg flex items-center justify-between">
            <div>
              <strong>Error:</strong> {error}
            </div>
            <button
              onClick={fetchEmployees}
              className="ml-4 underline hover:no-underline text-pink-400 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && employees.length === 0 && (
          <div className="text-center py-20 bg-gray-900 rounded-xl shadow border border-cyan-900">
            <p className="text-xl text-gray-400">No employees found</p>
            <p className="text-sm text-gray-500 mt-2">
              This organization has no registered employees yet.
            </p>
          </div>
        )}

        {/* Employee Cards */}
        {employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="bg-gray-900 border border-cyan-900 rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Photo */}
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt={employee.full_name}
                    className="w-full h-48 object-cover border-b border-cyan-800"
                  />
                ) : (
                  <div className="bg-gray-800 h-48 flex items-center justify-center border-b border-cyan-900">
                    <span className="text-5xl font-bold text-pink-400">
                      {employee.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Name */}
                  <h3 className="text-xl font-bold text-cyan-300 truncate">
                    {employee.full_name || "No Name"}
                  </h3>

                  {/* Role */}
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Designation:</strong>{" "}
                      <span className="font-medium text-pink-400">
                        {employee.designation?.title || "Not Assigned"}
                      </span>
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      <span className="font-medium text-cyan-300">
                        {employee.department?.name || "Not Assigned"}
                      </span>
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 text-xs text-gray-400 space-y-1 border-t border-cyan-800 pt-3">
                    <p>
                      <strong>DOJ:</strong>{" "}
                      {formatDate(employee.date_of_joining)}
                    </p>
                    <p>
                      <strong>DOB:</strong> {formatDate(employee.date_of_birth)}
                    </p>
                  </div>

                  {/* Salary (CTC) */}
                  {employee.ctc && (
                    <div className="mt-4 bg-gray-800/50 rounded-lg p-3 text-center border border-cyan-800">
                      <p className="text-xs text-gray-400">Annual CTC</p>
                      <p className="text-lg font-bold text-pink-400">
                        ₹{Number(employee.ctc).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
