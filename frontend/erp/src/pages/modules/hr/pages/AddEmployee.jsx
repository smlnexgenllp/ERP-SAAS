// THEMED AddEmployee - Full Width
import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import axios from "axios";
import {
  UserPlus,
  Save,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);
const useAuth = () => {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockUser = {
        id: "user-001",
        isAuthenticated: true,
        role: "hr",
      };
      setUser(mockUser);
      setIsLoadingAuth(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isLoadingAuth,
  };
};

const roleOptions = [
  { value: "employee", label: "Employee" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

const AddEmployee = () => {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const AUTHORIZED_ROLES = ["hr", "admin"];
  const isAuthorized = user && AUTHORIZED_ROLES.includes(user.role);

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
    if (!isAuthorized) return;
    setLoadingData(true);
    setError(null);
    try {
      const [deptRes, desigRes] = await Promise.all([
        axios.get('/api/hr/departments/'),
        axios.get('/api/hr/designations/')
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
      setError("Unable to load departments/designations. Are you logged in as HR?");
      setDepartments([]);
      setDesignations([]);
    } finally {
      setLoadingData(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthorized) {
      fetchDependencies();
    }
  }, [isLoadingAuth, isAuthorized, fetchDependencies]);

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
      department_id: formData.department_id || null,
      designation_id: formData.designation_id || null,
      date_of_joining: formData.date_of_joining || null,
      is_probation: formData.is_probation,
      ctc: formData.ctc ? parseFloat(formData.ctc) : null,
      notes: formData.notes || "",
    };

    try {
      const getCsrfToken = () => {
        const name = "csrftoken";
        const cookies = document.cookie.split("; ");
        for (let cookie of cookies) {
          const [key, value] = cookie.split("=");
          if (key === name) return decodeURIComponent(value);
        }
        return null;
      };

      const response = await axios.post(
        "/api/hr/employees/create_with_invite/",
        payload,
        {
          headers: {
            "X-CSRFToken": getCsrfToken(),
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setSuccessMessage(
        `Employee ${response.data.employee.full_name} created successfully! ` +
        `Invitation email sent to ${response.data.employee.email || payload.user_email}`
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
      console.error("Employee Creation Error:", err.response || err);

      let errorMsg = "An unexpected error occurred. Check server connectivity.";

      if (err.response?.data) {
        const data = err.response.data;
        if (data.errors) {
          errorMsg = Object.entries(data.errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
        } else if (typeof data === "object") {
          errorMsg = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join(" | ");
        } else {
          errorMsg = data.detail || data.message || JSON.stringify(data);
        }
      }

      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950 text-cyan-300 text-xl">
        <Loader2 className="animate-spin mr-3" />
        Checking user permissions...
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950 text-cyan-300">
        <div className="text-center p-8 w-full max-w-3xl bg-gray-900 border border-cyan-800 rounded-xl shadow-lg">
          <Ban className="w-12 h-12 mx-auto text-pink-400 mb-4" />
          <h1 className="text-2xl font-bold text-cyan-300 mb-2">Access Denied</h1>
          <p className="text-gray-400">
            You must be an HR or Administrator to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">Current Role: {user?.role || "Guest"}</p>
        </div>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-950 text-cyan-300 text-xl">
        <Loader2 className="animate-spin mr-3" />
        Loading Departments and Designations...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-950 text-cyan-300 font-mono py-10 px-4">
      <div className="flex items-center justify-between mb-8 w-full max-w-full">
        <h1 className="text-3xl font-bold flex items-center text-pink-400">
          <UserPlus className="w-8 h-8 mr-3 text-cyan-400" />
          Add New Employee
        </h1>
        <button
          onClick={() => navigate("/hr/dashboard")}
          className="flex items-center text-sm font-medium text-cyan-300 hover:text-pink-400 transition-colors"
        >
          <ArrowLeft  className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      {successMessage && (
        <div className="bg-gray-900 border border-cyan-800 text-cyan-300 px-4 py-3 rounded-lg mb-4 flex items-center w-full max-w-full">
          <Save className="w-5 h-5 mr-3 flex-shrink-0 text-pink-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-gray-900 border border-pink-400 text-pink-400 px-4 py-3 rounded-lg mb-4 flex items-center w-full max-w-full">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-cyan-800 rounded-xl p-8 space-y-8 shadow-lg w-full"
      >
        {/* Personal Section */}
        <div>
          <h2 className="text-xl font-semibold text-pink-400 border-b border-cyan-800 pb-2 mb-6">
            Personal & User Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <InputGroup
              label="Full Name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <InputGroup
              label="Email (Login ID)"
              name="user_email"
              type="email"
              value={formData.user_email}
              onChange={handleChange}
              required
              hint="Invitation and temporary password will be sent here."
            />
            <InputGroup
              label="Employee Code"
              name="employee_code"
              type="text"
              value={formData.employee_code}
              onChange={handleChange}
              required
            />
            <InputGroup
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Organizational Section */}
        <div>
          <h2 className="text-xl font-semibold text-pink-400 border-b border-cyan-800 pb-2 mb-6">
            Organizational & Compensation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <SelectGroup
              label="Department"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              options={departments}
              valueKey="id"
              labelKey="name"
              placeholder="-- Select Department --"
            />
            <SelectGroup
              label="Designation"
              name="designation_id"
              value={formData.designation_id}
              onChange={handleChange}
              options={designations}
              valueKey="id"
              labelKey="title"
              placeholder="-- Select Designation --"
            />
            <SelectGroup
              label="System Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              options={roleOptions}
              valueKey="value"
              labelKey="label"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
            <InputGroup
              label="Date of Joining"
              name="date_of_joining"
              type="date"
              value={formData.date_of_joining}
              onChange={handleChange}
            />
            <InputGroup
              label="CTC (Annual)"
              name="ctc"
              type="number"
              step="0.01"
              value={formData.ctc}
              onChange={handleChange}
              placeholder="e.g., 50000.00"
            />
            <div className="flex items-end pb-1">
              <label
                htmlFor="is_probation"
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="is_probation"
                  id="is_probation"
                  checked={formData.is_probation}
                  onChange={handleChange}
                  className="h-5 w-5 text-cyan-400 border-gray-700 rounded focus:ring-cyan-500 transition-colors"
                />
                <span className="text-sm font-medium text-cyan-300 select-none">
                  Currently on Probation
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-cyan-300"
          >
            Notes (Internal HR Only)
          </label>
          <textarea
            name="notes"
            id="notes"
            rows="3"
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full border border-cyan-800 rounded-md shadow-sm p-3 bg-gray-950 text-cyan-300 resize-none focus:ring-cyan-400 focus:border-cyan-400"
          ></textarea>
        </div>

        <div className="pt-6 border-t border-cyan-800 mt-8 flex justify-end w-full">
          <button
            type="submit"
            disabled={isSubmitting || loadingData}
            className={`inline-flex items-center px-8 py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 w-full md:w-auto
              ${
                isSubmitting || loadingData
                  ? "bg-gray-800 cursor-not-allowed text-gray-500"
                  : "bg-gradient-to-r from-cyan-400 to-pink-400 text-gray-900 hover:from-cyan-300 hover:to-pink-300"
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="-ml-1 mr-3 h-5 w-5" />
                Create Employee & Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const InputGroup = ({ label, name, type, value, onChange, required, hint, step, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-cyan-300">
      {label} {required && <span className="text-pink-400">*</span>}
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
      className="mt-1 block w-full border border-cyan-800 rounded-md shadow-sm p-3 bg-gray-950 text-cyan-300 focus:ring-cyan-400 focus:border-cyan-400"
    />
    {hint && <p className="mt-1 text-xs text-pink-400">{hint}</p>}
  </div>
);

const SelectGroup = ({ label, name, value, onChange, required, options = [], valueKey, labelKey, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-cyan-300">
      {label} {required && <span className="text-pink-400">*</span>}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      required={required}
      className="mt-1 block w-full border border-cyan-800 rounded-md shadow-sm p-3 bg-gray-950 text-cyan-300 cursor-pointer focus:ring-cyan-400 focus:border-cyan-400"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {Array.isArray(options) && options.length > 0 ? (
        options.map((option) => (
          <option key={option[valueKey]} value={option[valueKey]} className="bg-gray-950 text-cyan-300">
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
