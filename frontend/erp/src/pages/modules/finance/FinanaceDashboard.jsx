import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  FiDollarSign,
  FiEdit,
  FiSave,
  FiLock,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
  FiLogOut,
  FiPlus,
  FiBarChart2,
  FiUsers,
  FiEye,
} from "react-icons/fi";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const FinanceDashboard = () => {
  const { organization, user, logout } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [budget, setBudget] = useState(null);
  const [allocation, setAllocation] = useState({});
  const [budgetSplit, setBudgetSplit] = useState({});
  const [releasedBudget, setReleasedBudget] = useState(0);
  const [vendorStats, setVendorStats] = useState({ total: 0, active: 0, approved: 0 });

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [command, setCommand] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  /* -------------------- LOAD BUDGET + VENDOR STATS -------------------- */
  const loadBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get("/finance/monthly-budgets/");
      const released = res.data.find((b) => b.released);

      if (!released) {
        setMessage("No released budget found");
        setMessageType("error");
        setBudget(null);
        return;
      }

      setBudget(released);
      setReleasedBudget(released.amount || 0);

      const initAlloc = {};
      DEPARTMENTS.forEach((dep) => {
        initAlloc[dep] = released.department_allocations?.[dep.toUpperCase()] || 0;
      });
      setAllocation(initAlloc);
      setBudgetSplit({ ...initAlloc });
      setEditMode(false);

      // Fetch vendor stats
      try {
        const vendorRes = await api.get("/finance/vendors/stats/");
        setVendorStats(vendorRes.data || { total: 0, active: 0, approved: 0 });
      } catch (vendorErr) {
        console.warn("Vendor stats not available", vendorErr);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load finance data");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  /* -------------------- CALCULATIONS -------------------- */
  const totalAllocated = Object.values(budgetSplit).reduce(
    (sum, val) => sum + parseFloat(val || 0),
    0
  );
  const remaining = releasedBudget - totalAllocated;

  /* -------------------- HANDLERS -------------------- */
  const handleAllocationChange = (dept, value) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    setBudgetSplit((prev) => ({ ...prev, [dept]: sanitized }));
  };

  const handleAllocateBudget = async () => {
    if (totalAllocated > releasedBudget) {
      setAlertMessage("Total allocation exceeds released budget!");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 4000);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/finance/monthly-budgets/${budget.id}/allocate/`, {
        allocation: budgetSplit,
      });
      setMessage("Budget allocated successfully");
      setMessageType("success");
      setEditMode(false);
      loadBudget();
    } catch (err) {
      console.error(err);
      setMessage("Allocation failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const closeMonth = async () => {
    if (!budget) return;
    try {
      await api.post(`/finance/monthly-budgets/${budget.id}/close_month/`);
      setMessage("Month closed successfully. Budget locked.");
      setMessageType("success");
      loadBudget();
    } catch (err) {
      console.error(err);
      setMessage("Failed to close month");
      setMessageType("error");
    }
  };

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
    if (cmd === "help") return notify("Commands: vouchers, budget, departments, reports, allocate, vendors, logout");
    if (cmd === "vouchers") return navigate("/accounts/vouchers");
    if (cmd === "budget") return navigate("/finance/monthly-budgets");
    if (cmd === "departments") return notify(`Departments: ${DEPARTMENTS.join(", ")}`);
    if (cmd === "reports") return navigate("/finance/reports");
    if (cmd === "vendors") return navigate("/finance/vendors");
    if (cmd === "clear") return setCommand("");
    notify(`Unknown command: ${cmd}`);
  };

  const handleCommandBarClick = () => {
    inputRef.current?.focus();
  };

  /* -------------------- LOADING -------------------- */
  if (loading && !budget) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">
        Loading Finance Dashboard...
      </div>
    );
  }

  /* -------------------- RENDER -------------------- */
  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-blue-400 mb-2"
          >
            <FiArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold text-blue-300">
            Finance Control Panel
          </h1>
          <p className="text-cyan-400 text-sm">
            {organization?.name} • Monthly Budget Allocation
          </p>
        </div>

        {/* <div className="flex items-center gap-4">
          <StatusBadge budget={budget} />
          {!budget?.is_closed && (
            <button
              onClick={closeMonth}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <FiLock /> Close Month
            </button>
          )}
        </div> */}
      </div>

      {/* ALERT MESSAGE */}
      {message && (
        <div
          className={`mb-6 p-4 rounded border flex items-center gap-2 ${
            messageType === "success"
              ? "border-green-700 text-green-300"
              : "border-red-700 text-red-300"
          }`}
        >
          {messageType === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          {message}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Released Budget" value={releasedBudget} />
        <KpiCard title="Allocated Amount" value={totalAllocated} />
        <KpiCard title="Remaining Balance" value={remaining} highlight={remaining < 0 ? "danger" : "normal"} />
        <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-col items-center relative">
          <FiUsers className="text-purple-400 text-6xl mb-3 opacity-20 absolute top-3 right-4" />
          <p className="text-cyan-400 text-sm mb-1">Vendors</p>
          <p className="text-purple-300 font-bold text-3xl mb-2">{vendorStats.total}</p>
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
      </div>

      {/* DEPARTMENT BUDGET ALLOCATION */}
      <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 mb-8">
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
                disabled={budget?.is_closed}
              />
            </div>
          ))}
        </div>

        {!budget?.is_closed && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAllocateBudget}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition"
              disabled={loading}
            >
              <FiDollarSign /> Allocate Budget
            </button>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-gray-900/50 border border-cyan-800/60 rounded-xl p-6 flex flex-wrap gap-4 justify-center md:justify-start mb-8">
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
        <button
          onClick={() => navigate("/items/create")}
          className="bg-purple-700 hover:bg-purple-600 px-7 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
        >
          <FiUsers /> Manage Items
        </button>
      </div>

      {/* TERMINAL INPUT */}
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

      {/* ALERT TOAST */}
      {showAlert && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-700 text-cyan-200 px-8 py-4 rounded-xl shadow-2xl text-base font-mono z-50 animate-fade-in-out">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

/* -------------------- STATUS BADGE -------------------- */
const StatusBadge = ({ budget }) => {
  if (!budget) return null;
  if (budget.is_closed) return <span className="px-4 py-2 rounded bg-red-900 text-red-300 font-bold">CLOSED</span>;
  if (budget.released) return <span className="px-4 py-2 rounded bg-green-900 text-green-300 font-bold">RELEASED</span>;
  return <span className="px-4 py-2 rounded bg-yellow-900 text-yellow-300 font-bold">DRAFT</span>;
};

/* -------------------- KPI CARD -------------------- */
const KpiCard = ({ title, value, highlight = "normal" }) => (
  <div
    className={`rounded-xl p-6 border ${
      highlight === "danger" ? "border-red-700 bg-red-950 text-red-300" : "border-cyan-800 bg-gray-900 text-blue-300"
    } text-center`}
  >
    <FiDollarSign className="text-3xl mx-auto mb-2 text-blue-300" />
    <p className="text-cyan-400">{title}</p>
    <p className="text-2xl font-bold mt-2">₹ {Number(value || 0).toLocaleString()}</p>
  </div>
);

export default FinanceDashboard;
