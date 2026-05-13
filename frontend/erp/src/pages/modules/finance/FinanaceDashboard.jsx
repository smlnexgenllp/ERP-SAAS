import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import {
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
  FiUsers,
  FiEye,
  FiRefreshCw,
  FiMenu,
  FiX,
} from "react-icons/fi";
import {
  Wallet,
  Building2,
  FileCheck,
  CreditCard,
  FileText,
  Layers3,
  PieChart,
  LogOut,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ==================== ALL FUNCTIONS ====================
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
        params: { year: currentYear, month: currentMonthPadded },
      });

      let currentBudget = res.data.find((b) => b.released === true);
      if (!currentBudget && res.data.length > 0) currentBudget = res.data[0];

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

  const totalAllocated = Object.values(budgetSplit).reduce((sum, val) => sum + parseFloat(val || 0), 0);
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading Finance Dashboard...</p>
        </div>
      </div>
    );
  }

  const currentMonthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-zinc-100">
      {/* Fixed Sidebar */}
      <div className={`w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden fixed lg:static z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Finance</h2>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <button onClick={() => { navigate("/vendors"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <Building2 className="h-4 w-4" /> <span>Vendors</span>
          </button>
          <button onClick={() => { navigate("/vendor-invoice"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <FileCheck className="h-4 w-4" /> <span>Vendor Invoices</span>
          </button>
          <button onClick={() => { navigate("/vendor-payment"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <CreditCard className="h-4 w-4" /> <span>Vendor Payments</span>
          </button>
          <button onClick={() => { navigate("/accounts/vouchers"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <FileText className="h-4 w-4" /> <span>Vouchers</span>
          </button>
          <button onClick={() => { navigate("/bank-reconciliation"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <FileText className="h-4 w-4" /> <span>Bank Reconciliations</span>
          </button>
          <button onClick={() => { navigate("/gst-reconciliation"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <FileText className="h-4 w-4" /> <span>GST Reconciliations</span>
          </button>
          <button onClick={() => { navigate("/items/create"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <Layers3 className="h-4 w-4" /> <span>Manage Items</span>
          </button>
          <button onClick={() => { navigate("/profit-loss"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <Layers3 className="h-4 w-4" /> <span>Profit & Loss</span>
          </button>
          <button onClick={() => { navigate("/balance-sheet"); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <Layers3 className="h-4 w-4" /> <span>Balance Sheet</span>
          </button>

          <button onClick={() => { refreshAllocations(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-l font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200">
            <FiRefreshCw className="h-4 w-4" /> <span>Refresh Allocations</span>
          </button>
        </nav>

        <div className="p-3 border-t border-zinc-800 mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 text-red-300 hover:text-red-200 transition text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 lg:hidden z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:ml-0">
        {/* Fixed Header */}
        <header className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-zinc-700 hover:bg-zinc-100 rounded-lg"
            >
              {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">Finance Dashboard</h1>
                <p className="text-zinc-500 text-xs">{currentMonthName} • {organization?.name || "Organization"}</p>
              </div>
            </div>
          </div>

          <div className="hidden sm:block text-right">
            <p className="font-medium text-zinc-900 text-sm">{user?.username || "Finance User"}</p>
            <p className="text-xs text-zinc-500">Finance Module</p>
          </div>
        </header>

        {/* Scrollable Main Content - ONLY THIS SCROLLS */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">
          {message && (
            <div className={`mb-5 px-4 py-3 rounded-xl flex items-center gap-2 text-sm border ${messageType === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                messageType === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                  "bg-red-50 border-red-200 text-red-700"
              }`}>
              {messageType === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
              {message}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Released Budget" value={releasedBudget} />
            <KpiCard title="Allocated Amount" value={totalAllocated} />
            <KpiCard title="Remaining Balance" value={remaining} highlight={remaining < 0 ? "danger" : "normal"} />

            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow transition-all">
              <p className="text-xs font-medium text-zinc-500">Total Vendors</p>
              <p className="text-2xl font-bold text-zinc-900 tracking-tighter mt-2">{vendorStats.total}</p>
              <div className="mt-3 flex justify-between text-xs text-zinc-600">
                <span>Active: <strong>{vendorStats.active}</strong></span>
                <span>Approved: <strong>{vendorStats.approved}</strong></span>
              </div>
            </div>
          </div>

          {/* Budget Allocation */}
          {budget && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 flex items-center gap-2">
                    <PieChart className="h-5 w-5" /> Department Budget Allocation
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Budget for {currentMonthName}</p>
                </div>

                {!budget?.is_closed && (
                  <button
                    onClick={handleAllocateBudget}
                    className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition"
                  >
                    <FiDollarSign size={16} />
                    Allocate Budget
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DEPARTMENTS.map((dept) => (
                  <div key={dept} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                    <p className="font-semibold text-zinc-700 text-sm mb-2">{dept}</p>
                    <input
                      type="text"
                      value={budgetSplit[dept] || "0"}
                      onChange={(e) => handleAllocationChange(dept, e.target.value)}
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-500 rounded-xl px-3 py-2 text-sm outline-none"
                      placeholder="0.00"
                      disabled={budget?.is_closed}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <InfoCard title="Budget Released" value={`₹ ${Number(releasedBudget).toLocaleString()}`} />
                <InfoCard title="Total Allocated" value={`₹ ${Number(totalAllocated).toLocaleString()}`} />
                <InfoCard title="Remaining Balance" value={`₹ ${Number(remaining).toLocaleString()}`} danger={remaining < 0} />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <FiPlus size={18} /> Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <QuickActionButton title="Create Voucher" icon={<FiPlus size={16} />} onClick={() => navigate("/vendor-payments/create")} />
              <QuickActionButton title="Manage Budgets" icon={<FiDollarSign size={16} />} onClick={() => navigate("/finance/budgets")} />
              <QuickActionButton title="Manage Vendors" icon={<FiUsers size={16} />} onClick={() => navigate("/vendors")} />
              <QuickActionButton title="View Reports" icon={<FiEye size={16} />} onClick={() => navigate("/finance/reports")} />
            </div>
          </div>
        </main>
      </div>

      {/* Command Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-zinc-200 px-4 py-2 flex items-center z-50 shadow">
        <span className="text-zinc-400 font-bold mr-3 text-base">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command (help, vendors, vouchers, budget, allocate, logout...)"
          className="flex-1 bg-transparent text-zinc-700 outline-none font-mono text-sm"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {showAlert && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl shadow-2xl z-[60] border border-zinc-700 text-sm">
          {alertMessage}
        </div>
      )}
    </div>
  );
};

/* ===================== SUB COMPONENTS ===================== */
const KpiCard = ({ title, value, highlight = "normal" }) => (
  <div className={`bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:shadow transition-all ${highlight === "danger" ? "border-red-300" : ""}`}>
    <p className="text-xs font-medium text-zinc-500">{title}</p>
    <p className={`text-2xl font-bold tracking-tighter mt-2 ${highlight === "danger" ? "text-red-600" : "text-zinc-900"}`}>
      ₹ {Number(value || 0).toLocaleString()}
    </p>
  </div>
);

const InfoCard = ({ title, value, danger = false }) => (
  <div className={`rounded-xl p-4 border ${danger ? "bg-red-50 border-red-200 text-red-700" : "bg-zinc-50 border-zinc-200 text-zinc-800"}`}>
    <p className="text-xs text-zinc-500 mb-1">{title}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);

const QuickActionButton = ({ title, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-white border border-zinc-200 hover:border-zinc-400 hover:shadow transition-all rounded-xl p-3 flex items-center gap-3 text-left"
  >
    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-700">
      {icon}
    </div>
    <span className="font-medium text-zinc-800 text-sm">{title}</span>
  </button>
);

export default FinanceDashboard;