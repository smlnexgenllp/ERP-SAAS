// src/pages/modules/hr/EmployeeList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Cake,
  Users,
  Building2,
  IndianRupee,
  ArrowLeft,
} from "lucide-react";
import EditEmployeeModal from "./EditEmployeeModal";

export default function EmployeeList() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [accountRole, setAccountRole] = useState(null);
  const [orgRole, setOrgRole] = useState(null);

  /* Fetch Current User Role */
  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/auth/current-user/");
      setAccountRole(res.data.user?.role || null);
      setOrgRole(res.data.organization_user?.role || null);
    } catch (err) {
      console.error("Failed to fetch current user");
    }
  };

  /* Fetch Employees */
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
    fetchCurrentUser();
    fetchEmployees();
  }, []);

  const canEditEmployee =
    accountRole === "sub_org_admin" ||
    orgRole === "HR" ||
    orgRole === "HR Manager";

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSelectedEmployee(employees.find(emp => emp.id === id));
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const formatCTC = (ctc) =>
    ctc ? `₹${Number(ctc).toLocaleString("en-IN")}` : "—";

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-8">
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
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Employee Directory
                </h1>
                <p className="text-zinc-500">Manage and view all employees</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={fetchEmployees}
              className="px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
            >
              Refresh
            </button>

            <button
              disabled={!canEditEmployee || !selectedEmployee}
              onClick={() => setShowEditModal(true)}
              className={`px-6 py-3 rounded-2xl font-medium transition ${
                canEditEmployee && selectedEmployee
                  ? "bg-zinc-900 text-white hover:bg-black"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              Update Employee
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Employee</th>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Designation</th>
                <th className="px-8 py-5 text-left font-semibold text-zinc-600">Department</th>
                <th className="px-8 py-5 text-center font-semibold text-zinc-600 w-20">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {employees.map((emp) => {
                const expanded = expandedRows.has(emp.id);

                return (
                  <React.Fragment key={emp.id}>
                    <tr
                      onClick={() => toggleRow(emp.id)}
                      className={`cursor-pointer hover:bg-zinc-50 transition-colors ${
                        selectedEmployee?.id === emp.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-8 py-6 font-medium text-zinc-900">
                        {emp.full_name}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {emp.designation?.title || "—"}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {emp.department?.name || "—"}
                      </td>
                      <td className="px-8 py-6 text-center text-zinc-500">
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </td>
                    </tr>

                    {expanded && (
                      <tr>
                        <td colSpan="4" className="bg-zinc-50 px-8 py-8 border-t border-zinc-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Info icon={<Calendar className="text-emerald-600" />} label="Date of Joining" value={formatDate(emp.date_of_joining)} />
                            <Info icon={<Cake className="text-rose-600" />} label="Date of Birth" value={formatDate(emp.date_of_birth)} />
                            <Info icon={<IndianRupee className="text-amber-600" />} label="CTC" value={formatCTC(emp.ctc)} />
                            <Info icon={<Building2 className="text-blue-600" />} label="Reports To" value={emp.reporting_to?.full_name || emp.reporting_to_name || "—"} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan="4" className="text-center py-20">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-zinc-500 mt-4">Loading employees...</p>
                  </td>
                </tr>
              )}

              {!loading && employees.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-20 text-zinc-500">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && (
        <EditEmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowEditModal(false)}
          onUpdated={fetchEmployees}
        />
      )}
    </div>
  );
}

/* Info Component */
const Info = ({ icon, label, value }) => (
  <div className="flex items-start gap-4 bg-white border border-zinc-100 rounded-2xl p-5">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-zinc-900 font-semibold mt-1 text-lg">{value}</p>
    </div>
  </div>
);