import React, { useState } from "react";
import axios from "../../../../services/api";
import { useNavigate } from "react-router-dom";
import { Mail, Briefcase, Lock, LogIn } from "lucide-react";

export default function EmployeeLogin() {
  const [subOrganization, setSubOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("/auth/employee-login/", {
        sub_organization: subOrganization,
        email,
        password,
      });
      setProfile(res.data.employee_profile);
      navigate("/profile");
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1f] text-[#d8f3dc] flex items-center justify-center p-4 font-mono select-none">
      {/* Neon login box */}
      <div className="w-full max-w-md bg-[#0d1326] border border-[#1dd1a1]/40 rounded-2xl shadow-[0_0_20px_#1dd1a133] p-8 relative overflow-hidden">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl border border-[#1dd1a1]/30 shadow-[0_0_35px_#1dd1a122] pointer-events-none"></div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 tracking-wider text-[#1dd1a1] flex items-center justify-center gap-3 drop-shadow-[0_0_8px_#1dd1a1]">
          <LogIn className="w-7 h-7" /> Employee Access Terminal
        </h2>

        <div className="space-y-6">
          {/* Sub Organization */}
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              placeholder="Sub Organization Code"
              value={subOrganization}
              onChange={(e) => setSubOrganization(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f]/80 border border-[#1dd1a1]/40 focus:border-[#1dd1a1] focus:ring-1 focus:ring-[#1dd1a1] placeholder-[#1dd1a1]/40 text-[#d8f3dc] transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              placeholder="Work Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f]/80 border border-[#1dd1a1]/40 focus:border-[#1dd1a1] focus:ring-1 focus:ring-[#1dd1a1] placeholder-[#1dd1a1]/40 text-[#d8f3dc] transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1dd1a1]/60" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0a0f1f]/80 border border-[#1dd1a1]/40 focus:border-[#1dd1a1] focus:ring-1 focus:ring-[#1dd1a1] placeholder-[#1dd1a1]/40 text-[#d8f3dc] transition-all"
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full mt-8 py-3 bg-[#1dd1a1]/20 border border-[#1dd1a1]/50 text-[#1dd1a1] font-bold rounded-lg shadow-[0_0_10px_#1dd1a155] hover:bg-[#1dd1a1]/30 hover:shadow-[0_0_15px_#1dd1a1] transition-all"
        >
          Login
        </button>

        {/* Profile Debug */}
        {profile && (
          <div className="mt-8 p-4 bg-[#1dd1a1]/10 border border-[#1dd1a1]/40 rounded-lg text-sm text-[#bfffe2] shadow-inner overflow-auto max-h-40">
            <h3 className="font-bold mb-2">Login Success</h3>
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
