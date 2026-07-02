import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import api from "../../../services/api";

const AnalyticsDashboard = () => {
  const [kpis, setKpis] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [topBranches, setTopBranches] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    fromDate: "2026-01-01",
    toDate: "2026-06-30",
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/business/kpis/", {
        params: filters,
      });

      const data = response.data;

      setKpis(data.kpis || []);
      setMonthly(data.monthly || []);
      setTopBranches(data.top_branches || []);
      setActivities(data.recent_activities || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const handleExport = async () => {
    try {
      const response = await axios.get("/api/analytics/export/", {
        params: filters,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Business_Analytics_${filters.fromDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Export failed. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-xl">Loading Business Analytics...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-red-600 text-lg">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Business Analytics</h1>
            <p className="text-slate-600 mt-2">Real-time ERP Dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="px-4 py-3 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-all"
            >
              Export Report
            </button>

            <button
              onClick={fetchAnalytics}
              className="border border-slate-300 hover:bg-slate-100 px-6 py-3 rounded-2xl transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-slate-500 text-sm font-medium">{kpi.title}</p>
              <h2 className="text-4xl font-semibold mt-3" style={{ color: kpi.color }}>
                {kpi.value}
              </h2>
              {kpi.change && (
                <p
                  className={`mt-4 text-sm font-medium flex items-center gap-1 ${
                    kpi.change > 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {kpi.change > 0 ? "↑" : "↓"} {Math.abs(kpi.change)}% from last period
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue Trend Line Chart */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm">
            <h3 className="text-2xl font-semibold mb-6">Revenue vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₹${v}M`} />
                <Tooltip formatter={(value) => [`₹${value}M`]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={4}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={4}
                  name="Expenses"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  name="Net Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Branches Bar Chart */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-sm">
            <h3 className="text-2xl font-semibold mb-6">Top Branches</h3>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={topBranches} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `₹${v}M`} />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip formatter={(v) => `₹${v}M`} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm">
          <h3 className="text-2xl font-semibold mb-6">Recent Activities</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-slate-700">{act.text}</p>
                    <p className="text-xs text-slate-500 mt-1">{act.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No recent activities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;