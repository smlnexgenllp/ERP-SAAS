import React, { useState, useEffect } from "react";
import axios from "axios";

// Correct base URL for finance module endpoints
const API_BASE = "http://localhost:8000/api/finance";

const ReportsDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [activeTab, setActiveTab] = useState("trial");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/companies/`);
      setCompanies(res.data);
    } catch (err) {
      setMessage("Failed to load companies");
    }
  };

  const fetchData = async (companyId, yearId) => {
    if (!companyId || !yearId) {
      setAccounts([]);
      setTransactions([]);
      return;
    }
    setLoading(true);
    try {
      const [accRes, transRes, fyRes] = await Promise.all([
        axios.get(`${API_BASE}/accounts/?company=${companyId}`),
        axios.get(`${API_BASE}/transactions/?company=${companyId}`),
        axios.get(`${API_BASE}/financial-years/?company=${companyId}`),
      ]);

      setAccounts(accRes.data);
      setTransactions(transRes.data.filter((t) => t.financial_year === parseInt(yearId)));
      setFinancialYears(fyRes.data);
    } catch (err) {
      setMessage("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (e) => {
    const id = e.target.value;
    setSelectedCompany(id);
    setSelectedYear("");
    setAccounts([]);
    setTransactions([]);
  };

  const handleYearChange = (e) => {
    const id = e.target.value;
    setSelectedYear(id);
    fetchData(selectedCompany, id);
  };

  // Report Calculations
  const calculateTrialBalance = () => {
    const debitTotal = accounts
      .filter((a) => ["ASSET", "EXPENSE"].includes(a.type))
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const creditTotal = accounts
      .filter((a) => ["LIABILITY", "INCOME", "EQUITY"].includes(a.type))
      .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

    return {
      debitTotal,
      creditTotal,
      balanced: Math.abs(debitTotal - creditTotal) < 0.01,
    };
  };

  const calculatePL = () => {
    const income = accounts
      .filter((a) => a.type === "INCOME")
      .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

    const expense = accounts
      .filter((a) => a.type === "EXPENSE")
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const profit = income - expense;
    return { income, expense, profit };
  };

  const calculateBalanceSheet = () => {
    const assets = accounts
      .filter((a) => a.type === "ASSET")
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    const liabilities = accounts
      .filter((a) => a.type === "LIABILITY")
      .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

    const equity = accounts
      .filter((a) => a.type === "EQUITY")
      .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

    const totalLiabEquity = liabilities + equity;
    return {
      assets,
      liabilities,
      equity,
      totalLiabEquity,
      balanced: Math.abs(assets - totalLiabEquity) < 0.01,
    };
  };

  const { debitTotal, creditTotal, balanced: trialBalanced } = calculateTrialBalance();
  const { income, expense, profit } = calculatePL();
  const { assets, liabilities, equity, totalLiabEquity, balanced: bsBalanced } = calculateBalanceSheet();

  const tabs = [
    { key: "trial", label: "Trial Balance", icon: "⚖️" },
    { key: "pl", label: "Profit & Loss", icon: "📊" },
    { key: "bs", label: "Balance Sheet", icon: "📈" },
    { key: "ledger", label: "Ledger View", icon: "📑" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-cyan-400 uppercase">
            Reports & Dashboard
          </h1>
          <p className="text-xl text-slate-400">
            Financial insights and analytics for your organization
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-black/30 p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Company <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedCompany}
                onChange={handleCompanyChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all"
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-3">
                Financial Year <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                disabled={!selectedCompany}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-6 py-4 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all disabled:opacity-60"
              >
                <option value="">-- Select Year --</option>
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.start_date} to {fy.end_date}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center text-3xl text-cyan-400 py-20">
            Generating financial reports...
          </div>
        )}
        {message && (
          <div className="bg-red-950/40 border border-red-700/50 text-red-300 px-8 py-6 rounded-2xl text-center text-xl">
            {message}
          </div>
        )}

        {selectedCompany && selectedYear && !loading && accounts.length > 0 && (
          <>
            {/* Report Tabs */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-500/30"
                      : "bg-slate-900/70 text-slate-300 border border-slate-700 hover:bg-slate-800/70"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Report Content Card */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-10">
              {/* Trial Balance */}
              {activeTab === "trial" && (
                <div className="space-y-8">
                  <h2 className="text-4xl font-semibold text-center text-cyan-400">Trial Balance</h2>
                  <div className="overflow-x-auto rounded-2xl border border-slate-700">
                    <table className="w-full">
                      <thead className="bg-slate-800/50">
                        <tr>
                          <th className="p-6 text-left text-lg font-medium text-slate-300">Account</th>
                          <th className="p-6 text-right text-lg font-medium text-slate-300">Debit</th>
                          <th className="p-6 text-right text-lg font-medium text-slate-300">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {accounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-800/30 transition">
                            <td className="p-6 text-lg">
                              {acc.code} - {acc.name}
                              {acc.is_group && (
                                <span className="ml-3 px-3 py-1 bg-purple-900/40 text-purple-300 rounded-full text-xs">
                                  GROUP
                                </span>
                              )}
                              <span className="ml-3 text-sm text-slate-500">({acc.type})</span>
                            </td>
                            <td className="p-6 text-right text-lg text-emerald-400">
                              {["ASSET", "EXPENSE"].includes(acc.type) ? `₹${(acc.balance || 0).toFixed(2)}` : "-"}
                            </td>
                            <td className="p-6 text-right text-lg text-red-400">
                              {["LIABILITY", "INCOME", "EQUITY"].includes(acc.type)
                                ? `₹${Math.abs(acc.balance || 0).toFixed(2)}`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-800/50 font-bold text-xl">
                          <td className="p-6">Total</td>
                          <td className="p-6 text-right text-emerald-400">₹{debitTotal.toFixed(2)}</td>
                          <td className="p-6 text-right text-red-400">₹{creditTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div
                    className={`text-center text-3xl font-bold p-10 rounded-2xl ${
                      trialBalanced
                        ? "bg-emerald-950/40 border border-emerald-700/50 text-emerald-300"
                        : "bg-red-950/40 border border-red-700/50 text-red-300"
                    }`}
                  >
                    {trialBalanced ? "✓ Perfectly Balanced" : "⚠️ Out of Balance"}
                  </div>
                </div>
              )}

              {/* Profit & Loss */}
              {activeTab === "pl" && (
                <div className="space-y-10 text-center">
                  <h2 className="text-4xl font-semibold text-cyan-400">Profit & Loss Statement</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-slate-900/70 backdrop-blur-xl border border-emerald-700/30 rounded-2xl p-10">
                      <p className="text-xl text-slate-300 mb-4">Total Income</p>
                      <p className="text-5xl font-bold text-emerald-400">₹{income.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-900/70 backdrop-blur-xl border border-red-700/30 rounded-2xl p-10">
                      <p className="text-xl text-slate-300 mb-4">Total Expenses</p>
                      <p className="text-5xl font-bold text-red-400">₹{expense.toFixed(2)}</p>
                    </div>
                    <div
                      className={`p-10 rounded-2xl text-5xl font-bold ${
                        profit >= 0
                          ? "bg-emerald-950/40 border border-emerald-700/50 text-emerald-300"
                          : "bg-red-950/40 border border-red-700/50 text-red-300"
                      }`}
                    >
                      Net {profit >= 0 ? "Profit" : "Loss"}<br />
                      ₹{Math.abs(profit).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Sheet */}
              {activeTab === "bs" && (
                <div className="space-y-10 text-center">
                  <h2 className="text-4xl font-semibold text-cyan-400">Balance Sheet</h2>
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="bg-slate-900/70 backdrop-blur-xl border border-cyan-700/30 rounded-2xl p-10">
                      <p className="text-2xl text-slate-300 mb-6">Assets</p>
                      <p className="text-6xl font-bold text-cyan-400">₹{assets.toFixed(2)}</p>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-slate-900/70 backdrop-blur-xl border border-red-700/30 rounded-2xl p-10">
                        <p className="text-2xl text-slate-300 mb-6">Liabilities</p>
                        <p className="text-5xl font-bold text-red-400">₹{liabilities.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-900/70 backdrop-blur-xl border border-purple-700/30 rounded-2xl p-10">
                        <p className="text-2xl text-slate-300 mb-6">Equity</p>
                        <p className="text-5xl font-bold text-purple-400">₹{equity.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-10">
                        <p className="text-2xl text-slate-300 mb-6">Total Liabilities + Equity</p>
                        <p className="text-5xl font-bold text-white">₹{totalLiabEquity.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-center text-3xl font-bold p-10 rounded-2xl ${
                      bsBalanced
                        ? "bg-emerald-950/40 border border-emerald-700/50 text-emerald-300"
                        : "bg-red-950/40 border border-red-700/50 text-red-300"
                    }`}
                  >
                    {bsBalanced ? "✓ Balance Sheet Balanced" : "⚠️ Out of Balance"}
                  </div>
                </div>
              )}

              {/* Ledger View (Placeholder) */}
              {activeTab === "ledger" && (
                <div className="text-center space-y-6">
                  <h2 className="text-4xl font-semibold text-cyan-400">Ledger View</h2>
                  <p className="text-xl text-slate-400">
                    Select an account to view detailed transaction history
                  </p>
                  <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-12 text-slate-500 text-lg">
                    Feature coming soon...
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;