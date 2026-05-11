import React, { useState, useEffect } from "react";
import { createSubOrgUser } from "../../../src/services/api";
import { moduleService } from "../../../src/services/moduleService";
import { X } from "lucide-react";

export default function CreateSubOrgUserModal({
  isOpen,
  onClose,
  subOrgId,
  onSuccess,
}) {
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

  // Backend-expected roles
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

  // Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      const res = await moduleService.getAvailableModules("sub");
      setModules(res || []);
    };

    if (isOpen) fetchModules();
  }, [isOpen]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleModuleToggle = (code) => {
    setForm((prev) => {
      const selected = prev.modules.includes(code)
        ? prev.modules.filter((m) => m !== code)
        : [...prev.modules, code];

      return {
        ...prev,
        modules: selected,
      };
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

    console.log(
      "Submitting payload:",
      JSON.stringify(form)
    );

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
        console.error(
          "Backend errors:",
          err.response.data
        );
      }

      alert("Something went wrong while creating user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* CLOSE BUTTON */}
        <button
          className="absolute right-5 top-5 w-10 h-10 rounded-2xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition"
          onClick={onClose}
        >
          <X
            size={18}
            className="text-zinc-700"
          />
        </button>

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-zinc-200">
          <h2 className="text-2xl font-bold text-zinc-900">
            Create User
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Create a new user for your sub-organization
          </p>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-6">

          {/* NAME ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* FIRST NAME */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                First Name
              </label>

              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full border border-zinc-200 bg-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-800"
                placeholder="Enter first name"
              />
            </div>

            {/* LAST NAME */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Last Name
              </label>

              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full border border-zinc-200 bg-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-800"
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-zinc-200 bg-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-800"
              placeholder="Enter email address"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-zinc-200 bg-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-800"
              placeholder="Enter password"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              User Role
            </label>

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-zinc-200 bg-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-800"
            >
              {roles.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                >
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* MODULES */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-3">
              Assign Modules
            </label>

            {modules.length === 0 ? (
              <div className="text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                No modules available.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-zinc-200 rounded-3xl p-5 bg-zinc-50">
                {modules.map((m) => (
                  <label
                    key={m.code}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                      form.modules.includes(m.code)
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.modules.includes(
                        m.code
                      )}
                      onChange={() =>
                        handleModuleToggle(m.code)
                      }
                      className="w-4 h-4 accent-black"
                    />

                    <span className="text-sm font-medium">
                      {m.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-zinc-200 bg-zinc-50">
          
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 font-medium transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-black disabled:opacity-50 text-white font-semibold transition"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}