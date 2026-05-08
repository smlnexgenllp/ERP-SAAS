import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Loader2 } from "lucide-react";

const PayrollSummaryAfterGenerate = ({ month }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) {
      setInvoices([]);
      return;
    }

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/invoices/?month=${month}`);
        setInvoices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [month]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-600" />
        <p className="text-zinc-500 mt-4">Loading payroll summary...</p>
      </div>
    );
  }

  if (invoices.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-semibold text-zinc-900 mb-6">
        Generated Payroll Summary - {month}
      </h3>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-5 text-left font-semibold text-zinc-600">Employee</th>
              <th className="px-6 py-5 text-right font-semibold text-zinc-600">Gross Salary</th>
              <th className="px-6 py-5 text-right font-semibold text-red-600">Deductions</th>
              <th className="px-6 py-5 text-right font-semibold text-emerald-600">Net Payable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-5 font-medium text-zinc-900">
                  {inv.employee?.full_name || inv.employee_name || "—"}
                </td>
                <td className="px-6 py-5 text-right text-zinc-700">
                  ₹{parseFloat(inv.gross_salary || 0).toFixed(2)}
                </td>
                <td className="px-6 py-5 text-right text-red-600">
                  -₹{parseFloat(inv.total_deductions || 0).toFixed(2)}
                </td>
                <td className="px-6 py-5 text-right font-semibold text-emerald-600">
                  ₹{parseFloat(inv.net_salary || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollSummaryAfterGenerate;