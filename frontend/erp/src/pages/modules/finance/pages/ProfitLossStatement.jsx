
import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  FiTrendingUp,
  FiDollarSign,
  FiRefreshCw,
  FiArrowUpRight,
  FiArrowDownRight,
  FiShoppingCart,
  FiPieChart,
  FiCreditCard,
} from "react-icons/fi";

const ProfitLossStatement = () => {
  const [loading, setLoading] = useState(true);

  const [reportData, setReportData] = useState({
    total_sales: 0,
    total_purchase: 0,
    gross_profit: 0,
    total_expense: 0,
    net_profit: 0,
    profit_margin: 0,
  });

  const fetchProfitLoss = async () => {
    try {
      setLoading(true);

      const res = await api.get("/finance/profit-loss/");

      const sales = Number(res.data.sales || 0);
      const expenses = Number(res.data.expenses || 0);
      const netProfit = Number(res.data.net_profit || 0);
      const grossProfit = sales - expenses;

      const profitMargin =
        sales > 0 ? ((netProfit / sales) * 100).toFixed(2) : 0;

      setReportData({
        total_sales: sales,
        total_purchase: expenses,
        gross_profit: grossProfit,
        total_expense: expenses,
        net_profit: netProfit,
        profit_margin: profitMargin,
      });
    } catch (err) {
      console.error("Failed to fetch profit & loss report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, []);

  const formatCurrency = (value) => {
    return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const cards = [
    {
      title: "Total Sales",
      value: reportData.total_sales,
      icon: <FiTrendingUp />,
      border: "border-cyan-500/30",
      bg: "from-cyan-500/10 to-cyan-900/5",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      textColor: "text-cyan-200",
    },
    {
      title: "Total Purchase",
      value: reportData.total_purchase,
      icon: <FiShoppingCart />,
      border: "border-blue-500/30",
      bg: "from-blue-500/10 to-blue-900/5",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      textColor: "text-blue-200",
    },
    {
      title: "Gross Profit",
      value: reportData.gross_profit,
      icon: <FiPieChart />,
      border: "border-purple-500/30",
      bg: "from-purple-500/10 to-purple-900/5",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      textColor: "text-purple-200",
    },
    {
      title: "Total Expense",
      value: reportData.total_expense,
      icon: <FiCreditCard />,
      border: "border-orange-500/30",
      bg: "from-orange-500/10 to-orange-900/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      textColor: "text-orange-200",
    },
    {
      title: "Net Profit",
      value: reportData.net_profit,
      icon: <FiDollarSign />,
      border:
        reportData.net_profit >= 0
          ? "border-emerald-500/30"
          : "border-red-500/30",
      bg:
        reportData.net_profit >= 0
          ? "from-emerald-500/10 to-emerald-900/5"
          : "from-red-500/10 to-red-900/5",
      iconBg:
        reportData.net_profit >= 0
          ? "bg-emerald-500/10"
          : "bg-red-500/10",
      iconColor:
        reportData.net_profit >= 0
          ? "text-emerald-400"
          : "text-red-400",
      textColor:
        reportData.net_profit >= 0
          ? "text-emerald-200"
          : "text-red-200",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="h-72 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white px-6 py-8 lg:px-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-24 h-24 rounded-[30px] bg-gradient-to-br from-cyan-500/20 to-cyan-700/10 border border-cyan-500/20 flex items-center justify-center shadow-2xl shadow-cyan-500/10">
              <FiTrendingUp className="text-cyan-400 text-5xl" />
            </div>

            <div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500 bg-clip-text text-transparent leading-tight">
                Profit & Loss Statement
              </h1>
              <p className="text-slate-400 text-lg md:text-xl mt-2">
                Revenue, purchase, expense and net profit overview
              </p>
            </div>
          </div>

          <button
            onClick={fetchProfitLoss}
            className="flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 transition-all duration-300 px-8 py-4 rounded-2xl text-lg font-semibold shadow-xl shadow-cyan-500/20"
          >
            <FiRefreshCw className="text-xl" />
            Refresh Report
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`rounded-[30px] border ${card.border} bg-gradient-to-br ${card.bg} backdrop-blur-xl p-6 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-8">
                <div
                  className={`w-16 h-16 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.iconColor} text-3xl`}
                >
                  {card.icon}
                </div>

                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[2px] text-slate-300 font-semibold">
                  Finance
                </div>
              </div>

              <p className="text-slate-400 text-sm uppercase tracking-[2px] mb-4">
                {card.title}
              </p>

              <h2 className={`text-4xl font-bold leading-tight ${card.textColor}`}>
                {formatCurrency(card.value)}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="bg-slate-900/70 border border-cyan-500/20 rounded-[30px] p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-cyan-300">
                  Revenue Details
                </h2>
                <p className="text-slate-500 mt-2">
                  Detailed breakdown of sales and purchases
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                <FiArrowUpRight className="text-cyan-400 text-2xl" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-slate-300 text-lg">Sales Revenue</p>
                  <p className="text-slate-500 text-sm mt-1">Total revenue from sales invoices</p>
                </div>
                <span className="text-cyan-300 text-2xl font-bold">
                  {formatCurrency(reportData.total_sales)}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-slate-300 text-lg">Purchase Cost</p>
                  <p className="text-slate-500 text-sm mt-1">Total purchase and stock cost</p>
                </div>
                <span className="text-orange-300 text-2xl font-bold">
                  {formatCurrency(reportData.total_purchase)}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-slate-300 text-lg">Gross Profit</p>
                  <p className="text-slate-500 text-sm mt-1">Sales minus purchases</p>
                </div>
                <span className="text-emerald-300 text-2xl font-bold">
                  {formatCurrency(reportData.gross_profit)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-emerald-500/20 rounded-[30px] p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-emerald-300">
                  Expense Summary
                </h2>
                <p className="text-slate-500 mt-2">
                  Expense and profitability overview
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FiArrowDownRight className="text-emerald-400 text-2xl" />
              </div>
            </div>

            <div className="space-y-5 mb-8">
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-slate-300 text-lg">Total Expenses</p>
                  <p className="text-slate-500 text-sm mt-1">All operating and purchase expenses</p>
                </div>
                <span className="text-red-300 text-2xl font-bold">
                  {formatCurrency(reportData.total_expense)}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-6 py-5">
                <div>
                  <p className="text-slate-300 text-lg">Net Profit</p>
                  <p className="text-slate-500 text-sm mt-1">Final profit after all expenses</p>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    reportData.net_profit >= 0
                      ? "text-emerald-300"
                      : "text-red-300"
                  }`}
                >
                  {formatCurrency(reportData.net_profit)}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-300 text-lg font-medium">
                  Profit Margin
                </span>
                <span
                  className={`text-2xl font-bold ${
                    reportData.net_profit >= 0
                      ? "text-cyan-300"
                      : "text-red-300"
                  }`}
                >
                  {reportData.profit_margin}%
                </span>
              </div>

              <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    reportData.net_profit >= 0
                      ? "bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-500"
                      : "bg-gradient-to-r from-red-400 to-red-600"
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.abs(Number(reportData.profit_margin)),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossStatement;