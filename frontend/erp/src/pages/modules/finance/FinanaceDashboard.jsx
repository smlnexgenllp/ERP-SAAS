// src/pages/Finance/FinanceDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import { FiLogOut, FiPlus, FiDollarSign, FiCheckCircle, FiBarChart2 } from "react-icons/fi";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const FinanceDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [releasedBudget, setReleasedBudget] = useState(null);
  const [budgetSplit, setBudgetSplit] = useState({});
  const [budgetUsed, setBudgetUsed] = useState({});
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  // Fetch current month's released budget
  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finance/monthly-budgets/");
      const budgetData = res.data?.find(b => b.released) || null;
      if (budgetData) {
        setReleasedBudget(budgetData.amount);

        // Initialize department allocation with zeros for manual entry
        const split = {};
        const used = {};
        DEPARTMENTS.forEach((dept) => {
          split[dept] = ""; // empty for manual input
          used[dept] = 0; // initially nothing used
        });
        setBudgetSplit(split);
        setBudgetUsed(used);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, []);

  const handleAllocationChange = (dept, value) => {
    const val = value.replace(/[^0-9.]/g, ""); // allow only numbers
    setBudgetSplit((prev) => ({ ...prev, [dept]: val }));
  };

  const handleAllocateBudget = async () => {
    // Validate total allocation <= releasedBudget
    const totalAllocated = Object.values(budgetSplit).reduce((acc, v) => acc + parseFloat(v || 0), 0);
    if (totalAllocated > releasedBudget) {
      setAlertMessage("Total allocation exceeds released budget!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    try {
      // Call backend API to save allocations per department
      await api.post("/finance/monthly-budgets/allocate/", { allocation: budgetSplit });
      setAlertMessage("Budget allocated successfully!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to allocate budget.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
  };

  // Terminal commands
  const handleCommand = (e) => {
    if (e.key !== "Enter") return;
    const cmd = command.trim().toLowerCase();
    setCommand("");

    const notify = (msg) => {
      setAlertMessage(msg);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    };

    if (cmd === "logout") return logout();
    if (cmd === "help") return notify("Commands: vouchers, budget, departments, reports, allocate, logout");
    if (cmd === "vouchers") return navigate("/accounts/vouchers");
    if (cmd === "budget") return navigate("/finance/monthly-budgets");
    if (cmd === "departments") return notify(`Departments: ${DEPARTMENTS.join(", ")}`);
    if (cmd === "reports") return navigate("/finance/reports");
    notify(`Unknown command: ${cmd}`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-center text-lg font-mono">Loading Finance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-900 border-b border-cyan-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-300">{organization?.name} - Finance</h1>
          <p className="text-cyan-400 text-sm mt-1">Welcome, {user?.first_name}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Main Dashboard */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6 flex flex-col items-center">
            <FiDollarSign className="text-blue-300 text-4xl mb-2" />
            <p className="text-cyan-400 text-sm">Released Budget</p>
            <p className="text-blue-300 font-bold text-2xl mt-1">₹ {releasedBudget || 0}</p>
          </div>
        </div>

        {/* Department-wise Budget Manual Allocation */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-300 mb-4">Department-wise Budget Allocation</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {DEPARTMENTS.map((dept) => (
              <div key={dept} className="bg-gray-900/30 border border-cyan-700 rounded-lg p-4 flex flex-col items-center">
                <p className="text-cyan-400 font-semibold">{dept}</p>
                <input
                  type="text"
                  value={budgetSplit[dept]}
                  onChange={(e) => handleAllocationChange(dept, e.target.value)}
                  className="mt-2 w-full bg-gray-800 text-cyan-300 text-center rounded px-2 py-1 outline-none"
                  placeholder="Enter amount"
                />
                <button
                  onClick={() => releaseDeptBudget(dept)}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-gray-950 px-3 py-1 rounded font-semibold text-sm"
                >
                  Release
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAllocateBudget}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              Allocate Budget
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/40 border border-cyan-800 rounded-xl p-6 flex flex-wrap gap-4">
          <button
            onClick={() => navigate("/accounts/vouchers")}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <FiPlus /> Create Voucher
          </button>

          <button
            onClick={() => navigate("/finance/monthly-budgets")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <FiDollarSign /> Manage Budgets
          </button>

          <button
            onClick={() => navigate("/finance/reports")}
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-bold flex items-center gap-2"
          >
            <FiBarChart2 /> Reports
          </button>
        </div>
      </main>

      {/* Terminal Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t-2 border-cyan-500 px-6 py-4 flex items-center cursor-text"
        onClick={handleCommandBarClick}
      >
        <span className="text-green-400 font-bold mr-3">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, vouchers, budget, allocate..."
          className="flex-1 bg-transparent text-green-400 outline-none font-mono text-base"
          spellCheck={false}
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800/90 border border-cyan-500 text-cyan-200 px-6 py-3 rounded-lg shadow-xl text-sm font-mono">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
