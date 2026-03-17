import React, { useEffect, useState } from "react";
import api from "../../../../services/api";

export default function EditEmployee({ employeeId, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch Data ---------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, allEmpRes, deptRes, desigRes] = await Promise.all([
          api.get(`/hr/employees/${employeeId}/`),
          api.get("/hr/employees/"),
          api.get("/hr/departments/"),
          api.get("/hr/designations/"),
        ]);

        setFormData({
          ...empRes.data,

          // ✅ FIX: send IDs only
          department: empRes.data.department?.id || "",
          designation: empRes.data.designation?.id || "",
          reporting_to: empRes.data.reporting_to?.id || "",

          // ✅ FIX: proper boolean conversion
          is_active: !!empRes.data.is_active,
          is_probation: !!empRes.data.is_probation,
        });

        setEmployees(allEmpRes.data.results || allEmpRes.data);
        setDepartments(deptRes.data);
        setDesignations(desigRes.data);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [employeeId]);

  /* ---------------- Handle Change ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Clone payload
    const payload = {
      ...formData,
      ctc: formData.ctc ? Number(formData.ctc) : null,
    };

    // 🚨 IMPORTANT FIX: remove photo if not file
    if (!formData.photo || typeof formData.photo === "string") {
      delete payload.photo;
    }

    try {
      console.log("Sending payload:", payload);

      await api.patch(`/hr/employees/${employeeId}/`, payload);

      onSuccess();
    } catch (err) {
      console.log("ERROR:", err.response?.data);
      alert(JSON.stringify(err.response?.data || "Update failed"));
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
      <Input
        label="Full Name"
        name="full_name"
        value={formData.full_name || ""}
        onChange={handleChange}
      />

      <Input
        label="Email"
        name="email"
        value={formData.email || ""}
        onChange={handleChange}
      />

      <Input
        label="Phone"
        name="phone"
        value={formData.phone || ""}
        onChange={handleChange}
      />

      <Input
        label="CTC"
        name="ctc"
        value={formData.ctc || ""}
        onChange={handleChange}
      />

      {/* Department */}
      <Select
        label="Department"
        name="department"
        value={formData.department || ""}
        onChange={handleChange}
      >
        <option value="">—</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>

      {/* Designation */}
      <Select
        label="Designation"
        name="designation"
        value={formData.designation || ""}
        onChange={handleChange}
      >
        <option value="">—</option>
        {designations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </Select>

      {/* Reporting To */}
      <Select
        label="Reporting To"
        name="reporting_to"
        value={formData.reporting_to || ""}
        onChange={handleChange}
      >
        <option value="">—</option>
        {employees
          .filter((e) => e.id !== employeeId)
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
      </Select>

      {/* Dates */}
      <Input
        type="date"
        label="Date of Joining"
        name="date_of_joining"
        value={formData.date_of_joining || ""}
        onChange={handleChange}
      />

      <Input
        type="date"
        label="Date of Birth"
        name="date_of_birth"
        value={formData.date_of_birth || ""}
        onChange={handleChange}
      />

      {/* Active */}
      <label className="flex items-center gap-2 col-span-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active || false}
          onChange={handleChange}
        />
        Active
      </label>

      {/* Probation */}
      <label className="flex items-center gap-2 col-span-2">
        <input
          type="checkbox"
          name="is_probation"
          checked={formData.is_probation || false}
          onChange={handleChange}
        />
        Probation
      </label>

      <button className="col-span-2 bg-emerald-600 text-black py-3 rounded-lg font-bold hover:bg-emerald-500">
        Save Changes
      </button>
    </form>
  );
}

/* ---------------- UI Helpers ---------------- */

const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-400">{label}</span>
    <input
      {...props}
      className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200"
    />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-400">{label}</span>
    <select
      {...props}
      className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200"
    >
      {children}
    </select>
  </label>
);