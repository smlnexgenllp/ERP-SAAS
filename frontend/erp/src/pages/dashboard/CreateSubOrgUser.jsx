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
    role: "Employee", // Must match backend ROLE_CHOICES exactly
    modules: [],
  });

  // Backend-expected roles
  const roles = [
    { value: "Admin", label: "Admin" },
    { value: "HR Manager", label: "HR Manager" },
    { value: "Employee", label: "Employee" },
    { value: "Manager", label: "Manager" },
    { value: "MD", label: "MD" },
    { value: "Team Lead", label: "Team Lead" },
    {value:"Accounts Manager", label: "Accounts Manager"},
  ];

  // Fetch modules
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
    // Validation
    if (!form.first_name || !form.email || !form.password) {
      alert("First name, email, and password are required.");
      return;
    }
    if (form.modules.length === 0) {
      alert("Select at least one module for the user.");
      return;
    }

    setLoading(true);

    // DEBUG: check payload
    console.log("Submitting payload:", JSON.stringify(form));

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
      if (err.response?.data) {
        console.error("Backend errors:", err.response.data);
      }
      alert("Something went wrong while creating user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-black w-[500px] rounded-xl shadow-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute right-3 top-3 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold mb-4">Create User for Sub-Organization</h2>
        {/* First Name */}
        <label className="block mb-2 font-medium">First Name</label>
        <input
          type="text"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />

        {/* Last Name */}
        <label className="block mb-2 font-medium">Last Name</label>
        <input
          type="text"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />

        {/* Email */}
        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />

        {/* Password */}
        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        />

        {/* Role */}
        <label className="block mb-2 font-medium">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-4"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {/* Modules */}
        <label className="block mb-2 font-medium">Assign Modules</label>
        {modules.length === 0 && <p className="mb-4 text-gray-500">No modules available.</p>}
        <div className="mb-4 max-h-40 overflow-y-auto border p-2 rounded">
          {modules.map((m) => (
            <label key={m.code} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={form.modules.includes(m.code)}
                onChange={() => handleModuleToggle(m.code)}
                className="mr-2"
              />
              {m.name}
            </label>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
}
