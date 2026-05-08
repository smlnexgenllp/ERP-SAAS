// components/modules/payroll/PayrollSummaryTable.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Download, Loader2 } from "lucide-react";

const PayrollSummaryTable = ({ month }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalNet, setTotalNet] = useState(0);

  useEffect(() => {
    if (!month) {
      setInvoices([]);
      setTotalNet(0);
      return;
    }

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/payroll/invoices/?month=${month}`);
        const data = res.data.invoices || [];
        setInvoices(data);

        const total = data.reduce(
          (sum, inv) => sum + parseFloat(inv.net_salary || 0),
          0
        );
        setTotalNet(total);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
        setTotalNet(0);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [month]);

  if (!month) return null;

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-600" />
        <p className="text-zinc-500 mt-4">Loading payroll summary...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No payroll generated for {month} yet.</p>
      </div>
    );
  }

  const monthName = new Date(`${month}-01`).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-6">
        <h3 className="text-2xl font-semibold text-zinc-900">
          Payroll Summary - {monthName}
        </h3>

        <div className="flex gap-10">
          <div>
            <p className="text-zinc-500 text-sm">Total Employees</p>
            <p className="text-3xl font-bold text-zinc-900">{invoices.length}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">Total Net Payable</p>
            <p className="text-3xl font-bold text-emerald-600">
              ₹{totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-5 text-left font-semibold text-zinc-600">Employee</th>
              <th className="px-6 py-5 text-left font-semibold text-zinc-600">Code</th>
              <th className="px-6 py-5 text-right font-semibold text-zinc-600">Gross Salary</th>
              <th className="px-6 py-5 text-right font-semibold text-red-600">Deductions</th>
              <th className="px-6 py-5 text-right font-semibold text-emerald-600">Net Pay</th>
              <th className="px-6 py-5 text-center font-semibold text-zinc-600">Status</th>
              <th className="px-6 py-5 text-center font-semibold text-zinc-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-5 font-medium text-zinc-900">
                  {inv.employee_name}
                </td>
                <td className="px-6 py-5 text-zinc-500">{inv.employee_code}</td>
                <td className="px-6 py-5 text-right text-zinc-700">
                  ₹{parseFloat(inv.gross_salary || 0).toFixed(2)}
                </td>
                <td className="px-6 py-5 text-right text-red-600">
                  -₹{parseFloat(inv.total_deductions || 0).toFixed(2)}
                </td>
                <td className="px-6 py-5 text-right font-semibold text-emerald-600">
                  ₹{parseFloat(inv.net_salary || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold
                      ${inv.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : inv.status === "GENERATED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-600"
                      }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <a
                    href={`/api/hr/payroll/payslip/${inv.id}/pdf/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-2xl text-sm font-medium transition"
                  >
                    <Download size={18} />
                    Payslip
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollSummaryTable;