import React, { useState } from "react";
import api from "../../../src/services/api";
import { useNavigate } from "react-router-dom";

export default function SubOrgLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subdomain: "",
    username: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/organizations/suborg-login/", formData);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("subdomain", res.data.subdomain);

        navigate("/users");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed, try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">
          Sub-Organization Login
        </h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-medium">Sub-Organization</label>
            <input
              type="text"
              name="subdomain"
              placeholder="example: sales, hr, finance"
              value={formData.subdomain}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="font-medium">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="font-medium">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
