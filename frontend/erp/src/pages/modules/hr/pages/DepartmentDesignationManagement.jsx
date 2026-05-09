import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  Building2,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";

export default function DepartmentDesignationManagement() {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [desigTitle, setDesigTitle] = useState("");
  const [desigGrade, setDesigGrade] = useState("");

  // Editing states
  const [editingDept, setEditingDept] = useState(null);
  const [editingDesig, setEditingDesig] = useState(null);

  // Alerts
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 4000);
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, desigRes] = await Promise.all([
        api.get("/hr/departments/"),
        api.get("/hr/designations/"),
      ]);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setDesignations(desigRes.data.results || desigRes.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Department
  const createDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    try {
      if (editingDept) {
        await api.patch(`/hr/departments/${editingDept.id}/`, {
          name: deptName,
          code: deptCode,
        });
        showAlert("Department updated successfully!");
      } else {
        await api.post("/hr/departments/", {
          name: deptName,
          code: deptCode,
        });
        showAlert("Department created successfully!");
      }
      setDeptName("");
      setDeptCode("");
      setEditingDept(null);
      fetchData();
    } catch (err) {
      showAlert("Operation failed. Check code uniqueness.", "error");
    }
  };

  // Create Designation
  const createDesignation = async (e) => {
    e.preventDefault();
    if (!desigTitle.trim()) return;

    try {
      if (editingDesig) {
        await api.patch(`/hr/designations/${editingDesig.id}/`, {
          title: desigTitle,
          grade: desigGrade || "",
        });
        showAlert("Designation updated successfully!");
      } else {
        await api.post("/hr/designations/", {
          title: desigTitle,
          grade: desigGrade || "",
        });
        showAlert("Designation created successfully!");
      }
      setDesigTitle("");
      setDesigGrade("");
      setEditingDesig(null);
      fetchData();
    } catch (err) {
      showAlert("Operation failed. Title must be unique.", "error");
    }
  };

  // Delete handlers
  const deleteDepartment = async (id) => {
    if (!window.confirm("Delete this department? Employees will lose assignment.")) return;
    try {
      await api.delete(`/hr/departments/${id}/`);
      showAlert("Department deleted successfully");
      fetchData();
    } catch (err) {
      showAlert("Cannot delete: Used by employees", "error");
    }
  };

  const deleteDesignation = async (id) => {
    if (!window.confirm("Delete this designation?")) return;
    try {
      await api.delete(`/hr/designations/${id}/`);
      showAlert("Designation deleted successfully");
      fetchData();
    } catch (err) {
      showAlert("Cannot delete: Used by employees", "error");
    }
  };

  // Edit handlers
  const startEditDept = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
  };

  const startEditDesig = (desig) => {
    setEditingDesig(desig);
    setDesigTitle(desig.title);
    setDesigGrade(desig.grade || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="text-2xl text-zinc-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      {/* Alert */}
      {alert.show && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-xl z-50 font-medium border ${
            alert.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900">
            Department & Designation Management
          </h1>
          <p className="text-zinc-600 mt-3 text-lg">
            Manage your organizational structure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Departments Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-semibold text-zinc-900">Departments</h2>
            </div>

            {/* Create/Edit Form */}
            <form
              onSubmit={createDepartment}
              className="mb-8 bg-zinc-50 border border-zinc-200 rounded-2xl p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <input
                  type="text"
                  placeholder="Department Name"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="bg-white border border-zinc-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
                <input
                  type="text"
                  placeholder="Code (e.g. HR, FIN, PDC)"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                  className="bg-white border border-zinc-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                {editingDept ? "Update Department" : "Create Department"}
              </button>
              {editingDept && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDept(null);
                    setDeptName("");
                    setDeptCode("");
                  }}
                  className="w-full mt-3 py-3 text-zinc-600 hover:bg-zinc-100 rounded-2xl font-medium transition"
                >
                  Cancel
                </button>
              )}
            </form>

            {/* List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {departments.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No departments found</p>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-lg">{dept.name}</h4>
                      <p className="text-sm text-zinc-500">Code: {dept.code}</p>
                    </div>
                    <div className="flex gap-2 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => startEditDept(dept)}
                        className="p-3 hover:bg-blue-50 rounded-xl transition text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteDepartment(dept.id)}
                        className="p-3 hover:bg-red-50 rounded-xl transition text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Designations Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-violet-100 rounded-2xl">
                <Briefcase className="w-8 h-8 text-violet-600" />
              </div>
              <h2 className="text-3xl font-semibold text-zinc-900">Designations</h2>
            </div>

            {/* Create/Edit Form */}
            <form
              onSubmit={createDesignation}
              className="mb-8 bg-zinc-50 border border-zinc-200 rounded-2xl p-6"
            >
              <div className="space-y-4 mb-5">
                <input
                  type="text"
                  placeholder="Designation Title (e.g. Senior Manager)"
                  value={desigTitle}
                  onChange={(e) => setDesigTitle(e.target.value)}
                  className="bg-white border border-zinc-300 rounded-xl px-4 py-3 w-full focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition"
                  required
                />
                <input
                  type="text"
                  placeholder="Grade (optional, e.g. L3, M2)"
                  value={desigGrade}
                  onChange={(e) => setDesigGrade(e.target.value.toUpperCase())}
                  className="bg-white border border-zinc-300 rounded-xl px-4 py-3 w-full focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                {editingDesig ? "Update Designation" : "Create Designation"}
              </button>
              {editingDesig && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDesig(null);
                    setDesigTitle("");
                    setDesigGrade("");
                  }}
                  className="w-full mt-3 py-3 text-zinc-600 hover:bg-zinc-100 rounded-2xl font-medium transition"
                >
                  Cancel
                </button>
              )}
            </form>

            {/* List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {designations.length === 0 ? (
                <p className="text-center text-zinc-500 py-12">No designations found</p>
              ) : (
                designations.map((desig) => (
                  <div
                    key={desig.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-lg">{desig.title}</h4>
                      {desig.grade && (
                        <p className="text-sm text-zinc-500">Grade: {desig.grade}</p>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-90 group-hover:opacity-100">
                      <button
                        onClick={() => startEditDesig(desig)}
                        className="p-3 hover:bg-violet-50 rounded-xl transition text-violet-600 hover:text-violet-700"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteDesignation(desig.id)}
                        className="p-3 hover:bg-red-50 rounded-xl transition text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}