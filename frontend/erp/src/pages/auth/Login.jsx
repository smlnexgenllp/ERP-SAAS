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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-mono">
      <div className="max-w-md w-full bg-gray-900/40 backdrop-blur-md border border-cyan-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-cyan-500/30 p-3 rounded-2xl shadow-lg">
              <Building className="w-8 h-8 text-cyan-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-pink-400 mb-2">ERP System</h1>
          <p className="text-cyan-300">Sign in to your organization dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-700/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Email or Username
            </label>
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors"
              placeholder="Enter your email or username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-cyan-700 bg-gray-900/20 text-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-colors pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyan-300 hover:text-pink-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
              <LogIn size={20} />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-gray-900/30 border border-cyan-800 rounded-lg text-center">
          <h3 className="text-sm font-medium text-pink-400 mb-2">Demo Credentials</h3>
          <p className="text-cyan-300 text-sm">Use your main organization admin credentials</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
