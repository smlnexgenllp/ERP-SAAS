import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CustomerLedger() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ledger, setLedger] = useState([]);
  const [filteredLedger, setFilteredLedger] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [summary, setSummary] = useState({
    debit: 0,
    credit: 0,
    balance: 0,
  });

  // ================= FETCH =================
  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await api.get(`/sale/customer-ledger/${id}/`);
      const data = res.data || [];

      setLedger(data);
      setFilteredLedger(data);
      calculateSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FILTER =================
  useEffect(() => {
    let data = [...ledger];

    if (fromDate) {
      data = data.filter((row) => new Date(row.date) >= new Date(fromDate));
    }

    if (toDate) {
      data = data.filter((row) => new Date(row.date) <= new Date(toDate));
    }

    setFilteredLedger(data);
    calculateSummary(data);
  }, [fromDate, toDate, ledger]);

  // ================= SUMMARY =================
  const calculateSummary = (data) => {
    let debit = 0;
    let credit = 0;

    data.forEach((row) => {
      debit += Number(row.debit || 0);
      credit += Number(row.credit || 0);
    });

    setSummary({
      debit,
      credit,
      balance: debit - credit,
    });
  };

  // ================= FORMAT =================
  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN");

  // ================= UI =================
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded shadow">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Customer Ledger</h1>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Debit</p>
          <h2 className="text-xl font-bold text-red-600">
            {formatCurrency(summary.debit)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Credit</p>
          <h2 className="text-xl font-bold text-green-600">
            {formatCurrency(summary.credit)}
          </h2>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Balance</p>
          <h2 className="text-xl font-bold text-blue-600">
            {formatCurrency(summary.balance)}
          </h2>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex gap-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b sticky top-0">
            <tr>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Reference</th>
              <th className="p-4 text-right">Debit</th>
              <th className="p-4 text-right">Credit</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {filteredLedger.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-4">{formatDate(row.date)}</td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      row.type === "Invoice"
                        ? "bg-red-100 text-red-600"
                        : row.type === "Payment"
                        ? "bg-green-100 text-green-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {row.type}
                  </span>
                </td>

                <td className="p-4 font-medium">{row.ref}</td>

                <td className="p-4 text-right text-red-600">
                  {row.debit ? formatCurrency(row.debit) : "-"}
                </td>

                <td className="p-4 text-right text-green-600">
                  {row.credit ? formatCurrency(row.credit) : "-"}
                </td>

                <td className="p-4 text-right font-semibold">
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-4 text-right text-sm text-gray-600">
        Showing {filteredLedger.length} entries
      </div>
    </div>
  );
}