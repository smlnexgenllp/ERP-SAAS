import React, { useState, useEffect } from "react";
import axios from "axios";

// Fixed base – use the real prefix your backend expects
const API_BASE = "http://localhost:8000/api/finance";

const FinancialYearSetup = () => {
  const [companies, setCompanies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company: "",
    start_date: "",
    end_date: "",
    is_closed: false,
  });

  useEffect(() => {
    fetchCompanies();
    fetchFinancialYears();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
      console.log("Companies loaded:", res.data); // ← for debugging
    } catch (err) {
      console.error("Companies fetch failed:", err);
      setError("Failed to load companies");
    }
  };

  const fetchFinancialYears = async () => {
    try {
      const res = await axios.get(`${API_BASE}/financial-years/`);
      setFinancialYears(res.data);
      console.log("Financial years loaded:", res.data); // ← for debugging
    } catch (err) {
      console.error("Financial years fetch failed:", err);
      // You can add setError here if you want
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.company || !formData.start_date || !formData.end_date) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE}/financial-years/`, {
        company: parseInt(formData.company),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_closed: false,
      });

      setFormData({ company: "", start_date: "", end_date: "", is_closed: false });
      fetchFinancialYears();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to create financial year";
      setError(msg);
      console.error("Create financial year error:", err);
    } finally {
      setLoading(false);
    }

  // ... rest of your component (return JSX) remains exactly the same ...

    try {
      await axios.post(`${API_BASE}/financial-years/`, {
        company: parseInt(formData.company),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_closed: false,
      });

      setFormData({ company: "", start_date: "", end_date: "", is_closed: false });
      fetchFinancialYears();
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to create financial year";
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1000px]">

      {/* TITLE */}
      <h1 className="text-blue-300 font-bold text-lg mb-6 tracking-wide">
        FINANCIAL YEAR SETUP
      </h1>

      {/* ERROR */}
      {error && (
        <div className="mb-6 border border-red-500 bg-red-900/20 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* CREATE FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-cyan-900 rounded-lg p-6 mb-10 grid md:grid-cols-2 gap-6"
      >
        {/* COMPANY */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Company *
          </label>
          <select
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300 focus:outline-none focus:border-cyan-500"
            required
          >
            <option value="">-- Select Company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* START DATE */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            required
          />
        </div>

        {/* END DATE */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            End Date *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            required
          />
        </div>

        {/* SUBMIT */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-cyan-400 text-gray-900 font-bold px-6 py-2 rounded hover:bg-cyan-300 transition disabled:opacity-50"
          >
            {loading ? "CREATING..." : "CREATE FINANCIAL YEAR"}
          </button>
        </div>
      </form>

      {/* LIST */}
      <h2 className="text-blue-300 font-semibold text-sm mb-4 tracking-wide">
        EXISTING FINANCIAL YEARS
      </h2>

      {financialYears.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No financial years created yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-cyan-900 rounded-lg overflow-hidden">
            <thead className="bg-gray-900">
              <tr className="text-left text-xs text-gray-400">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {financialYears.map((year) => (
                <tr
                  key={year.id}
                  className="border-t border-cyan-900 text-sm"
                >
                  <td className="px-4 py-3 text-cyan-300">
                    {year.company_name}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {year.start_date} → {year.end_date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        year.is_closed
                          ? "bg-red-900/30 text-red-400"
                          : "bg-green-900/30 text-green-400"
                      }`}
                    >
                      {year.is_closed ? "CLOSED" : "OPEN"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FinancialYearSetup;
