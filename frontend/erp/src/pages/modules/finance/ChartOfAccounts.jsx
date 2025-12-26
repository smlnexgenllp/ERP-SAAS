import React, { useState, useEffect } from "react";
import axios from "axios";

// Correct base URL for finance module endpoints
const API_BASE = "http://localhost:8000/api/finance";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

const ChartOfAccounts = () => {
  const [companies, setCompanies] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company: "",
    parent: "",
    name: "",
    type: "ASSET",
    code: "",
    is_group: false,
    tax_related: false,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
      console.log("Companies loaded:", res.data); // for debugging
    } catch (err) {
      console.error("Failed to load companies:", err);
      setError("Failed to load companies");
    }
  };

  const fetchAccounts = async (companyId) => {
    if (!companyId) {
      setAccounts([]);
      setGroups([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE}/accounts/?company=${companyId}`);
      setAccounts(res.data);
      setGroups(res.data.filter(a => a.is_group));
      console.log(`Accounts loaded for company ${companyId}:`, res.data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      setError("Failed to load accounts");
    }
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setFormData({ ...formData, company: companyId, parent: "" });
    fetchAccounts(companyId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.company || !formData.name || !formData.code) {
      setError("Company, Name and Code are required");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE}/accounts/`, {
        company: parseInt(formData.company),
        parent: formData.parent ? parseInt(formData.parent) : null,
        name: formData.name.trim(),
        type: formData.type,
        code: formData.code.trim(),
        is_group: formData.is_group,
        tax_related: formData.tax_related,
      });

      // Reset form (keep company selected)
      setFormData(prev => ({
        ...prev,
        name: "",
        code: "",
        parent: "",
        tax_related: false,
      }));

      // Refresh accounts list
      fetchAccounts(formData.company);
    } catch (err) {
      const errorMsg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to create account";
      setError(errorMsg);
      console.error("Account creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIndent = (account) => {
    let depth = 0;
    let current = account.parent;
    while (current) {
      depth++;
      const parentAcc = accounts.find(a => a.id === current);
      current = parentAcc ? parentAcc.parent : null;
    }
    return depth * 28;
  };

  return (
    <div className="max-w-[1200px]">

      {/* TITLE */}
      <h1 className="text-blue-300 font-bold text-lg mb-6 tracking-wide">
        CHART OF ACCOUNTS
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
        className="bg-gray-900 border border-cyan-900 rounded-lg p-6 mb-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* COMPANY */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Company *</label>
          <select
            value={formData.company}
            onChange={handleCompanyChange}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            required
          >
            <option value="">-- Select Company --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* TYPE */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Account Type</label>
          <select
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
          >
            {ACCOUNT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* PARENT */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Parent Group</label>
          <select
            value={formData.parent}
            onChange={e => setFormData({ ...formData, parent: e.target.value })}
            disabled={!formData.company}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300 disabled:opacity-50"
          >
            <option value="">-- Root Level --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.code} - {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* NAME */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name *</label>
          <input
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            required
          />
        </div>

        {/* CODE */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Code *</label>
          <input
            value={formData.code}
            onChange={e => setFormData({ ...formData, code: e.target.value })}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
            required
          />
        </div>

        {/* FLAGS */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_group}
              onChange={e => setFormData({ ...formData, is_group: e.target.checked })}
            />
            Group
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.tax_related}
              onChange={e => setFormData({ ...formData, tax_related: e.target.checked })}
            />
            GST / Tax
          </label>
        </div>

        {/* SUBMIT */}
        <div className="lg:col-span-3">
          <button
            type="submit"
            disabled={loading || !formData.company}
            className="bg-cyan-400 text-gray-900 font-bold px-6 py-2 rounded hover:bg-cyan-300 transition disabled:opacity-50"
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </div>
      </form>

      {/* ACCOUNT TREE */}
      <h2 className="text-blue-300 font-semibold text-sm mb-4 tracking-wide">
        ACCOUNT STRUCTURE
      </h2>

      {accounts.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No accounts created yet.
        </p>
      ) : (
        <div className="space-y-1">
          {accounts.map(acc => (
            <div
              key={acc.id}
              style={{ paddingLeft: `${getIndent(acc)}px` }}
              className={`flex items-center gap-3 px-4 py-2 border-l-4 rounded ${
                acc.is_group
                  ? "bg-gray-900 border-cyan-400 text-cyan-300 font-semibold"
                  : "bg-gray-950 border-cyan-900 text-gray-300"
              }`}
            >
              <span className="text-green-400 font-mono">{acc.code}</span>
              <span>{acc.name}</span>
              <span className="text-xs text-gray-500">({acc.type})</span>
              {acc.tax_related && (
                <span className="ml-auto text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded">
                  GST
                </span>
              )}
              {acc.is_group && (
                <span className="ml-2 text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                  GROUP
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;