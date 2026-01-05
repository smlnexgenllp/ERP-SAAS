import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  Building2,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
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
    if (
      !window.confirm("Delete this department? Employees will lose assignment.")
    )
      return;
    try {
      await api.delete(`/hr/departments/${id}/`);
      showAlert("Department deleted");
      fetchData();
    } catch (err) {
      showAlert("Cannot delete: Used by employees", "error");
    }
  };

  const deleteDesignation = async (id) => {
    if (!window.confirm("Delete this designation?")) return;
    try {
      await api.delete(`/hr/designations/${id}/`);
      showAlert("Designation deleted");
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
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-2xl text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black text-cyan-200 py-8 px-8">
      {/* Alert */}
      {alert.show && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl z-50 font-medium ${
            alert.type === "error"
              ? "bg-red-900/80 border border-red-600 text-red-200"
              : "bg-green-900/80 border border-green-600 text-green-200"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
          Department & Designation Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
        {/* Departments Section */}
        <div className="bg-gray-900/50 backdrop-blur border border-cyan-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Building2 className="w-10 h-10 text-cyan-400" />
            <h2 className="text-3xl font-bold text-cyan-300">Departments</h2>
          </div>

          {/* Create/Edit Form */}
          <form
            onSubmit={createDepartment}
            className="mb-8 bg-gray-800/50 rounded-2xl p-6 border border-cyan-700/50"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Department Name"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-200 placeholder-gray-500 focus:border-cyan-400 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Code (e.g. PDC)"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                className="bg-gray-900 border border-cyan-700 rounded-lg px-4 py-3 text-cyan-200 placeholder-gray-500 focus:border-cyan-400 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-lg font-bold hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
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
                className="w-full mt-2 bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
          </form>

          {/* List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {departments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No departments yet
              </p>
            ) : (
              departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-gray-800/60 border border-cyan-800/40 rounded-xl p-4 flex items-center justify-between hover:border-cyan-500 transition"
                >
                  <div>
                    <h4 className="font-semibold text-cyan-200">{dept.name}</h4>
                    <p className="text-sm text-gray-400">Code: {dept.code}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditDept(dept)}
                      className="p-2 bg-blue-900/50 rounded-lg hover:bg-blue-800 transition"
                    >
                      <Edit2 className="w-5 h-5 text-blue-300" />
                    </button>
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="p-2 bg-red-900/50 rounded-lg hover:bg-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5 text-red-300" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Designations Section */}
        <div className="bg-gray-900/50 backdrop-blur border border-cyan-800/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Briefcase className="w-10 h-10 text-pink-400" />
            <h2 className="text-3xl font-bold text-pink-300">Designations</h2>
          </div>

          {/* Create/Edit Form */}
          <form
            onSubmit={createDesignation}
            className="mb-8 bg-gray-800/50 rounded-2xl p-6 border border-pink-700/50"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Title (e.g. Manager)"
                value={desigTitle}
                onChange={(e) => setDesigTitle(e.target.value)}
                className="bg-gray-900 border border-pink-700 rounded-lg px-4 py-3 text-pink-200 placeholder-gray-500 focus:border-pink-400 outline-none col-span-2"
                required
              />
              <input
                type="text"
                placeholder="Grade (optional, e.g. L1)"
                value={desigGrade}
                onChange={(e) => setDesigGrade(e.target.value.toUpperCase())}
                className="bg-gray-900 border border-pink-700 rounded-lg px-4 py-3 text-pink-200 placeholder-gray-500 focus:border-pink-400 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 py-3 rounded-lg font-bold hover:from-pink-500 hover:to-purple-500 transition-all flex items-center justify-center gap-2"
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
                className="w-full mt-2 bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            )}
          </form>

          {/* List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {designations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No designations yet
              </p>
            ) : (
              designations.map((desig) => (
                <div
                  key={desig.id}
                  className="bg-gray-800/60 border border-pink-800/40 rounded-xl p-4 flex items-center justify-between hover:border-pink-500 transition"
                >
                  <div>
                    <h4 className="font-semibold text-pink-200">
                      {desig.title}
                    </h4>
                    {desig.grade && (
                      <p className="text-sm text-gray-400">
                        Grade: {desig.grade}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEditDesig(desig)}
                      className="p-2 bg-purple-900/50 rounded-lg hover:bg-purple-800 transition"
                    >
                      <Edit2 className="w-5 h-5 text-purple-300" />
                    </button>
                    <button
                      onClick={() => deleteDesignation(desig.id)}
                      className="p-2 bg-red-900/50 rounded-lg hover:bg-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5 text-red-300" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
