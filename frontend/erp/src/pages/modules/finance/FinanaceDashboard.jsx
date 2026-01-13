import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";

const DEPARTMENTS = ["HR", "Inventory", "Warehouse", "Sales"];

const FinanceDashboard = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const [budget, setBudget] = useState(null);
  const [allocation, setAllocation] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD BUDGET + ALLOCATION
  ========================= */
  const loadBudget = async () => {
    setLoading(true);
    setMessage("");

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

      const init = {};
      DEPARTMENTS.forEach((dep) => {
        init[dep] =
          released.department_allocations?.[dep.toUpperCase()] || "0";
      });

      setAllocation(init);
      setEditMode(false);
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

  /* =========================
     CALCULATIONS
  ========================= */
  const releasedAmount = Number(budget?.amount || 0);
  const totalAllocated = Object.values(allocation).reduce(
    (sum, val) => sum + Number(val || 0),
    0
  );
  const remaining = releasedAmount - totalAllocated;

  /* =========================
     SAVE ALLOCATION
  ========================= */
  const saveAllocation = async () => {
    if (totalAllocated > releasedAmount) {
      setMessage("Allocated amount exceeds released budget");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      await api.post(
        `/finance/monthly-budgets/${budget.id}/allocate/`,
        { allocation }
      );
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

  /* =========================
     CLOSE MONTH (LOCK)
  ========================= */
  const closeMonth = async () => {
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

  /* =========================
     RENDER
  ========================= */
  if (loading && !budget) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-cyan-300">
        Loading Finance Dashboard...
      </div>
    );
  }

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

        <div className="flex items-center gap-4">
          <StatusBadge budget={budget} />
          {!budget?.is_closed && (
            <button
              onClick={closeMonth}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <FiLock /> Close Month
            </button>
          )}
        </div>
      </div>

      {/* MESSAGE */}
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

      {/* KPI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KpiCard title="Released Budget" value={releasedAmount} />
        <KpiCard title="Allocated Amount" value={totalAllocated} />
        <KpiCard
          title="Remaining Balance"
          value={remaining}
          highlight={remaining < 0 ? "danger" : "normal"}
        />
      </div>

      {/* ALLOCATION PROGRESS */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-cyan-400 mb-2">
          <span>Allocation Progress</span>
          <span>
            {Math.min(100, (totalAllocated / releasedAmount) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              totalAllocated > releasedAmount ? "bg-red-600" : "bg-green-600"
            }`}
            style={{
              width: `${Math.min(100, (totalAllocated / releasedAmount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* DEPARTMENT ALLOCATION TABLE */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-300">
            Department Budget Allocation
          </h2>
          {!budget?.is_closed && (
            editMode ? (
              <button
                onClick={saveAllocation}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <FiSave /> Save Allocation
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <FiEdit /> Edit Allocation
              </button>
            )
          )}
        </div>

        <table className="w-full">
          <thead className="border-b border-cyan-800 text-cyan-400 text-sm">
            <tr>
              <th className="py-3 text-left">Department</th>
              <th className="py-3 text-right">Allocated Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map((dep) => (
              <tr key={dep} className="border-b border-cyan-800/40">
                <td className="py-4 font-medium">{dep}</td>
                <td className="py-4 text-right">
                  {editMode ? (
                    <input
                      type="number"
                      value={allocation[dep]}
                      onChange={(e) =>
                        setAllocation({ ...allocation, [dep]: e.target.value })
                      }
                      className="bg-gray-800 px-4 py-2 rounded text-right w-40"
                    />
                  ) : (
                    `₹ ${Number(allocation[dep] || 0).toLocaleString()}`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {budget?.is_closed && (
          <div className="mt-4 text-red-400 flex items-center gap-2">
            <FiLock /> This month is closed. Budget is locked.
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   STATUS BADGE COMPONENT
========================= */
const StatusBadge = ({ budget }) => {
  if (!budget) return null;

  if (budget.is_closed) {
    return (
      <span className="px-4 py-2 rounded bg-red-900 text-red-300 font-bold">
        CLOSED
      </span>
    );
  }
  if (budget.released) {
    return (
      <span className="px-4 py-2 rounded bg-green-900 text-green-300 font-bold">
        RELEASED
      </span>
    );
  }
  return (
    <span className="px-4 py-2 rounded bg-yellow-900 text-yellow-300 font-bold">
      DRAFT
    </span>
  );
};

/* =========================
   KPI CARD COMPONENT
========================= */
const KpiCard = ({ title, value, highlight = "normal" }) => (
  <div
    className={`rounded-xl p-6 border ${
      highlight === "danger"
        ? "border-red-700 bg-red-950 text-red-300"
        : "border-cyan-800 bg-gray-900 text-blue-300"
    } text-center`}
  >
    <FiDollarSign className="text-3xl mx-auto mb-2 text-blue-300" />
    <p className="text-cyan-400">{title}</p>
    <p className="text-2xl font-bold mt-2">₹ {Number(value).toLocaleString()}</p>
  </div>
);

export default FinanceDashboard;
