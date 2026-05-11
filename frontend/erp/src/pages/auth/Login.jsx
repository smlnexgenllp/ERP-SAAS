import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Building } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData);
    if (!result.success) setError(result.error || "Invalid credentials");

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-3xl shadow-xl p-8"> {/* Reduced padding */}
        
        {/* Header - More Compact */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-3xl">
              <Building className="w-9 h-9 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 mb-1">ERP System</h1>
          <p className="text-zinc-600 text-sm">
            Sign in to your organization dashboard
          </p>
        </div>

        {/* Login Form - Reduced Spacing */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-zinc-700 font-medium mb-1.5">
              Email or Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-5 py-3.5 border border-zinc-200 bg-white rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder="Enter your email or username"
            />
          </div>

          <div>
            <label className="block text-zinc-700 font-medium mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3.5 border border-zinc-200 bg-white rounded-2xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-emerald-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-3 transition disabled:opacity-70 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Employee Login - Single Line */}
        <div className="mt-8 text-center text-sm">
          <p className="text-zinc-600">
            Employee Login?{" "}
            <button
              onClick={() => navigate("/employee_login")}
              className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition"
            >
              Click here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;