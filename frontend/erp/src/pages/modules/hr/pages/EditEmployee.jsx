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
      const [empRes, allEmpRes, deptRes, desigRes] = await Promise.all([
        api.get(`/hr/employees/${employeeId}/`),
        api.get("/hr/employees/"),
        api.get("/hr/departments/"),
        api.get("/hr/designations/"),
      ]);

      setFormData({
        ...empRes.data,
        department: empRes.data.department || "",
        designation: empRes.data.designation || "",
        reporting_to: empRes.data.reporting_to || "",
        is_active: empRes.data.is_active === true || empRes.data.is_active === "true",
        is_probation: empRes.data.is_probation === true || empRes.data.is_probation === "false" ? false : true,
      });

      setEmployees(allEmpRes.data.results || allEmpRes.data);
      setDepartments(deptRes.data);
      setDesignations(desigRes.data);
      setLoading(false);
    };

    loadData();
  }, [employeeId]);

  /* ---------------- Handle Change ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        payload.append(key, value);
      }
    });

    await api.put(`/hr/employees/${employeeId}/`, payload);
    onSuccess();
  };

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
      <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} />
      <Input label="Email" name="email" value={formData.email} onChange={handleChange} />
      <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
      <Input label="CTC" name="ctc" value={formData.ctc || ""} onChange={handleChange} />

      <Select label="Department" name="department" value={formData.department} onChange={handleChange}>
        <option value="">—</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>

      <Select label="Designation" name="designation" value={formData.designation} onChange={handleChange}>
        <option value="">—</option>
        {designations.map(d => (
          <option key={d.id} value={d.id}>{d.title}</option>
        ))}
      </Select>

      <Select label="Reporting To" name="reporting_to" value={formData.reporting_to} onChange={handleChange}>
        <option value="">—</option>
        {employees
          .filter(e => e.id !== employeeId)
          .map(e => (
            <option key={e.id} value={e.id}>{e.full_name}</option>
          ))}
      </Select>

      <Input type="date" label="Date of Joining" name="date_of_joining" value={formData.date_of_joining || ""} onChange={handleChange} />
      <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth || ""} onChange={handleChange} />

      <label className="flex items-center gap-2 col-span-2">
        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
        Active
      </label>

      <label className="flex items-center gap-2 col-span-2">
        <input type="checkbox" name="is_probation" checked={formData.is_probation} onChange={handleChange} />
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
    <input {...props} className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200" />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-400">{label}</span>
    <select {...props} className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200">
      {children}
    </select>
  </label>
);
