// src/pages/modules/hr/DepartmentDesignationManagement.jsx

import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  Building2,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

export default function DepartmentDesignationManagement() {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("departments");

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDesigModal, setShowDesigModal] = useState(false);

  // Department Form
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  // Designation Form
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

    setTimeout(() => {
      setAlert({
        show: false,
        message: "",
        type: "success",
      });
    }, 4000);
  };

  /* ================= FETCH ================= */

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

  /* ================= DEPARTMENT ================= */

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

      resetDepartmentForm();
      fetchData();
    } catch (err) {
      showAlert("Operation failed. Check code uniqueness.", "error");
    }
  };

  const deleteDepartment = async (id) => {
    if (
      !window.confirm(
        "Delete this department? Employees will lose assignment."
      )
    )
      return;

    try {
      await api.delete(`/hr/departments/${id}/`);

      showAlert("Department deleted successfully");
      fetchData();
    } catch (err) {
      showAlert("Cannot delete: Used by employees", "error");
    }
  };

  const startEditDept = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setShowDeptModal(true);
  };

  const resetDepartmentForm = () => {
    setDeptName("");
    setDeptCode("");
    setEditingDept(null);
    setShowDeptModal(false);
  };

  /* ================= DESIGNATION ================= */

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

      resetDesignationForm();
      fetchData();
    } catch (err) {
      showAlert("Operation failed. Title must be unique.", "error");
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

  const startEditDesig = (desig) => {
    setEditingDesig(desig);
    setDesigTitle(desig.title);
    setDesigGrade(desig.grade || "");
    setShowDesigModal(true);
  };

  const resetDesignationForm = () => {
    setDesigTitle("");
    setDesigGrade("");
    setEditingDesig(null);
    setShowDesigModal(false);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>

          <p className="mt-4 text-zinc-500 font-medium">
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-zinc-100 p-6">
      {/* ALERT */}
      {alert.show && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-xl border font-medium ${
            alert.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
              Organization Management
            </h1>

            <p className="text-zinc-500 mt-2">
              Manage departments and designations
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition ${
              activeTab === "departments"
                ? "bg-zinc-900 text-white shadow-lg"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Building2 className="w-5 h-5" />
            Departments
          </button>

          <button
            onClick={() => setActiveTab("designations")}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition ${
              activeTab === "designations"
                ? "bg-zinc-900 text-white shadow-lg"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Designations
          </button>
        </div>

        {/* ================= DEPARTMENTS ================= */}
        {activeTab === "departments" && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-zinc-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Departments
                  </h2>

                  <p className="text-zinc-500">
                    Manage organization departments
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  resetDepartmentForm();
                  setShowDeptModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Add Department
              </button>
            </div>

            <div className="p-8">
              {departments.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-500 text-lg">
                    No departments found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex items-center justify-between hover:bg-white hover:shadow-sm transition"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          {dept.name}
                        </h3>

                        <p className="text-zinc-500 mt-1">
                          Code: {dept.code}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditDept(dept)}
                          className="w-12 h-12 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => deleteDepartment(dept.id)}
                          className="w-12 h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= DESIGNATIONS ================= */}
        {activeTab === "designations" && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-zinc-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-violet-100 flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-violet-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Designations
                  </h2>

                  <p className="text-zinc-500">
                    Manage employee designations
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  resetDesignationForm();
                  setShowDesigModal(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition"
              >
                <Plus className="w-5 h-5" />
                Add Designation
              </button>
            </div>

            <div className="p-8">
              {designations.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-500 text-lg">
                    No designations found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {designations.map((desig) => (
                    <div
                      key={desig.id}
                      className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex items-center justify-between hover:bg-white hover:shadow-sm transition"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-zinc-900">
                          {desig.title}
                        </h3>

                        {desig.grade && (
                          <p className="text-zinc-500 mt-1">
                            Grade: {desig.grade}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditDesig(desig)}
                          className="w-12 h-12 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-600 flex items-center justify-center transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => deleteDesignation(desig.id)}
                          className="w-12 h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= DEPARTMENT MODAL ================= */}

      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-zinc-200">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {editingDept
                    ? "Update Department"
                    : "Create Department"}
                </h2>

                <p className="text-zinc-500 mt-1">
                  Manage department information
                </p>
              </div>

              <button
                onClick={resetDepartmentForm}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-zinc-700" />
              </button>
            </div>

            <form
              onSubmit={createDepartment}
              className="p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Department Name
                </label>

                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="Enter department name"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-zinc-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Department Code
                </label>

                <input
                  type="text"
                  value={deptCode}
                  onChange={(e) =>
                    setDeptCode(e.target.value.toUpperCase())
                  }
                  placeholder="HR / FIN / DEV"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-zinc-200"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition"
              >
                {editingDept
                  ? "Update Department"
                  : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= DESIGNATION MODAL ================= */}

      {showDesigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-zinc-200">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900">
                  {editingDesig
                    ? "Update Designation"
                    : "Create Designation"}
                </h2>

                <p className="text-zinc-500 mt-1">
                  Manage designation information
                </p>
              </div>

              <button
                onClick={resetDesignationForm}
                className="w-12 h-12 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition"
              >
                <X className="w-5 h-5 text-zinc-700" />
              </button>
            </div>

            <form
              onSubmit={createDesignation}
              className="p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Designation Title
                </label>

                <input
                  type="text"
                  value={desigTitle}
                  onChange={(e) => setDesigTitle(e.target.value)}
                  placeholder="Senior Developer"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-zinc-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-2">
                  Grade
                </label>

                <input
                  type="text"
                  value={desigGrade}
                  onChange={(e) =>
                    setDesigGrade(e.target.value.toUpperCase())
                  }
                  placeholder="L3 / M2"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-zinc-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition"
              >
                {editingDesig
                  ? "Update Designation"
                  : "Create Designation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}