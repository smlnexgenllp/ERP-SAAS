
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiEye,
  FiRefreshCw,
} from "react-icons/fi";
import {
  BarChart3,
  CreditCard,
  FileCheck,
  FileText,
  LogOut,
  Truck,
  Wallet,
  Building2,
  PieChart,
  Layers3,
} from "lucide-react";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const FinanceDashboard = () => {
  const { organization, logout, user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [budget, setBudget] = useState(null);
  const [allocation, setAllocation] = useState({});
  const [budgetSplit, setBudgetSplit] = useState({});
  const [releasedBudget, setReleasedBudget] = useState(0);
  const [vendorStats, setVendorStats] = useState({ total: 0, active: 0, approved: 0 });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [command, setCommand] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const fetchVendorStats = async () => {
    try {
      const response = await api.get("/finance/vendors/stats/");

      setVendorStats({
        total: response.data.total || 0,
        active: response.data.active || 0,
        approved: response.data.approved || 0,
      });
    } catch (err) {
      console.error("[VENDOR STATS] Error fetching vendor stats:", err);
    }
  };

  const loadCurrentMonthBudget = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("info");

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthNum = now.getMonth() + 1;
      const currentMonthPadded = String(currentMonthNum).padStart(2, "0");

      const res = await api.get("/finance/monthly-budgets/", {
        params: {
          year: currentYear,
          month: currentMonthPadded,
        },
      });

      let currentBudget = res.data.find((b) => b.released === true);

      if (!currentBudget && res.data.length > 0) {
        currentBudget = res.data[0];
      }

      if (!currentBudget) {
        const monthName = now.toLocaleString("default", { month: "long" });
        setMessage(`No budget found for ${monthName} ${currentYear}`);
        setMessageType("warning");
        setBudget(null);
        setReleasedBudget(0);
        setLoading(false);
        return;
      }

      setBudget(currentBudget);
      setReleasedBudget(Number(currentBudget.amount) || 0);

      const initAlloc = {};
      DEPARTMENTS.forEach((dep) => {
        const departmentKey = dep.toUpperCase();
        const allocationValue = currentBudget.department_allocations?.[departmentKey];

        initAlloc[dep] = allocationValue !== undefined && allocationValue !== null ? allocationValue : "0";
      });

      setAllocation(initAlloc);
      setBudgetSplit(initAlloc);
    } catch (err) {
      console.error("[BUDGET ERROR]", err);
      setMessage("Failed to load budget for current month");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const refreshAllocations = async () => {
    if (!budget) return;

    try {
      const res = await api.get(`/finance/monthly-budgets/${budget.id}/`);

      if (res.data) {
        const updatedAllocations = {};

        DEPARTMENTS.forEach((dep) => {
          const departmentKey = dep.toUpperCase();
          const allocationValue = res.data.department_allocations?.[departmentKey];

          updatedAllocations[dep] = allocationValue !== undefined && allocationValue !== null ? allocationValue : "0";
        });

        setBudgetSplit(updatedAllocations);
        setMessage("Allocations refreshed successfully");
        setMessageType("success");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("[REFRESH] Error:", err);
      setMessage("Failed to refresh allocations");
      setMessageType("error");
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      await loadCurrentMonthBudget();
      await fetchVendorStats();
    };

    loadInitialData();
  }, []);

  const totalAllocated = Object.values(budgetSplit).reduce(
    (sum, val) => sum + parseFloat(val || 0),
    0
  );

  const remaining = releasedBudget - totalAllocated;

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
      await api.post(`/finance/monthly-budgets/${budget.id}/allocate/`, {
        allocation: budgetSplit,
      });

      setMessage("Budget allocated successfully");
      setMessageType("success");
      await loadCurrentMonthBudget();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Allocation failed");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading Finance Dashboard...</div>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xl">
        <div className="flex items-center gap-4">
          <Wallet className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">Finance Dashboard</h1>
            <p className="text-sm text-gray-400">
              {currentMonthName} • {organization?.name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase">Logged In</p>
          <p className="text-cyan-300 font-medium">{user?.username || "Finance User"}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 border-r border-gray-800 bg-gray-900/60 flex flex-col">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-cyan-300">Finance Panel</h2>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {/* <button
              onClick={() => navigate("/finance/monthly-budgets")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Wallet className="h-5 w-5 text-cyan-400" />
              <span>Monthly Budgets</span>
            </button> */}

            {/* <button
              onClick={() => navigate("/finance/reports")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <BarChart3 className="h-5 w-5 text-teal-400" />
              <span>Finance Reports</span>
            </button> */}

            <button
              onClick={() => navigate("/vendors")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Building2 className="h-5 w-5 text-purple-400" />
              <span>Vendors</span>
            </button>

            <button
              onClick={() => navigate("/vendor-invoice")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FileCheck className="h-5 w-5 text-amber-400" />
              <span>Vendor Invoices</span>
            </button>

            <button
              onClick={() => navigate("/vendor-payment")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <CreditCard className="h-5 w-5 text-emerald-400" />
              <span>Vendor Payments</span>
            </button>

            <button
              onClick={() => navigate("/accounts/vouchers")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FileText className="h-5 w-5 text-blue-400" />
              <span>Vouchers</span>
            </button>
            <button
              onClick={() => navigate("/bank-reconciliation")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FileText className="h-5 w-5 text-blue-400" />
              <span>Bank Reconciliations</span>
            </button>
            <button
              onClick={() => navigate("/gst-reconciliation")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FileText className="h-5 w-5 text-blue-400" />
              <span>GST Reconciliations</span>
            </button>
            <button
              onClick={() => navigate("/items/create")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Layers3 className="h-5 w-5 text-pink-400" />
              <span>Manage Items</span>
            </button>
             <button
              onClick={() => navigate("/profit-loss")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Layers3 className="h-5 w-5 text-pink-400" />
              <span>Profit & Loss</span>
            </button>
            <button
              onClick={() => navigate("/balance-sheet")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <Layers3 className="h-5 w-5 text-pink-400" />
              <span>Balance Sheet</span>
            </button>
            

            <button
              onClick={refreshAllocations}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800/70 text-left transition"
            >
              <FiRefreshCw className="h-5 w-5 text-cyan-400" />
              <span>Refresh Allocations</span>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-800 mt-auto">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 overflow-auto pb-28">
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center gap-2 ${
                messageType === "success"
                  ? "border-green-700/50 bg-green-900/20 text-green-300"
                  : messageType === "warning"
                  ? "border-yellow-700/50 bg-yellow-900/20 text-yellow-300"
                  : "border-red-700/50 bg-red-900/20 text-red-300"
              }`}
            >
              {messageType === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <KpiCard title="Released Budget" value={releasedBudget} />
            <KpiCard title="Allocated Amount" value={totalAllocated} />
            <KpiCard title="Remaining Balance" value={remaining} highlight={remaining < 0 ? "danger" : "normal"} />

            <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-lg hover:shadow-cyan-900/20 transition">
              <p className="text-sm text-purple-400/80 uppercase mb-1">Total Vendors</p>
              <p className="text-4xl font-bold text-purple-300">{vendorStats.total}</p>
              <div className="mt-4 flex justify-between text-sm text-gray-400">
                <span>Active: {vendorStats.active}</span>
                <span>Approved: {vendorStats.approved}</span>
              </div>
            </div>
          </div>

          {budget && (
            <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-xl mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
                    <PieChart className="h-6 w-6" /> Department Budget Allocation
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Budget for {currentMonthName}
                  </p>
                </div>

                {!budget?.is_closed && (
                  <button
                    onClick={handleAllocateBudget}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
                  >
                    <FiDollarSign /> Allocate Budget
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {DEPARTMENTS.map((dept) => (
                  <div
                    key={dept}
                    className="bg-gray-950/60 border border-cyan-900/30 rounded-2xl p-5"
                  >
                    <p className="text-cyan-300 font-semibold mb-3">{dept}</p>
                    <input
                      type="text"
                      value={budgetSplit[dept] || "0"}
                      onChange={(e) => handleAllocationChange(dept, e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-cyan-200 outline-none"
                      placeholder="0.00"
                      disabled={budget?.is_closed}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                <InfoCard title="Budget Released" value={`₹ ${Number(releasedBudget).toLocaleString()}`} />
                <InfoCard title="Total Allocated" value={`₹ ${Number(totalAllocated).toLocaleString()}`} />
                <InfoCard
                  title="Remaining Balance"
                  value={`₹ ${Number(remaining).toLocaleString()}`}
                  danger={remaining < 0}
                />
              </div>
            </div>
          )}

          <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6 flex items-center gap-3">
              <FiPlus /> Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionButton title="Create Voucher" icon={<FiPlus />} onClick={() => navigate("/vendor-payments/create")} />
              <QuickActionButton title="Manage Budgets" icon={<FiDollarSign />} onClick={() => navigate("/finance/budgets")} />
              <QuickActionButton title="Manage Vendors" icon={<FiUsers />} onClick={() => navigate("/vendors")} />
              <QuickActionButton title="View Reports" icon={<FiEye />} onClick={() => navigate("/finance/reports")} />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-72 right-0 bg-gray-950/95 backdrop-blur-md border-t border-cyan-800 px-6 py-4 flex items-center z-50">
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

      {showAlert && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-cyan-700 text-cyan-200 px-8 py-4 rounded-xl shadow-2xl z-50">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, highlight = "normal" }) => (
  <div
    className={`bg-gray-900/70 border rounded-2xl p-6 shadow-lg transition ${
      highlight === "danger"
        ? "border-red-700/50 text-red-300"
        : "border-cyan-900/40 text-cyan-300"
    }`}
  >
    <p className="text-sm uppercase text-gray-400 mb-2">{title}</p>
    <p className="text-4xl font-bold">₹ {Number(value || 0).toLocaleString()}</p>
  </div>
);

const InfoCard = ({ title, value, danger = false }) => (
  <div
    className={`rounded-2xl p-5 border ${
      danger
        ? "bg-red-950/30 border-red-700/50 text-red-300"
        : "bg-gray-950/60 border-cyan-900/30 text-cyan-300"
    }`}
  >
    <p className="text-sm text-gray-400 mb-2">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const QuickActionButton = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-950/60 border border-cyan-900/30 hover:border-cyan-500 hover:bg-gray-900 rounded-2xl p-5 flex items-center gap-3 transition text-left"
  >
    <div className="text-cyan-400 text-xl">{icon}</div>
    <span className="text-gray-200 font-medium">{title}</span>
  </button>
);

export default FinanceDashboard;

