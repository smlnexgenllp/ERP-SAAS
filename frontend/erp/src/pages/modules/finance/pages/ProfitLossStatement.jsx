// src/pages/finance/ProfitLossStatement.jsx
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

      const profitMargin = sales > 0 ? ((netProfit / sales) * 100).toFixed(2) : 0;

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
      color: "emerald",
    },
    {
      title: "Total Purchase",
      value: reportData.total_purchase,
      icon: <FiShoppingCart />,
      color: "blue",
    },
    {
      title: "Gross Profit",
      value: reportData.gross_profit,
      icon: <FiPieChart />,
      color: "purple",
    },
    {
      title: "Total Expense",
      value: reportData.total_expense,
      icon: <FiCreditCard />,
      color: "orange",
    },
    {
      title: "Net Profit",
      value: reportData.net_profit,
      icon: <FiDollarSign />,
      color: reportData.net_profit >= 0 ? "emerald" : "red",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Generating Profit & Loss Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-700 flex items-center justify-center shadow-lg">
              <FiTrendingUp className="text-white text-5xl" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
                Profit & Loss Statement
              </h1>
              <p className="text-zinc-500 text-lg mt-2">
                Revenue, expenses and profitability overview
              </p>
            </div>
          </div>

          <button
            onClick={fetchProfitLoss}
            className="flex items-center gap-3 px-8 py-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium shadow-sm"
          >
            <FiRefreshCw size={20} />
            Refresh Report
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6 mb-12">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white border border-zinc-200 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl
                  ${card.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
                  ${card.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                  ${card.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                  ${card.color === 'orange' ? 'bg-orange-100 text-orange-600' : ''}
                  ${card.color === 'red' ? 'bg-red-100 text-red-600' : ''}`}>
                  {card.icon}
                </div>
                <div className="text-xs font-medium uppercase tracking-widest text-zinc-400">FINANCE</div>
              </div>

              <p className="text-zinc-500 text-sm font-medium mb-3">{card.title}</p>
              <h2 className="text-4xl font-bold text-zinc-900 tracking-tight">
                {formatCurrency(card.value)}
              </h2>
            </div>
          ))}
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Revenue Section */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900">Revenue Details</h2>
                <p className="text-zinc-500 mt-2">Sales and purchase breakdown</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <FiArrowUpRight className="text-emerald-600 text-3xl" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
                <div>
                  <p className="text-zinc-700 font-medium">Total Sales Revenue</p>
                  <p className="text-sm text-zinc-500">From all invoices</p>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(reportData.total_sales)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
                <div>
                  <p className="text-zinc-700 font-medium">Total Purchase Cost</p>
                  <p className="text-sm text-zinc-500">Cost of goods & services</p>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reportData.total_purchase)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
                <div>
                  <p className="text-zinc-700 font-medium">Gross Profit</p>
                  <p className="text-sm text-zinc-500">Sales minus Purchase</p>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(reportData.gross_profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Expense & Profit Section */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-zinc-900">Expense & Profit</h2>
                <p className="text-zinc-500 mt-2">Final profitability overview</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                <FiArrowDownRight className="text-red-600 text-3xl" />
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
                <div>
                  <p className="text-zinc-700 font-medium">Total Expenses</p>
                  <p className="text-sm text-zinc-500">All operating expenses</p>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.total_expense)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-6">
                <div>
                  <p className="text-zinc-700 font-medium">Net Profit</p>
                  <p className="text-sm text-zinc-500">After all expenses</p>
                </div>
                <span className={`text-2xl font-bold ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(reportData.net_profit)}
                </span>
              </div>
            </div>

            {/* Profit Margin Bar */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-700 font-medium text-lg">Profit Margin</span>
                <span className={`text-3xl font-bold ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {reportData.profit_margin}%
                </span>
              </div>

              <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${reportData.net_profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(Math.abs(reportData.profit_margin), 100)}%` }}
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