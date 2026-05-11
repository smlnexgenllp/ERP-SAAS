import React, { useState, useEffect } from "react";
import { createSubOrgUser } from "../../../src/services/api";
import { moduleService } from "../../../src/services/moduleService";
import { X } from "lucide-react";

export default function CreateSubOrgUserModal({ isOpen, onClose, subOrgId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "Employee",
    modules: [],
  });

  const roles = [
    { value: "Admin", label: "Admin" },
    { value: "HR Manager", label: "HR Manager" },
    { value: "Employee", label: "Employee" },
    { value: "Manager", label: "Manager" },
    { value: "MD", label: "MD" },
    { value: "Team Lead", label: "Team Lead" },
    { value: "Accounts Manager", label: "Accounts Manager" },
    { value: "Sales Head", label: "Sales Head" },
  ];

  useEffect(() => {
    const fetchModules = async () => {
      const res = await moduleService.getAvailableModules("sub");
      setModules(res || []);
    };
    if (isOpen) fetchModules();
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleModuleToggle = (code) => {
    setForm((prev) => {
      const selected = prev.modules.includes(code)
        ? prev.modules.filter((m) => m !== code)
        : [...prev.modules, code];
      return { ...prev, modules: selected };
    });
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.email || !form.password) {
      alert("First name, email, and password are required.");
      return;
    }
    if (form.modules.length === 0) {
      alert("Select at least one module for the user.");
      return;
    }

    setLoading(true);

    try {
      const res = await createSubOrgUser(subOrgId, form);
      if (res.success) {
        alert("User created successfully!");
        onSuccess?.();
        onClose();
      } else {
        alert(res.error || JSON.stringify(res.errors));
      }
    } catch (err) {
      console.error("Create Sub-Org User Error:", err);
      alert("Something went wrong while creating user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          className="absolute right-6 top-6 text-zinc-400 hover:text-zinc-600 transition"
          onClick={onClose}
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-zinc-900 mb-6">
          Create New User
        </h2>

        {/* First Name */}
        <div className="mb-5">
          <label className="block text-zinc-700 font-medium mb-2">First Name *</label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
            placeholder="Enter first name"
          />
        </div>

        {/* Last Name */}
        <div className="mb-5">
          <label className="block text-zinc-700 font-medium mb-2">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
            placeholder="Enter last name"
          />
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-zinc-700 font-medium mb-2">Email Address *</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
            placeholder="user@example.com"
          />
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-zinc-700 font-medium mb-2">Password *</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none"
            placeholder="Create a strong password"
          />
        </div>

        {/* Role */}
        <div className="mb-5">
          <label className="block text-zinc-700 font-medium mb-2">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-zinc-200 rounded-2xl focus:border-emerald-500 outline-none bg-white"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Modules */}
        <div className="mb-6">
          <label className="block text-zinc-700 font-medium mb-3">Assign Modules *</label>
          
          {modules.length === 0 && (
            <p className="text-zinc-500 text-sm">No modules available.</p>
          )}

          <div className="max-h-52 overflow-y-auto border border-zinc-200 rounded-2xl p-4 space-y-2">
            {modules.map((m) => (
              <label
                key={m.code}
                className="flex items-center gap-3 px-2 py-2 hover:bg-zinc-50 rounded-xl cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.modules.includes(m.code)}
                  onChange={() => handleModuleToggle(m.code)}
                  className="w-5 h-5 accent-emerald-600"
                />
                <span className="text-zinc-800">{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3.5 rounded-2xl font-semibold transition"
        >
          {loading ? "Creating User..." : "Create User"}
        </button>
      </div>
    </div>
  );
}