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

  if (loading) return <p className="text-cyan-400">Loading attendance summary...</p>;
  if (data.length === 0) return <p className="text-gray-500">No attendance data for selected month.</p>;

  return (
    <div className="overflow-x-auto mt-6">
      <h3 className="text-pink-400 mb-4 font-bold text-lg">Attendance Summary - {month}</h3>
      <table className="w-full text-sm border border-cyan-800">
        <thead className="bg-gray-800 text-cyan-300">
          <tr>
            <th className="p-3 text-left">Employee</th>
            <th className="p-3">Present Days</th>
            <th className="p-3">Total Hours</th>
            <th className="p-3 text-pink-400">OT Hours</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.employee_id} className="border-t border-cyan-900">
              <td className="p-3">{row.employee_name}</td>
              <td className="p-3 text-center">{row.present_days}</td>
              <td className="p-3 text-center">{row.total_hours.toFixed(1)}</td>
              <td className="p-3 text-center text-pink-400 font-semibold">
                {row.ot_hours.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayrollAttendance;