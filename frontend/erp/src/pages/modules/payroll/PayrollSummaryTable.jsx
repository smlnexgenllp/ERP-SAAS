// components/modules/payroll/PayrollSummaryTable.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { Download } from "lucide-react";

const PayrollSummaryTable = ({ month }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalNet, setTotalNet] = useState(0);

  useEffect(() => {
    if (!month) {
      setInvoices([]);
      return;
    }

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/payroll/invoices/?month=${month}`);
        const data = res.data.invoices || [];
        setInvoices(data);

        const total = data.reduce(
          (sum, inv) => sum + parseFloat(inv.net_salary),
          0
        );
        setTotalNet(total);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [month]);

  if (!month) return null;
  if (loading)
    return <p className="text-cyan-400">Loading payroll summary...</p>;
  if (invoices.length === 0)
    return (
      <p className="text-gray-500">No payroll generated for {month} yet.</p>
    );

  const monthName = new Date(`${month}-01`).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-green-400">
          Payroll Summary - {monthName}
        </h3>
        <div className="text-right">
          <p className="text-gray-400">Total Employees</p>
          <p className="text-2xl font-bold text-pink-400">{invoices.length}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Total Net Payable</p>
          <p className="text-3xl font-bold text-green-400">
            ₹{totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-cyan-800">
          <thead className="bg-gray-800 text-cyan-300">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3">Gross</th>
              <th className="p-3 text-red-400">Deductions</th>
              <th className="p-3 text-green-400 font-bold">Net Pay</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-cyan-900 hover:bg-gray-800/50"
              >
                <td className="p-3">{inv.employee_name}</td>
                <td className="p-3 text-gray-500">{inv.employee_code}</td>
                <td className="p-3">
                  ₹{parseFloat(inv.gross_salary).toFixed(2)}
                </td>
                <td className="p-3 text-red-400">
                  -₹{parseFloat(inv.total_deductions).toFixed(2)}
                </td>
                <td className="p-3 text-green-400 font-bold">
                  ₹
                  {parseFloat(inv.net_salary).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>

                <td className="p-3 text-center">
                  <span
                    className={`px-3 py-2 rounded-full text-xs font-bold
    ${
      inv.status === "GENERATED"
        ? "bg-yellow-900/50 text-yellow-300"
        : inv.status === "PAID"
        ? "bg-green-900/50 text-green-300"
        : "bg-gray-700 text-gray-300"
    }`}
                  >
                    {inv.status}
                  </span>

                  <a
                    href={`/api/hr/payroll/payslip/${inv.id}/pdf/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-block px-5 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 
               text-black font-bold rounded-lg hover:opacity-90 transition text-sm"
                  >
                    <span className="flex justify-center gap-2">
                      {" "}
                      <Download /> PAYSLIP
                    </span>
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
