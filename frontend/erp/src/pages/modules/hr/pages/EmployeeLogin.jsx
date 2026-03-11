import React, { useState } from "react";
import api from "../../../../services/api"; // ← make sure you're importing your configured api
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";

export default function EmployeeLogin() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      // 1. Perform login (creates session cookie)
      await api.post("/auth/employee-login/", {
        email,
        password,
      });

      // 2. Immediately verify / fetch current user using SAME api instance
      //    → this ensures the cookie is attached and available
      const userResponse = await api.get("/auth/current-user/");

      // Optional: you can store or use the user data here
      console.log("Logged in user:", userResponse.data);

      // 3. Only navigate after successful current-user check
      navigate("/profile"); // ← or "/dashboard", "/home", etc.

    } catch (err) {
      // Handle login OR current-user failure
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.message ||
        "Login failed. Please check your credentials or try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1f] text-[#d8f3dc] flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md bg-[#0d1326] border border-[#1dd1a1]/40 rounded-2xl shadow-[0_0_20px_#1dd1a133] p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-2xl border border-[#1dd1a1]/30 shadow-[0_0_35px_#1dd1a122] pointer-events-none"></div>

        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 tracking-wider text-[#1dd1a1] flex items-center justify-center gap-3 drop-shadow-[0_0_8px_#1dd1a1]">
          <LogIn className="w-7 h-7" /> Employee Login
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-600/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f]/80 border border-[#1dd1a1]/40 focus:border-[#1dd1a1] focus:ring-1 focus:ring-[#1dd1a1] placeholder-[#1dd1a1]/40 text-[#d8f3dc] transition-all"
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f]/80 border border-[#1dd1a1]/40 focus:border-[#1dd1a1] focus:ring-1 focus:ring-[#1dd1a1] placeholder-[#1dd1a1]/40 text-[#d8f3dc] transition-all"
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full mt-8 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2
            ${
              isLoading
                ? "bg-[#1dd1a1]/10 border-[#1dd1a1]/30 text-[#1dd1a1]/70 cursor-wait"
                : "bg-[#1dd1a1]/20 border-[#1dd1a1]/50 text-[#1dd1a1] hover:bg-[#1dd1a1]/30 hover:shadow-[0_0_15px_#1dd1a1]"
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </div>
  );
}