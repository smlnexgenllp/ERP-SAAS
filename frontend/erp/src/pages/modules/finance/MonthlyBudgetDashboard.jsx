import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  FiPlus,
  FiCheckCircle,
  FiClock,
  FiArrowLeft
} from "react-icons/fi";

const MonthlyBudgetDashboard = () => {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [monthYear, setMonthYear] = useState("");

  /* ================= FETCH BUDGETS ================= */
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finance/monthly-budgets/");
      setBudgets(res.data || []);
    } catch (error) {
      console.error("Failed to load budgets", error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  /* ================= CREATE BUDGET ================= */
  const handleCreateBudget = async () => {
    if (!amount || !monthYear) return;

    const [year, month] = monthYear.split("-");
    const monthDate = `${year}-${month}-01`;

    try {
      await api.post("/finance/monthly-budgets/", {
        month: monthDate,
        amount,
      });
      setAmount("");
      setMonthYear("");
      fetchBudgets();
    } catch (error) {
      alert("Budget already exists for this month.");
    }
  };

  /* ================= RELEASE BUDGET ================= */
  const releaseBudget = async (id) => {
    try {
      await api.post(`/finance/monthly-budgets/${id}/release/`);
      fetchBudgets();
    } catch (error) {
      alert("Unable to release budget.");
    }
  };

  /* ================= SUMMARY ================= */
  const totalAmount = budgets.reduce(
    (sum, b) => sum + Number(b.amount),
    0
  );

  const releasedCount = budgets.filter(b => b.released).length;
  const pendingCount = budgets.filter(b => !b.released).length;

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-2 font-medium"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">
            Monthly Budget Management
          </h1>
          <p className="text-zinc-500 mt-1">
            Define, approve and release organization budgets
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Total Budget Amount" value={`₹ ${totalAmount.toLocaleString()}`} />
        <SummaryCard title="Released Budgets" value={releasedCount} />
        <SummaryCard title="Pending Budgets" value={pendingCount} />
      </div>

      {/* CREATE BUDGET */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-zinc-900">
          <FiPlus /> Create Monthly Budget
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Budget Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl outline-none focus:border-blue-500"
          />

          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="bg-white border border-zinc-200 px-5 py-3 rounded-2xl outline-none focus:border-blue-500"
          />

          <button
            onClick={handleCreateBudget}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold py-3 transition"
          >
            Save Budget
          </button>
        </div>
      </div>

      {/* BUDGET TABLE */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-zinc-700">Month</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Year</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Amount</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Status</th>
              <th className="px-6 py-4 font-semibold text-zinc-700">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-zinc-500">
                  Loading budgets...
                </td>
              </tr>
            ) : budgets.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-zinc-500">
                  No budgets created yet
                </td>
              </tr>
            ) : (
              budgets.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-800">{b.month}</td>
                  <td className="px-6 py-4 text-zinc-800">{b.year}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900">₹ {b.amount}</td>
                  <td className="px-6 py-4">
                    {b.released ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                        <FiCheckCircle /> Released
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        <FiClock /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {!b.released && (
                      <button
                        onClick={() => releaseBudget(b.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-2xl text-sm font-medium transition"
                      >
                        Release
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const SummaryCard = ({ title, value }) => (
  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
    <p className="text-zinc-500 text-sm font-medium">{title}</p>
    <p className="text-3xl font-bold text-zinc-900 mt-3">{value}</p>
  </div>
);

export default MonthlyBudgetDashboard;