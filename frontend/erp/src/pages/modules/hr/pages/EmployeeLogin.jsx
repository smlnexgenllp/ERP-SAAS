import React, { useState } from "react";
import axios from "../../../../services/api";
import { useNavigate } from "react-router-dom";
// Import icons for visual appeal (assuming you have 'lucide-react' or similar)
import { Mail, Briefcase, Lock, UserCheck } from 'lucide-react';

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
                password
            });
            alert("Logged In Successfully!");
            // Assuming the API sets authentication tokens (like a JWT) in 'axios' interceptors
            setProfile(res.data.employee_profile);
            navigate("/profile");
        } catch (error) {
            // Use optional chaining to safely access error message
            alert(error.response?.data?.detail || "Login failed. Please check your credentials.");
        }
    };

    return (
        // Full page container with background gradient and centering
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            {/* Login Card */}
            <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-xl shadow-2xl border border-gray-200 transform transition-all duration-300 hover:shadow-gray-300/80">

                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center border-b-2 pb-3 border-indigo-100 flex items-center justify-center gap-2">
                    <UserCheck className="w-7 h-7 text-indigo-600"/>
                    Employee Access
                </h2>

                <div className="space-y-6">
                    {/* Sub Organization Input */}
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            placeholder="Sub Organization Code"
                            value={subOrganization}
                            onChange={(e) => setSubOrganization(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 placeholder-gray-500 transition duration-150 ease-in-out"
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            placeholder="Work Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 placeholder-gray-500 transition duration-150 ease-in-out"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 placeholder-gray-500 transition duration-150 ease-in-out"
                        />
                    </div>
                </div>

                {/* Login Button */}
                <button 
                    onClick={handleLogin}
                    className="w-full mt-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-[1.01]"
                >
                    Authenticate & Login
                </button>

                {/* Profile Debug Display (Kept for completeness) */}
                {profile && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg shadow-inner text-sm text-green-800">
                        <h3 className="font-bold mb-2">✅ Login Success (Redirecting...)</h3>
                        <pre className="overflow-auto max-h-40 bg-green-100 p-2 rounded">
                            {JSON.stringify(profile, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}