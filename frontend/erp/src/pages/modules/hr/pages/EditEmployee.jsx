// src/pages/modules/hr/EditEmployee.jsx
import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  User,
  Mail,
  Phone,
  IndianRupee,
  Building2,
  Briefcase,
  Users,
  Calendar,
  Cake,
  Camera,
  CheckCircle2,
} from "lucide-react";

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
          key !== "photo"
        ) {
          form.append(key, formData[key]);
        }
      });

      if (formData.photo && typeof formData.photo !== "string") {
        form.append("photo", formData.photo);
      }

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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></div>
        <p className="text-zinc-500 mt-4 font-medium">
          Loading employee data...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* ================= PROFILE ================= */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-white">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                  <User className="w-12 h-12 text-zinc-400" />
                </div>
              )}
            </div>

            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">
              Employee Profile
            </h3>

            <p className="text-zinc-500 mb-6">
              Update employee information and account details
            </p>

            <label className="inline-flex">
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
              />

              <span className="px-5 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition cursor-pointer">
                Upload New Photo
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ================= BASIC DETAILS ================= */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900">
            Basic Information
          </h3>
          <p className="text-zinc-500 mt-1">
            Manage employee personal details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            icon={<User size={18} />}
            label="Full Name"
            name="full_name"
            value={formData.full_name || ""}
            onChange={handleChange}
          />

          <Input
            icon={<Mail size={18} />}
            label="Email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
          />

          <Input
            icon={<Phone size={18} />}
            label="Phone"
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
          />

          <Input
            icon={<IndianRupee size={18} />}
            label="CTC"
            name="ctc"
            value={formData.ctc || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================= ORGANIZATION ================= */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900">
            Organization Details
          </h3>
          <p className="text-zinc-500 mt-1">
            Department, designation and reporting structure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            icon={<Building2 size={18} />}
            label="Department"
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
          >
            <option value="">Select Department</option>

            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select
            icon={<Briefcase size={18} />}
            label="Designation"
            name="designation"
            value={formData.designation || ""}
            onChange={handleChange}
          >
            <option value="">Select Designation</option>

            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>

          <div className="md:col-span-2">
            <Select
              icon={<Users size={18} />}
              label="Reporting To"
              name="reporting_to"
              value={formData.reporting_to || ""}
              onChange={handleChange}
            >
              <option value="">Select Reporting Manager</option>

              {employees
                .filter((e) => e.id !== employeeId)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ================= DATES ================= */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900">
            Important Dates
          </h3>
          <p className="text-zinc-500 mt-1">
            Employee joining and birth information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="date"
            icon={<Calendar size={18} />}
            label="Date of Joining"
            name="date_of_joining"
            value={formData.date_of_joining || ""}
            onChange={handleChange}
          />

          <Input
            type="date"
            icon={<Cake size={18} />}
            label="Date of Birth"
            name="date_of_birth"
            value={formData.date_of_birth || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-zinc-900">
            Employee Status
          </h3>
          <p className="text-zinc-500 mt-1">
            Manage employee activity and probation state
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Checkbox
            label="Active Employee"
            name="is_active"
            checked={formData.is_active || false}
            onChange={handleChange}
          />

          <Checkbox
            label="Under Probation"
            name="is_probation"
            checked={formData.is_probation || false}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* ================= BUTTON ================= */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition-all shadow-lg">
          <CheckCircle2 size={20} />
          Save Changes
        </button>
      </div>
    </form>
  );
}

/* ================= INPUT ================= */

const Input = ({ label, icon, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-medium text-zinc-600">
      {label}
    </span>

    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </div>

      <input
        {...props}
        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-200 focus:border-zinc-400 transition"
      />
    </div>
  </label>
);

/* ================= SELECT ================= */

const Select = ({ label, icon, children, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-medium text-zinc-600">
      {label}
    </span>

    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 z-10">
        {icon}
      </div>

      <select
        {...props}
        className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-200 focus:border-zinc-400 transition"
      >
        {children}
      </select>
    </div>
  </label>
);

/* ================= CHECKBOX ================= */

const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 cursor-pointer hover:bg-zinc-100 transition">
    <input
      type="checkbox"
      {...props}
      className="w-5 h-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
    />

    <span className="font-medium text-zinc-700">
      {label}
    </span>
  </label>
);