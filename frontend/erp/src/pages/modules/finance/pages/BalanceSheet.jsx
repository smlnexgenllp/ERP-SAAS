
import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  FiRefreshCw,
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiCreditCard,
  FiDollarSign,
} from "react-icons/fi";

const BalanceSheet = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [reportData, setReportData] = useState({
    total_assets: 0,
    total_liabilities: 0,
    total_equity: 0,
    cash_balance: 0,
    receivables: 0,
    payables: 0,
    inventory_value: 0,
    fixed_assets: 0,
    current_assets: 0,
    long_term_liabilities: 0,
  });

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/finance/balance-sheet/?month=${selectedMonth}`
      );

      setReportData({
        total_assets: Number(res.data.total_assets || 0),
        total_liabilities: Number(res.data.total_liabilities || 0),
        total_equity: Number(res.data.total_equity || 0),
        cash_balance: Number(res.data.cash_balance || 0),
        receivables: Number(res.data.receivables || 0),
        payables: Number(res.data.payables || 0),
        inventory_value: Number(res.data.inventory_value || 0),
        fixed_assets: Number(res.data.fixed_assets || 0),
        current_assets: Number(res.data.current_assets || 0),
        long_term_liabilities: Number(
          res.data.long_term_liabilities || 0
        ),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [selectedMonth]);

  const formatCurrency = (value) => {
    return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const downloadReport = async () => {
    try {
      const response = await api.get(
        `/finance/balance-sheet/download/?month=${selectedMonth}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `balance-sheet-${selectedMonth}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]">
        <div className="text-[#0a6ed1] text-lg font-semibold animate-pulse">
          Loading Balance Sheet...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <h1 className="text-3xl font-bold text-[#0f172a] mb-2">
                Balance Sheet
              </h1>
              <p className="text-gray-500 text-sm">
                SAP ERP style financial overview for assets, liabilities and equity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 bg-white">
                <FiCalendar className="text-[#0a6ed1]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="outline-none bg-transparent text-sm"
                />
              </div>

              <button
                onClick={fetchBalanceSheet}
                className="flex items-center gap-2 bg-[#0a6ed1] hover:bg-[#085caf] text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                <FiRefreshCw />
                Refresh
              </button>

              <button
                onClick={downloadReport}
                className="flex items-center gap-2 bg-[#107e3e] hover:bg-[#0f6d36] text-white px-5 py-2 rounded-lg text-sm font-medium"
              >
                <FiDownload />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
          {[
            {
              label: "Total Assets",
              value: reportData.total_assets,
              icon: <FiTrendingUp />,
              color: "bg-blue-50 text-blue-700",
            },
            {
              label: "Liabilities",
              value: reportData.total_liabilities,
              icon: <FiCreditCard />,
              color: "bg-red-50 text-red-700",
            },
            {
              label: "Equity",
              value: reportData.total_equity,
              icon: <FiDollarSign />,
              color: "bg-green-50 text-green-700",
            },
            {
              label: "Cash Balance",
              value: reportData.cash_balance,
              icon: <FiDollarSign />,
              color: "bg-yellow-50 text-yellow-700",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${card.color}`}>
                  {card.icon}
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Summary
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-2">{card.label}</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {formatCurrency(card.value)}
              </h2>
            </div>
          ))}
        </div>

        {/* SAP Style Table Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0a6ed1] text-white px-6 py-4 font-semibold text-lg">
              Assets
            </div>

            <div className="divide-y divide-gray-200">
              {[
                ["Cash Balance", reportData.cash_balance],
                ["Accounts Receivable", reportData.receivables],
                ["Inventory Value", reportData.inventory_value],
                ["Current Assets", reportData.current_assets],
                ["Fixed Assets", reportData.fixed_assets],
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <span className="text-gray-700 font-medium">{item[0]}</span>
                  <span className="text-slate-900 font-semibold">
                    {formatCurrency(item[1])}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between px-6 py-5 bg-blue-50 border-t border-blue-100">
                <span className="font-bold text-[#0a6ed1] text-lg">
                  Total Assets
                </span>
                <span className="font-bold text-[#0a6ed1] text-lg">
                  {formatCurrency(reportData.total_assets)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#bb0000] text-white px-6 py-4 font-semibold text-lg">
              Liabilities & Equity
            </div>

            <div className="divide-y divide-gray-200">
              {[
                ["Accounts Payable", reportData.payables],
                ["Long Term Liabilities", reportData.long_term_liabilities],
                ["Total Liabilities", reportData.total_liabilities],
                ["Owner Equity", reportData.total_equity],
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <span className="text-gray-700 font-medium">{item[0]}</span>
                  <span className="text-slate-900 font-semibold">
                    {formatCurrency(item[1])}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between px-6 py-5 bg-red-50 border-t border-red-100">
                <span className="font-bold text-red-700 text-lg">
                  Total Liabilities + Equity
                </span>
                <span className="font-bold text-red-700 text-lg">
                  {formatCurrency(
                    reportData.total_liabilities + reportData.total_equity
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;

