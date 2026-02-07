import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Building, Check, X } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    plan_tier: "enterprise",
    email: "",
    phone: "",
    address: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Subdomain check (demo - replace with real API later)
  useEffect(() => {
    const checkSubdomain = async () => {
      if (formData.subdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }
      setCheckingSubdomain(true);
      try {
        await new Promise((res) => setTimeout(res, 500));
        const isAvailable = /^[a-zA-Z0-9-]+$/.test(formData.subdomain);
        setSubdomainAvailable(isAvailable);
      } finally {
        setCheckingSubdomain(false);
      }
    };
    const timeoutId = setTimeout(checkSubdomain, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.subdomain]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim())
      return setError("Organization name is required") && false;
    if (!formData.subdomain.trim())
      return setError("Subdomain is required") && false;
    if (formData.subdomain.length < 3)
      return setError("Subdomain must be at least 3 characters") && false;
    if (!/^[\w-]+$/.test(formData.subdomain))
      return setError("Subdomain can only contain letters, numbers, and hyphens") && false;
    if (!formData.email.trim())
      return setError("Organization email is required") && false;
    if (!formData.admin_first_name.trim())
      return setError("Admin first name is required") && false;
    if (!formData.admin_email.trim())
      return setError("Admin email is required") && false;
    if (!formData.admin_password)
      return setError("Admin password is required") && false;
    if (formData.admin_password.length < 8)
      return setError("Password must be at least 8 characters") && false;
    if (formData.admin_password !== formData.confirm_password)
      return setError("Passwords do not match") && false;
    if (subdomainAvailable === false)
      return setError("Subdomain is not valid or unavailable") && false;
    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  if (!validateForm()) {
    setLoading(false);
    return;
  }

  try {
    // Send FLAT payload to match serializer expecting individual fields
    const payload = {
      name: formData.name.trim(),
      subdomain: formData.subdomain.trim().toLowerCase(),
      plan_tier: formData.plan_tier,
      email: formData.email.trim(),                    // organization email
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      admin_first_name: formData.admin_first_name.trim(),
      admin_last_name: formData.admin_last_name.trim(),
      admin_email: formData.admin_email.trim(),
      admin_password: formData.admin_password,
    };

    console.log("Sending data:", payload);

    const response = await fetch(
      `${API_BASE_URL}/api/organizations/register/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok || data.success) {
      navigate("/login", {
        state: {
          message: "Organization registered successfully! Please login with your admin credentials.",
        },
      });
    } else {
      // Show detailed validation errors
      if (data) {
        const errors = Object.keys(data)
          .map((key) => `${key}: ${data[key].join(", ")}`)
          .join(" | ");
        setError(errors || "Registration failed");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  } catch (err) {
    console.error("Registration error:", err);
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const getSubdomainStatus = () => {
    if (!formData.subdomain) return null;
    if (checkingSubdomain)
      return (
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      );
    if (subdomainAvailable) return <Check className="w-4 h-4 text-green-400" />;
    if (subdomainAvailable === false)
      return <X className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-mono">
      <div className="max-w-2xl w-full bg-gray-900/40 backdrop-blur-md border border-cyan-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-cyan-500/30 p-3 rounded-2xl shadow-lg">
              <Building className="w-8 h-8 text-cyan-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-pink-400 mb-2">
            Create Your Organization
          </h1>
          <p className="text-cyan-300">
            Set up your main organization and admin account
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-700/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Organization Information */}
          <div className="border-b border-cyan-800 pb-6">
            <h3 className="text-lg font-medium text-pink-400 mb-4">
              Organization Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Subdomain *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="subdomain"
                    required
                    value={formData.subdomain}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 pr-10"
                    placeholder="company-name"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getSubdomainStatus()}
                  </div>
                </div>
                <p className="text-xs text-cyan-400 mt-1">
                  {formData.subdomain && (
                    <span>
                      Your URL: <strong>{formData.subdomain}.erp.com</strong>
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Plan Tier
                </label>
                <select
                  name="plan_tier"
                  value={formData.plan_tier}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                >
                  <option value="basic">Basic</option>
                  <option value="advance">Advance</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Address
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                placeholder="Enter organization address"
              />
            </div>
          </div>

          {/* Admin Account */}
          <div>
            <h3 className="text-lg font-medium text-pink-400 mb-4">
              Admin Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="admin_first_name"
                  required
                  value={formData.admin_first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="admin_last_name"
                  value={formData.admin_last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="Doe"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Admin Email *
                </label>
                <input
                  type="email"
                  name="admin_email"
                  required
                  value={formData.admin_email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                  placeholder="admin@company.com"
                />
              </div>

              {/* Passwords */}
              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="admin_password"
                    required
                    value={formData.admin_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-300 hover:text-pink-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 pr-10"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-300 hover:text-pink-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-gray-950 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus size={20} />
            )}
            {loading ? "Creating Organization..." : "Create Organization"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-cyan-300">
          <p>
            Already have an organization?{" "}
            <Link
              to="/login"
              className="text-pink-400 hover:text-pink-500 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;