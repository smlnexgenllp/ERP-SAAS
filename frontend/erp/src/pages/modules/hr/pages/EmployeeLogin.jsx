import React, { useState } from "react";
import axios from "../../../../services/api";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("/auth/employee-login/", {
        email,
        password,
      });

      navigate("/profile");

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1f] text-[#d8f3dc] flex items-center justify-center p-4 font-mono">

      <div className="w-full max-w-md bg-[#0d1326] border border-[#1dd1a1]/40 rounded-2xl shadow-[0_0_20px_#1dd1a133] p-8">

        <h2 className="text-2xl font-bold text-center mb-8 text-[#1dd1a1] flex items-center justify-center gap-3">
          <LogIn className="w-7 h-7" /> Employee Login
        </h2>

        <div className="space-y-6">

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              placeholder="Work Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f] border border-[#1dd1a1]/40"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f] border border-[#1dd1a1]/40"
            />
          </div>

        </div>

        <button
          onClick={handleLogin}
          className="w-full mt-8 py-3 bg-[#1dd1a1]/20 border border-[#1dd1a1]/50 text-[#1dd1a1] font-bold rounded-lg"
        >
          Login
        </button>

      </div>
    </div>
  );
}