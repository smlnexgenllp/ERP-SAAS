import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import api from "../../../services/api";

// Optional: Add icons (install lucide-react if needed)
// import { TrendingUp, Users, Package, DollarSign, AlertTriangle, RefreshCw, Download } from "lucide-react";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    fromDate: "2026-01-01",
    toDate: "2026-12-31",
    organization: "",
    branch: "",
  });

  const [kpis, setKpis] = useState([]);
  const [summary, setSummary] = useState({
    revenue: 0,
    expense: 0,
    profit: 0,
    salesOrders: 0,
    customers: 0,
    quotations: 0,
    products: 0,
    inventoryValue: 0,
  });

  const [finance, setFinance] = useState({});

  // Charts
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [inventoryChart, setInventoryChart] = useState([]);
  const [crmChart, setCrmChart] = useState([]);

  // Tables & Lists
  const [topBranches, setTopBranches] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [activities, setActivities] = useState([]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/business/dashboard/", {
        params: filters,
      });

      console.log("API RESPONSE =", response.data);
      const data = response.data;

      // Summary
      setSummary({
        revenue: data.revenue || 0,
        expense: data.expense || 0,
        profit: data.profit || 0,
        salesOrders: data.sales_orders || 0,
        customers: data.customers || 0,
        quotations: data.quotations || 0,
        products: data.products || 0,
        inventoryValue: data.inventory_value || 0,
      });

      // KPI Cards
      setKpis([
        {
          title: "Total Revenue",
          value: `₹${Number(data.revenue || 0).toLocaleString()}`,
          color: "#10b981",
          icon: "₹",
        },
        {
          title: "Net Profit",
          value: `₹${Number(data.profit || 0).toLocaleString()}`,
          color: "#2563eb",
          icon: "₹",
        },
        {
          title: "Active Customers",
          value: Number(data.customers || 0).toLocaleString(),
          color: "#8b5cf6",
          icon: "👥",
        },
        {
          title: "Sales Orders",
          value: Number(data.sales_orders || 0).toLocaleString(),
          color: "#f59e0b",
          icon: "📦",
        },
      ]);

      // Charts Data - Enhanced with fallback for better visuals
      setMonthlyRevenue(
        data.monthly_revenue || [
          { month: "Current", revenue: data.revenue || 0, expense: data.expense || 0, profit: data.profit || 0 },
        ]
      );

      setSalesTrend(
        data.sales_trend || [
          { month: "Current", sales: data.sales_order_value || 0 },
        ]
      );

      setInventoryChart(
        data.inventory_status || [
          { name: "Current Stock", value: data.inventory_value || 0 },
          { name: "Revenue", value: data.revenue || 0 },
          { name: "Expense", value: data.expense || 0 },
        ]
      );

      setCrmChart([
        { name: "Won", value: data.won_opportunities || 0 },
        { name: "Lost", value: data.lost_opportunities || 0 },
        {
          name: "Pending",
          value:
            (data.opportunities || 0) -
            (data.won_opportunities || 0) -
            (data.lost_opportunities || 0),
        },
      ]);

      // Finance
      setFinance({
        monthlyBudget: data.monthly_budget || 0,
        allocatedBudget: data.allocated_budget || 0,
        remainingBudget: data.remaining_budget || 0,
        usedBudget: data.used_budget || 0,
        bankBalance: data.bank_balance || 0,
        vendors: data.vendors || 0,
        parties: data.parties || 0,
        ledgerDebit: data.ledger_debit || 0,
        ledgerCredit: data.ledger_credit || 0,
      });

      setTopBranches(data.top_branches || []);
      setRecentOrders(data.recent_orders || []);
      setTopCustomers(data.top_customers || []);
      setTopProducts(data.top_products || []);
      setLowStockItems(data.low_stock || []);
      setActivities(data.activities || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load Business Dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await fetchDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await api.get("/business/export/", {
        params: filters,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Business_Report_${filters.fromDate}_${filters.toDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed. Please try again.");
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-slate-600">
            Loading Business Intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-red-200 rounded-3xl p-10 max-w-md text-center shadow-xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{error}</h2>
          <button
            onClick={fetchDashboard}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-medium transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Business Analytics
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Real-time insights across Sales, Finance, CRM & Inventory
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-3">
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className="border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className="border border-slate-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-6 py-2.5 rounded-2xl font-medium transition disabled:opacity-70"
            >
              <span>↻</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={exportReport}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-medium transition"
            >
              📥 Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {kpis.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="flex justify-between items-start">
                <p className="text-slate-500 font-medium">{card.title}</p>
                <span className="text-3xl opacity-70 group-hover:scale-110 transition">{card.icon}</span>
              </div>
              <h2
                className="text-5xl font-bold mt-6 tracking-tighter"
                style={{ color: card.color }}
              >
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 mb-12">
          {[
            { label: "Revenue", value: `₹${summary.revenue.toLocaleString()}`, color: "text-emerald-600" },
            { label: "Expense", value: `₹${summary.expense.toLocaleString()}`, color: "text-rose-600" },
            { label: "Profit", value: `₹${summary.profit.toLocaleString()}`, color: "text-blue-600" },
            { label: "Orders", value: summary.salesOrders.toLocaleString() },
            { label: "Customers", value: summary.customers.toLocaleString() },
            { label: "Quotations", value: summary.quotations.toLocaleString() },
            { label: "Products", value: summary.products.toLocaleString() },
            { label: "Inventory", value: `₹${summary.inventoryValue.toLocaleString()}` },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">{item.label}</p>
              <h3 className={`text-3xl font-bold mt-3 ${item.color || ""}`}>
                {item.value}
              </h3>
            </div>
          ))}
        </div>

        {/* Finance Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-slate-800">Finance Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: "Monthly Budget", value: finance.monthlyBudget },
              { label: "Allocated", value: finance.allocatedBudget },
              { label: "Remaining", value: finance.remainingBudget, highlight: true },
              { label: "Bank Balance", value: finance.bankBalance },
              { label: "Vendors", value: finance.vendors },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm">{item.label}</p>
                <h3 className={`text-3xl font-bold mt-4 ${item.highlight ? "text-emerald-600" : ""}`}>
                  ₹{Number(item.value || 0).toLocaleString()}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Revenue Trend */}
          <div className="col-span-12 xl:col-span-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Revenue vs Expense vs Profit</h2>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} name="Revenue" dot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} name="Expense" dot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={4} name="Profit" dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CRM Pie */}
          <div className="col-span-12 xl:col-span-4 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">CRM Opportunities</h2>
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={crmChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {crmChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second Row Charts */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          {/* Sales Trend */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Monthly Sales Trend</h2>
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Inventory Bar */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Inventory Status</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={inventoryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Branches */}
        {topBranches.length > 0 && (
          <div className="mb-12 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Top Performing Branches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topBranches.map((branch, index) => (
                <div key={index} className="border border-slate-100 rounded-2xl p-6 hover:shadow-md transition">
                  <div className="font-semibold text-lg">{branch.name}</div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-slate-500">Revenue</span>
                    <span className="font-medium">₹{branch.revenue?.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">Orders</span>
                    <span className="font-medium">{branch.orders}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Row */}
        <div className="grid grid-cols-12 gap-8">
          {/* Top Customers */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Top Customers</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-4 font-medium text-slate-500">Customer</th>
                    <th className="text-right py-4 font-medium text-slate-500">Orders</th>
                    <th className="text-right py-4 font-medium text-slate-500">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length > 0 ? (
                    topCustomers.map((customer, index) => (
                      <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-5 font-medium">{customer.name}</td>
                        <td className="text-right py-5">{customer.orders}</td>
                        <td className="text-right py-5 font-semibold text-emerald-600">
                          ₹{customer.revenue?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-12 text-slate-400">
                        No customer data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Recent Sales Orders</h2>
            <div className="space-y-4 max-h-[460px] overflow-auto pr-2">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl p-5 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{order.order_number}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{order.customer}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₹{order.total?.toLocaleString()}</div>
                      <div className={`text-xs font-medium px-3 py-1 inline-block rounded-full mt-1 ${
                        order.status?.toLowerCase() === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-12 text-center">No recent orders</p>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock & Activities */}
        <div className="grid grid-cols-12 gap-8 mt-8">
          {/* Low Stock */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-2xl font-semibold">Low Stock Alert</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 font-medium text-slate-500">Product</th>
                    <th className="text-right py-4 font-medium text-slate-500">Available</th>
                    <th className="text-right py-4 font-medium text-slate-500">Min Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-red-50/50">
                        <td className="py-5 font-medium">{item.name}</td>
                        <td className="text-right text-red-600 font-semibold">{item.available_quantity}</td>
                        <td className="text-right text-slate-500">{item.minimum_stock}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-16 text-center text-slate-400">
                        All products are well stocked
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold mb-6">Recent Activities</h2>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex gap-5 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{activity.text}</p>
                      {activity.description && (
                        <p className="text-slate-500 text-sm mt-1">{activity.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-slate-400">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg opacity-90">Total Revenue</h3>
            <p className="text-5xl font-bold mt-6">₹{summary.revenue.toLocaleString()}</p>
            <p className="mt-4 opacity-75">Period: {filters.fromDate} — {filters.toDate}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg opacity-90">Net Profit</h3>
            <p className="text-5xl font-bold mt-6">₹{summary.profit.toLocaleString()}</p>
            <p className="mt-4 opacity-75">After all expenses</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg opacity-90">Inventory Value</h3>
            <p className="text-5xl font-bold mt-6">₹{summary.inventoryValue.toLocaleString()}</p>
            <p className="mt-4 opacity-75">Current valuation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;