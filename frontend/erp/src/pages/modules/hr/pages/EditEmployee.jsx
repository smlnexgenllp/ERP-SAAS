import React, { useEffect, useState } from "react";
import api from "../../../../services/api";

export default function EditEmployee({ employeeId, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [photoPreview, setPhotoPreview] = useState(null);

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

        const emp = empRes.data;

        setFormData({
          ...emp,
          department: emp.department?.id || "",
          designation: emp.designation?.id || "",
          reporting_to: emp.reporting_to?.id || "",
          is_active: !!emp.is_active,
          is_probation: !!emp.is_probation,
        });

        // ✅ existing image preview
        if (emp.photo) {
          setPhotoPreview(emp.photo);
        }

        setEmployees(allEmpRes.data.results || allEmpRes.data);
        setDepartments(deptRes.data || []);
        setDesignations(desigRes.data || []);
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
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      const file = files[0];

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      if (file) {
        setPhotoPreview(URL.createObjectURL(file));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();

      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== null &&
          formData[key] !== undefined &&
          key !== "photo" // handled separately
        ) {
          form.append(key, formData[key]);
        }
      });

      // ✅ handle photo correctly
      if (formData.photo && typeof formData.photo !== "string") {
        form.append("photo", formData.photo);
      }

      // ✅ convert numeric fields
      if (formData.ctc) {
        form.set("ctc", Number(formData.ctc));
      }

      await api.patch(`/hr/employees/${employeeId}/`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onSuccess();
    } catch (err) {
      console.error("ERROR:", err.response?.data);
      alert(JSON.stringify(err.response?.data || "Update failed"));
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-10">
        Loading employee data...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-6 bg-slate-900 p-6 rounded-xl"
    >
      {/* ================= PROFILE IMAGE ================= */}
      <div className="col-span-2 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border border-cyan-600">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              No Image
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Upload Profile Image
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleChange}
            className="text-sm text-gray-300"
          />
        </div>
      </div>

      {/* ================= BASIC FIELDS ================= */}
      <Input label="Full Name" name="full_name" value={formData.full_name || ""} onChange={handleChange} />
      <Input label="Email" name="email" value={formData.email || ""} onChange={handleChange} />
      <Input label="Phone" name="phone" value={formData.phone || ""} onChange={handleChange} />
      <Input label="CTC" name="ctc" value={formData.ctc || ""} onChange={handleChange} />

      {/* ================= DROPDOWNS ================= */}
      <Select label="Department" name="department" value={formData.department || ""} onChange={handleChange}>
        <option value="">—</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </Select>

      <Select label="Designation" name="designation" value={formData.designation || ""} onChange={handleChange}>
        <option value="">—</option>
        {designations.map((d) => (
          <option key={d.id} value={d.id}>{d.title}</option>
        ))}
      </Select>

      <Select label="Reporting To" name="reporting_to" value={formData.reporting_to || ""} onChange={handleChange}>
        <option value="">—</option>
        {employees
          .filter((e) => e.id !== employeeId)
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
      </Select>

      {/* ================= DATES ================= */}
      <Input type="date" label="Date of Joining" name="date_of_joining" value={formData.date_of_joining || ""} onChange={handleChange} />
      <Input type="date" label="Date of Birth" name="date_of_birth" value={formData.date_of_birth || ""} onChange={handleChange} />

      {/* ================= CHECKBOX ================= */}
      <label className="flex items-center gap-2 col-span-2 text-gray-300">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active || false}
          onChange={handleChange}
        />
        Active
      </label>

      <label className="flex items-center gap-2 col-span-2 text-gray-300">
        <input
          type="checkbox"
          name="is_probation"
          checked={formData.is_probation || false}
          onChange={handleChange}
        />
        Probation
      </label>

      {/* ================= BUTTON ================= */}
      <button className="col-span-2 bg-emerald-600 text-black py-3 rounded-lg font-bold hover:bg-emerald-500 transition">
        Save Changes
      </button>
    </form>
  );
}

/* ================= UI HELPERS ================= */

const Input = ({ label, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-400">{label}</span>
    <input
      {...props}
      className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
    />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="flex flex-col gap-1">
    <span className="text-sm text-gray-400">{label}</span>
    <select
      {...props}
      className="bg-gray-800 border border-cyan-700 rounded px-3 py-2 text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
    >
      {children}
    </select>
  </label>
);