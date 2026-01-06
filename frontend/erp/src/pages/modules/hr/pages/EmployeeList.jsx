import React, { useState, useEffect } from "react";
import api from "../../../../services/api";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Cake,
  Users,
  Building2,
  IndianRupee,
} from "lucide-react";
import EditEmployeeModal from "./EditEmployeeModal";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  /* ---------------- Fetch Logged-in User ---------------- */
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/auth/current-user/");
      setCurrentUserRole(res.data.user.role);
      console.log("Current User Role:", res.data.user.role);
    } catch (err) {
      console.error("Failed to fetch user role");
    }
  };

  /* ---------------- Fetch Employees ---------------- */
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      let allEmployees = [];
      let url = "/hr/employees/";

      while (url) {
        const res = await api.get(url);
        const data = res.data;

        if (Array.isArray(data)) {
          allEmployees = data;
          break;
        }

        allEmployees = [...allEmployees, ...data.results];
        url = data.next ? data.next.replace(api.defaults.baseURL, "") : null;
      }

      setEmployees(allEmployees);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCurrentUser();
  }, []);

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return set;
    });
  };

  const canEditEmployee =
    currentUserRole === "HR Manager" || currentUserRole === "sub_org_admin";

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const formatCTC = (ctc) =>
    ctc ? `₹${Number(ctc).toLocaleString("en-IN")}` : "—";

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-cyan-300 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-cyan-800 pb-4">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold">Employee Directory</h1>
          </div>

          <div className="flex gap-4">
            <button
              onClick={fetchEmployees}
              className="px-6 py-2 bg-cyan-900 rounded-lg border border-cyan-700"
            >
              Refresh
            </button>

            <button
              disabled={!canEditEmployee || !selectedEmployee}
              onClick={() => setShowEditModal(true)}
              className={`px-6 py-2 rounded-lg font-semibold
                ${
                  canEditEmployee && selectedEmployee
                    ? "bg-emerald-600 text-black hover:bg-emerald-500"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
            >
              Update Employee
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/40 p-4 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-cyan-900/40">
              <tr>
                <th className="px-6 py-4 text-left">Employee</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const expanded = expandedRows.has(emp.id);
                return (
                  <React.Fragment key={emp.id}>
                    <tr
                      onClick={() => {
                        toggleRow(emp.id);
                        setSelectedEmployee(emp);
                      }}
                      className={`cursor-pointer hover:bg-gray-800
                        ${
                          selectedEmployee?.id === emp.id
                            ? "bg-cyan-900/20"
                            : ""
                        }`}
                    >
                      <td className="px-6 py-4 font-semibold">
                        {emp.full_name}
                      </td>
                      <td className="px-6 py-4">
                        {emp.designation?.title || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {emp.department?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td colSpan="4" className="bg-gray-800 px-6 py-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <Info
                              icon={<Calendar />}
                              label="Joined"
                              value={formatDate(emp.date_of_joining)}
                            />
                            <Info
                              icon={<Cake />}
                              label="DOB"
                              value={formatDate(emp.date_of_birth)}
                            />
                            <Info
                              icon={<IndianRupee />}
                              label="CTC"
                              value={formatCTC(emp.ctc)}
                            />
                            <Info
                              icon={<Building2 />}
                              label="Reports To"
                              value={
                                emp.reporting_to?.full_name ||
                                emp.reporting_to ||
                                "—"
                              }
                            />
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

      {showEditModal && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowEditModal(false)}
          onUpdated={fetchEmployees}
        />
      )}
    </div>
  );
}

/* Info Card */
const Info = ({ icon, label, value }) => (
  <div className="flex gap-3 items-center">
    <div className="p-2 bg-cyan-900 rounded">{icon}</div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);
