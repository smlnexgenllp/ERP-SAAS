import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api/finance/companies/";

const CompanySetup = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ... rest of your code remains exactly the same ...

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    gst_number: "",
    pan_number: "",
    cin_number: "",
    base_currency: "INR",
    time_zone: "Asia/Kolkata",
    accounting_standards: "Indian GAAP",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(API_URL);
      setCompanies(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load companies");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post(API_URL, formData);

      setFormData({
        name: "",
        address: "",
        gst_number: "",
        pan_number: "",
        cin_number: "",
        base_currency: "INR",
        time_zone: "Asia/Kolkata",
        accounting_standards: "Indian GAAP",
      });

      fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Failed to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-[900px]">

      {/* TITLE */}
      <h1 className="text-blue-300 font-bold text-lg mb-6 tracking-wide">
        COMPANY SETUP
      </h1>

      {/* ERROR */}
      {error && (
        <div className="mb-6 border border-red-500 bg-red-900/20 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-cyan-900 rounded-lg p-6 space-y-5 mb-10"
      >
        {/* COMPANY NAME */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* ADDRESS */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Address
          </label>
          <textarea
            name="address"
            rows="3"
            value={formData.address}
            onChange={handleChange}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* GST & PAN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              GST Number
            </label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              PAN Number
            </label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            />
          </div>
        </div>

        {/* CIN */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            CIN Number
          </label>
          <input
            type="text"
            name="cin_number"
            value={formData.cin_number}
            onChange={handleChange}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
          />
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-cyan-400 text-gray-900 font-bold px-6 py-2 rounded hover:bg-cyan-300 transition disabled:opacity-50"
        >
          {loading ? "CREATING..." : "CREATE COMPANY"}
        </button>
      </form>

      {/* COMPANY LIST */}
      <h2 className="text-blue-300 font-semibold text-sm mb-4 tracking-wide">
        EXISTING COMPANIES
      </h2>

      {companies.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No companies created yet.
        </p>
      ) : (
        <div className="space-y-3">
          {companies.map((co) => (
            <div
              key={co.id}
              className="bg-gray-900 border border-cyan-900 rounded-lg p-4"
            >
              <p className="text-cyan-300 font-semibold">
                {co.name}
              </p>
              {co.address && (
                <p className="text-gray-400 text-xs mt-1">
                  {co.address}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                GST: {co.gst_number || "—"} | PAN: {co.pan_number || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySetup;
