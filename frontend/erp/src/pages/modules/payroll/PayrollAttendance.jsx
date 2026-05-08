// PayrollAttendance.jsx
import React, { useEffect, useState } from "react";
import api from "../../../services/api";

const PayrollAttendance = ({ month }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/hr/attendance-summary/?month=${month}`);
        setData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch attendance:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [month]);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto"></div>
        <p className="text-zinc-500 mt-4">Loading attendance summary...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No attendance data available for {month || "the selected month"}.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-zinc-900 mb-6 flex items-center gap-3">
        Attendance Summary 
        <span className="text-zinc-500 text-lg font-normal">• {month}</span>
      </h3>

      <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-5 text-left font-semibold text-zinc-600">Employee</th>
              <th className="px-6 py-5 text-center font-semibold text-zinc-600">Present Days</th>
              <th className="px-6 py-5 text-center font-semibold text-zinc-600">Total Hours</th>
              <th className="px-6 py-5 text-center font-semibold text-amber-600">OT Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.map((row) => (
              <tr key={row.employee_id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-5 font-medium text-zinc-900">
                  {row.employee_name}
                </td>
                <td className="px-6 py-5 text-center text-zinc-700 font-medium">
                  {row.present_days}
                </td>
                <td className="px-6 py-5 text-center text-zinc-700">
                  {row.total_hours.toFixed(1)}
                </td>
                <td className="px-6 py-5 text-center font-semibold text-amber-600">
                  {row.ot_hours.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollAttendance;