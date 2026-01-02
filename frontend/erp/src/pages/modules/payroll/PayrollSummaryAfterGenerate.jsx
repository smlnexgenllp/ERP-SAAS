import React, { useEffect, useState } from "react";
import api from "../../../services/api";

const PayrollSummaryAfterGenerate = ({ month }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) return;

    const fetchInvoices = async () => {
      setLoading(true);
      try {
        // Assuming you add an endpoint: /hr/invoices/?month=YYYY-MM
        const res = await api.get(`/hr/invoices/?month=${month}`);
        setInvoices(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [month]);

  if (loading) return <p>Loading payroll summary...</p>;
  if (invoices.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-green-400 font-bold text-xl mb-4">Generated Payroll Summary</h3>
      <table className="w-full border border-cyan-800">
        <thead className="bg-gray-800 text-cyan-300">
          <tr>
            <th className="p-3 text-left">Employee</th>
            <th className="p-3">Gross</th>
            <th className="p-3">Deductions</th>
            <th className="p-3 text-green-400">Net Payable</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="p-3">{inv.employee.full_name}</td>
              <td className="p-3">₹{inv.gross_salary}</td>
              <td className="p-3 text-red-400">-₹{inv.total_deductions}</td>
              <td className="p-3 text-green-400 font-bold">₹{inv.net_salary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};