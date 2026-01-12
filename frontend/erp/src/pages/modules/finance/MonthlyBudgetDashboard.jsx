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

    try {
      await api.post("/finance/monthly-budgets/", {
        year,
        month,
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
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-blue-400 mb-2"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-blue-300">
            Monthly Budget Management
          </h1>
          <p className="text-cyan-400 mt-1">
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
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FiPlus /> Create Monthly Budget
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Budget Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
          />

          <input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
          />

          <button
            onClick={handleCreateBudget}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
          >
            Save Budget
          </button>
        </div>
      </div>

      {/* BUDGET TABLE */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  Loading budgets...
                </td>
              </tr>
            ) : budgets.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  No budgets created yet
                </td>
              </tr>
            ) : (
              budgets.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-cyan-800 hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3">{b.month}</td>
                  <td className="px-4 py-3">{b.year}</td>
                  <td className="px-4 py-3">₹ {b.amount}</td>
                  <td className="px-4 py-3">
                    {b.released ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <FiCheckCircle /> Released
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center gap-1">
                        <FiClock /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!b.released && (
                      <button
                        onClick={() => releaseBudget(b.id)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded-lg"
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
  <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
    <p className="text-cyan-400 text-sm">{title}</p>
    <p className="text-2xl font-bold text-blue-300 mt-2">{value}</p>
  </div>
);

export default MonthlyBudgetDashboard;
