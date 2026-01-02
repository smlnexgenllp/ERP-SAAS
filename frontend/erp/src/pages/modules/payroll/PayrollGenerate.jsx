import React, { useState } from "react";
import api from "../../../services/api";

const PayrollGenerate = ({ month, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const generatePayroll = async () => {
    if (!month) {
      alert("Please select a month first");
      return;
    }

    if (!confirm(`Generate payroll for ${month}? This will create invoices for all employees.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/hr/generate-invoices/", { month });
      alert(res.data.message || "Payroll generated successfully!");
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to generate payroll";
      alert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePayroll}
      disabled={loading || !month}
      className="bg-gradient-to-r from-pink-500 to-purple-600 text-black px-8 py-3 rounded-lg font-bold
                 hover:from-pink-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed
                 transition shadow-lg"
    >
      {loading ? "GENERATING PAYROLL..." : "GENERATE PAYROLL"}
    </button>
  );
};

export default PayrollGenerate;