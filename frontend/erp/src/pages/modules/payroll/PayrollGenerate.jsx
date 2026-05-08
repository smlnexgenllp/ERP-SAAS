import React, { useState } from "react";
import api from "../../../services/api";
import { Loader2 } from "lucide-react";

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
      className="flex items-center gap-3 px-8 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.985]"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          GENERATING PAYROLL...
        </>
      ) : (
        "GENERATE PAYROLL"
      )}
    </button>
  );
};

export default PayrollGenerate;