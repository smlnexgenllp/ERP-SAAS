// src/pages/modules/hr/AddEmployee.jsx
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../../../../services/api";
import {
  UserPlus,
  Save,
  Loader2,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const roleOptions = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

const AddEmployee = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    employee_code: "",
    user_email: "",
    phone: "",
    role: "employee",
    department_id: "",
    designation_id: "",
    date_of_joining: new Date().toISOString().substring(0, 10),
    is_probation: false,
    ctc: "",
    notes: "",
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchDependencies = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [deptRes, desigRes] = await Promise.all([
        api.get('/hr/departments/'),
        api.get('/hr/designations/')
      ]);

      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
      setDesignations(Array.isArray(desigRes.data) ? desigRes.data : []);

      if (deptRes.data.length > 0) {
        setFormData(prev => ({ ...prev, department_id: deptRes.data[0].id }));
      }
      if (desigRes.data.length > 0) {
        setFormData(prev => ({ ...prev, designation_id: desigRes.data[0].id }));
      }
    } catch (err) {
      console.error("API Error:", err.response?.data);
      setError("Unable to load departments/designations.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (!formData.full_name || !formData.employee_code || !formData.user_email) {
      setError("Full Name, Employee Code, and Email are required fields.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      full_name: formData.full_name,
      employee_code: formData.employee_code,
      user_email: formData.user_email,
      phone: formData.phone || null,
      role: formData.role,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      designation_id: formData.designation_id ? Number(formData.designation_id) : null,
      date_of_joining: formData.date_of_joining || null,
      is_probation: formData.is_probation,
      ctc: formData.ctc ? parseFloat(formData.ctc) : null,
      notes: formData.notes || "",
    };

    try {
      const response = await api.post("/hr/employees/create_with_invite/", payload);

      setSuccessMessage(
        `Employee ${response.data.employee.full_name} created successfully! Invitation email sent.`
      );

      setFormData({
        full_name: "",
        employee_code: "",
        user_email: "",
        phone: "",
        role: "employee",
        department_id: departments[0]?.id || "",
        designation_id: designations[0]?.id || "",
        date_of_joining: new Date().toISOString().substring(0, 10),
        is_probation: false,
        ctc: "",
        notes: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to create employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 py-10">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                Add New Employee
              </h1>
              <p className="text-zinc-500">Create account and send invitation</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/hr/dashboard")}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <Save className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Full Width Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-zinc-200 rounded-3xl p-10 shadow-sm w-full"
        >
          {/* Personal Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-6">
              Personal & User Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Full Name" name="full_name" type="text" value={formData.full_name} onChange={handleChange} required />
              <InputGroup label="Email (Login ID)" name="user_email" type="email" value={formData.user_email} onChange={handleChange} required />
              <InputGroup label="Employee Code" name="employee_code" type="text" value={formData.employee_code} onChange={handleChange} required />
              <InputGroup label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          {/* Organizational Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900 border-b border-zinc-100 pb-3 mb-6">
              Organizational & Compensation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectGroup label="Department" name="department_id" value={formData.department_id} onChange={handleChange} options={departments} valueKey="id" labelKey="name" />
              <SelectGroup label="Designation" name="designation_id" value={formData.designation_id} onChange={handleChange} options={designations} valueKey="id" labelKey="title" />
              <SelectGroup label="System Role" name="role" value={formData.role} onChange={handleChange} options={roleOptions} valueKey="value" labelKey="label" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <InputGroup label="Date of Joining" name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} />
              <InputGroup label="CTC (Annual)" name="ctc" type="number" step="0.01" value={formData.ctc} onChange={handleChange} placeholder="e.g., 50000.00" />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_probation"
                    checked={formData.is_probation}
                    onChange={handleChange}
                    className="w-5 h-5 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-500"
                  />
                  <span className="text-zinc-700 font-medium">Currently on Probation</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-10">
            <label htmlFor="notes" className="block text-zinc-700 font-medium mb-2">
              Notes (Internal HR Only)
            </label>
            <textarea
              name="notes"
              id="notes"
              rows="5"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-zinc-200 rounded-3xl p-5 focus:border-zinc-400 outline-none resize-y min-h-[120px]"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-zinc-100">
            <button
              type="submit"
              disabled={isSubmitting || loadingData}
              className={`px-12 py-4 rounded-3xl font-semibold text-lg flex items-center gap-3 transition-all ${
                isSubmitting || loadingData
                  ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                  : "bg-zinc-900 hover:bg-black text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Creating Employee...
                </>
              ) : (
                <>
                  <Save size={24} />
                  Create Employee & Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* Reusable Components */
const InputGroup = ({ label, name, type, value, onChange, required, hint, step, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-zinc-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      required={required}
      step={step}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full border border-zinc-200 rounded-3xl px-5 py-4 focus:border-zinc-400 outline-none transition"
    />
    {hint && <p className="mt-1 text-xs text-amber-600">{hint}</p>}
  </div>
);

const SelectGroup = ({ label, name, value, onChange, required, options = [], valueKey, labelKey, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-zinc-700 text-sm font-medium mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full border border-zinc-200 rounded-3xl px-5 py-4 focus:border-zinc-400 outline-none bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {Array.isArray(options) && options.length > 0 ? (
        options.map((option) => (
          <option key={option[valueKey]} value={option[valueKey]}>
            {option[labelKey]}
          </option>
        ))
      ) : (
        <option disabled>No options available</option>
      )}
    </select>
  </div>
);

export default AddEmployee;