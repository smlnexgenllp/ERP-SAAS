import React, { useState, useEffect } from "react";
import axios from "axios";

// Correct base URL for all finance module endpoints
const API_BASE = "http://localhost:8000/api/finance";

const OpeningBalances = () => {
  const [companies, setCompanies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [openingBalances, setOpeningBalances] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
      console.log("Companies loaded:", res.data);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setError("Failed to load companies");
    }
  };

  const fetchFinancialYears = async (companyId) => {
    if (!companyId) return setFinancialYears([]);
    try {
      const res = await axios.get(`${API_BASE}/financial-years/?company=${companyId}`);
      setFinancialYears(res.data);
      console.log("Financial years loaded:", res.data);
    } catch (err) {
      console.error("Failed to load financial years:", err);
      setError("Failed to load financial years");
    }
  };

  const fetchAccountsAndBalances = async (companyId, yearId) => {
    if (!companyId || !yearId) return;

    try {
      // Fetch accounts for the selected company
      const accRes = await axios.get(`${API_BASE}/accounts/?company=${companyId}`);
      setAccounts(accRes.data);
      console.log("Accounts loaded:", accRes.data);

      // Fetch all opening balances (then filter client-side)
      const obRes = await axios.get(`${API_BASE}/opening-balances/`);
      const allOB = obRes.data.filter(
        ob =>
          ob.account?.company === parseInt(companyId) &&
          ob.financial_year === parseInt(yearId)
      );
      setOpeningBalances(allOB);

      // Prefill form with existing balances
      const prefill = {};
      allOB.forEach(ob => {
        prefill[ob.account.id] = ob.amount; // assuming account is nested object
      });
      setBalances(prefill);

      console.log("Opening balances prefilled:", prefill);
    } catch (err) {
      console.error("Failed to load accounts/balances:", err);
      setError("Failed to load accounts or balances");
    }
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setSelectedCompany(companyId);
    setSelectedYear("");
    setBalances({});
    fetchFinancialYears(companyId);
  };

  const handleYearChange = (e) => {
    const yearId = e.target.value;
    setSelectedYear(yearId);
    fetchAccountsAndBalances(selectedCompany, yearId);
  };

  const handleAmountChange = (accountId, value) => {
    const numValue = value === "" ? 0 : parseFloat(value) || 0;
    setBalances(prev => ({ ...prev, [accountId]: numValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Delete existing opening balances for this company + year
      for (const ob of openingBalances) {
        await axios.delete(`${API_BASE}/opening-balances/${ob.id}/`);
      }

      // Create new ones where amount is not zero
      for (const [accountId, amount] of Object.entries(balances)) {
        if (amount !== 0) {
          await axios.post(`${API_BASE}/opening-balances/`, {
            account: parseInt(accountId),
            financial_year: parseInt(selectedYear),
            amount,
          });
        }
      }

      setSuccess("OPENING BALANCES SAVED SUCCESSFULLY");
      fetchAccountsAndBalances(selectedCompany, selectedYear);
    } catch (err) {
      console.error("Error saving balances:", err);
      setError("Error saving balances: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const totalDebit = accounts
    .filter(acc => ["ASSET", "EXPENSE"].includes(acc.type))
    .reduce((sum, acc) => sum + (balances[acc.id] || 0), 0);

  const totalCredit = accounts
    .filter(acc => ["LIABILITY", "INCOME", "EQUITY"].includes(acc.type))
    .reduce((sum, acc) => sum + Math.abs(balances[acc.id] || 0), 0);

  return (
    <div className="max-w-[1200px]">

      {/* TITLE */}
      <h1 className="text-blue-300 font-bold text-lg mb-6 tracking-wide">
        OPENING BALANCES
      </h1>

      {/* ERROR / SUCCESS */}
      {error && (
        <div className="mb-4 border border-red-500 bg-red-900/20 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 border border-green-500 bg-green-900/20 text-green-400 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* SELECTORS */}
      <div className="bg-gray-900 border border-cyan-900 rounded-lg p-6 mb-8 grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Company
          </label>
          <select
            value={selectedCompany}
            onChange={handleCompanyChange}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300"
          >
            <option value="">-- Select Company --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Financial Year
          </label>
          <select
            value={selectedYear}
            onChange={handleYearChange}
            disabled={!selectedCompany}
            className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-2 text-cyan-300 disabled:opacity-50"
          >
            <option value="">-- Select Year --</option>
            {financialYears.map(fy => (
              <option key={fy.id} value={fy.id}>
                {fy.start_date} → {fy.end_date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      {selectedCompany && selectedYear && accounts.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border border-cyan-900 rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Opening Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc.id} className="border-t border-cyan-900">
                    <td className="px-4 py-2 font-mono text-green-400">
                      {acc.code}
                    </td>
                    <td className="px-4 py-2 text-cyan-300">
                      {acc.name} {acc.is_group && "(Group)"}
                    </td>
                    <td className="px-4 py-2 text-gray-400">
                      {acc.type}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={balances[acc.id] ?? ""}
                        onChange={e => handleAmountChange(acc.id, e.target.value)}
                        className="w-full bg-gray-950 border border-cyan-900 rounded px-3 py-1 text-right text-cyan-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="grid md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="bg-gray-900 border border-green-600 rounded p-4 text-center text-green-400">
              TOTAL DEBIT<br />₹{totalDebit.toLocaleString("en-IN")}
            </div>
            <div className="bg-gray-900 border border-red-600 rounded p-4 text-center text-red-400">
              TOTAL CREDIT<br />₹{totalCredit.toLocaleString("en-IN")}
            </div>
            <div className={`bg-gray-900 rounded p-4 text-center font-bold ${
              totalDebit === totalCredit
                ? "border border-cyan-400 text-cyan-300"
                : "border border-orange-500 text-orange-400"
            }`}>
              {totalDebit === totalCredit ? "BALANCED" : "NOT BALANCED"}
            </div>
          </div>

          {/* SUBMIT */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || totalDebit !== totalCredit}
              className="bg-cyan-400 text-gray-900 font-bold px-10 py-3 rounded hover:bg-cyan-300 transition disabled:opacity-50"
            >
              {loading ? "SAVING..." : "SAVE OPENING BALANCES"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default OpeningBalances;