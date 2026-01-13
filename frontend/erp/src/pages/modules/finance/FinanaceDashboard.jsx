// src/pages/Finance/FinanceDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import {
  FiLogOut,
  FiPlus,
  FiDollarSign,
  FiCheckCircle,
  FiBarChart2,
  FiUsers,
  FiEye,
} from "react-icons/fi";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const FinanceDashboard = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const [releasedBudget, setReleasedBudget] = useState(null);
  const [budgetSplit, setBudgetSplit] = useState({});
  const [vendorStats, setVendorStats] = useState({
    total: 0,
    active: 0,
    approved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Monthly budget
      const budgetRes = await api.get("/finance/monthly-budgets/");
      const activeBudget = budgetRes.data?.find((b) => b.released) || null;

      if (activeBudget) {
        setReleasedBudget(activeBudget.amount);

        const split = {};
        DEPARTMENTS.forEach((dept) => {
          split[dept] = ""; // ready for input
        });
        setBudgetSplit(split);
      }

      // 2. Vendor stats (make sure this endpoint exists!)
      try {
        const vendorRes = await api.get("/finance/vendors/stats/");
        setVendorStats(vendorRes.data || { total: 0, active: 0, approved: 0 });
      } catch (vendorErr) {
        console.warn("Vendor stats endpoint not available yet", vendorErr);
        // Don't break whole dashboard
      }

    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocationChange = (dept, value) => {
    const val = value.replace(/[^0-9.]/g, "");
    setBudgetSplit((prev) => ({ ...prev, [dept]: val }));
  };

  const handleAllocateBudget = async () => {
    const totalAllocated = Object.values(budgetSplit).reduce(
      (acc, v) => acc + parseFloat(v || 0),
      0
    );

    if (totalAllocated > (releasedBudget || 0)) {
      setAlertMessage("Total allocation exceeds released budget!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
      return;
    }

    if (totalAllocated === 0) {
      setAlertMessage("Please allocate budget to at least one department.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
      return;
    }

    try {
      await api.post("/finance/monthly-budgets/allocate/", {
        allocation: budgetSplit,
      });

      setAlertMessage("Budget allocated successfully!");
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
        fetchData(); // refresh dashboard
      }, 3000);
    } catch (err) {
      console.error(err);
      setAlertMessage("Failed to allocate budget.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
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
      setTimeout(() => setShowAlert(false), 4000);
    };

    if (cmd === "logout") return logout();
    if (cmd === "help")
      return notify(
        "Commands: vouchers, budget, departments, reports, allocate, vendors, logout"
      );
    if (cmd === "vouchers") return navigate("/accounts/vouchers");
    if (cmd === "budget") return navigate("/finance/monthly-budgets");
    if (cmd === "departments") return notify(`Departments: ${DEPARTMENTS.join(", ")}`);
    if (cmd === "reports") return navigate("/finance/reports");
    if (cmd === "vendors") return navigate("/finance/vendors");
    if (cmd === "clear") return setCommand("");
    notify(`Unknown command: ${cmd}`);
  };

  const handleCommandBarClick = () => inputRef.current?.focus();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-cyan-300 text-center text-lg font-mono">
          Loading Finance Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 font-mono flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-900 border-b border-cyan-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-300">
            {organization?.name} - Finance
          </h1>
          <p className="text-cyan-400 text-sm mt-1">Welcome, {user?.first_name}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600/80 hover:bg-red-700 px-4 py-2 rounded transition"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-col items-center">
            <FiDollarSign className="text-blue-300 text-5xl mb-3 opacity-80" />
            <p className="text-cyan-400 text-sm">Released Budget</p>
            <p className="text-blue-200 font-bold text-3xl mt-1">
              ₹ {releasedBudget?.toLocaleString() || "0"}
            </p>
          </div>

          <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-col items-center relative overflow-hidden">
            <FiUsers className="text-purple-400 text-6xl mb-3 opacity-20 absolute top-3 right-4" />
            <p className="text-cyan-400 text-sm mb-1">Vendors</p>
            <p className="text-purple-300 font-bold text-3xl mb-2">
              {vendorStats.total}
            </p>
            <div className="flex gap-6 text-sm mt-1">
              <div className="text-center">
                <p className="text-green-400">Active</p>
                <p className="font-semibold">{vendorStats.active}</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400">Approved</p>
                <p className="font-semibold">{vendorStats.approved}</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/finance/vendors")}
              className="mt-5 text-sm bg-purple-900/40 hover:bg-purple-800/60 px-5 py-2 rounded flex items-center gap-2 transition"
              aria-label="View all vendors"
            >
              <FiEye size={16} /> View Vendors
            </button>
          </div>

          {/* Placeholder cards – replace with real data when ready */}
          <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-col items-center">
            <FiCheckCircle className="text-green-400 text-5xl mb-3 opacity-80" />
            <p className="text-cyan-400 text-sm">Pending Approvals</p>
            <p className="text-green-300 font-bold text-3xl mt-1">—</p>
          </div>

          <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-col items-center">
            <FiBarChart2 className="text-yellow-400 text-5xl mb-3 opacity-80" />
            <p className="text-cyan-400 text-sm">This Month Spend</p>
            <p className="text-yellow-300 font-bold text-3xl mt-1">—</p>
          </div>
        </div>

        {/* Budget Allocation Section */}
        <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-300 mb-5">
            Department-wise Budget Allocation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEPARTMENTS.map((dept) => (
              <div
                key={dept}
                className="bg-gray-950/50 border border-cyan-900/40 rounded-lg p-5 flex flex-col items-center"
              >
                <p className="text-cyan-300 font-semibold mb-3">{dept}</p>
                <input
                  type="text"
                  value={budgetSplit[dept] || ""}
                  onChange={(e) => handleAllocationChange(dept, e.target.value)}
                  className="w-full bg-gray-900 text-cyan-200 text-center rounded px-3 py-2 outline-none border border-cyan-800/50 focus:border-cyan-400"
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAllocateBudget}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition"
              disabled={loading}
            >
              <FiDollarSign /> Allocate Budget
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-wrap gap-4 justify-center md:justify-start">
          <button
            onClick={() => navigate("/accounts/vouchers")}
            className="bg-blue-700 hover:bg-blue-600 px-7 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <FiPlus /> Create Voucher
          </button>

          <button
            onClick={() => navigate("/finance/monthly-budgets")}
            className="bg-green-700 hover:bg-green-600 px-7 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <FiDollarSign /> Manage Budgets
          </button>

          <button
            onClick={() => navigate("/finance/vendors")}
            className="bg-purple-700 hover:bg-purple-600 px-7 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <FiUsers /> Manage Vendors
          </button>

          <button
            onClick={() => navigate("/finance/reports")}
            className="bg-yellow-700 hover:bg-yellow-600 px-7 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <FiBarChart2 /> Reports
          </button>
        </div>
      </main>

      {/* Terminal */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-md border-t-2 border-cyan-600 px-6 py-4 flex items-center cursor-text z-50"
        onClick={handleCommandBarClick}
      >
        <span className="text-green-400 font-bold mr-4 text-xl">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command (help, vendors, vouchers, budget, allocate, logout...)"
          className="flex-1 bg-transparent text-green-300 outline-none font-mono text-base caret-green-400"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Alert toast */}
      {showAlert && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-700 text-cyan-200 px-8 py-4 rounded-xl shadow-2xl text-base font-mono z-50 animate-fade-in-out">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;