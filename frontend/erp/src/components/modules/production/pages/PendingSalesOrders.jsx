// src/pages/PendingSalesOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Factory, ClipboardList, Package, Settings, PlayCircle, LogOut,
  AlertTriangle, ArrowRightCircle, Database, Layers, BarChart3
} from "lucide-react";
import api from "../../../../services/api";

export default function MRPPlanningBoard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [demandItems, setDemandItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMRPDemand = async () => {
    try {
      const res = await api.get("/production/item-sales-summary/");
      const processed = res.data.map(item => ({
        ...item,
        current_stock: Number(item.current_stock || 0),
        required_production: Math.max(0, Number(item.total_sales_qty || 0) - Number(item.current_stock || 0)),
      }));
      setDemandItems(processed.sort((a, b) => b.required_production - a.required_production));
    } catch (err) {
      console.error("MRP demand fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load material demand overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchMRPDemand();
  }, [authLoading]);

  const executeGlobalMRP = async () => {
    if (!window.confirm("Execute MRP run for the entire organization?\n\nThis will:\n• Explode BOMs\n• Calculate net requirements\n• Create planned orders & purchase requisitions")) {
      return;
    }

    try {
      const res = await api.post("/production/run-mrp/", { scheduling_mode: "basic" });
      alert(res.data.detail || "MRP run completed successfully");

      if (res.data.warnings?.length > 0) {
        alert("Planning Warnings:\n" + res.data.warnings.join("\n"));
      }

      fetchMRPDemand(); // refresh view
    } catch (err) {
      alert(err.response?.data?.detail || "MRP execution failed");
    }
  };

  const planSingleItem = async (item) => {
    if (item.required_production <= 0) return;

    if (!window.confirm(`Create planned order for:\n\n${item.product__name}\nQuantity: ${item.required_production.toLocaleString()}\n`)) return;

    try {
      await api.post("/production/planned-orders/create/", {
        product: item.product__id,
        quantity: item.required_production,
      });
      alert("Planned order created successfully");
      fetchMRPDemand();
    } catch (err) {
      alert("Failed to create planned order");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
          <p className="text-cyan-400 font-medium">Loading MRP overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Layers className="h-9 w-9 text-cyan-500" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cyan-300">MRP Live – Demand & Net Requirements</h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN')} • {user?.username}
            </p>
          </div>
        </div>

        <button
          onClick={executeGlobalMRP}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-6 py-3 rounded-lg font-medium shadow-md transition-all"
        >
          <PlayCircle size={18} />
          Execute MRP Run
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-800 bg-slate-950 flex flex-col">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-cyan-300">Manufacturing</h2>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <button onClick={() => navigate("/production/dashboard")} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800/60 transition text-slate-300 hover:text-white">
              <BarChart3 className="h-5 w-5 text-cyan-500" /> Dashboard
            </button>
            <button onClick={() => navigate("/production/planned-orders")} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800/60 transition text-slate-300 hover:text-white">
              <Package className="h-5 w-5 text-purple-500" /> Planned Orders
            </button>
            <button onClick={() => navigate("/production/manufacturing-orders")} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-800/60 transition text-slate-300 hover:text-white">
              <Settings className="h-5 w-5 text-emerald-500" /> Manufacturing Orders
            </button>
          </nav>
          <div className="p-4 border-t border-slate-800 mt-auto">
            <button onClick={() => navigate("/logout")} className="flex items-center gap-3 w-full p-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 transition">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Materials</p>
              <p className="text-4xl font-bold text-white mt-3">{demandItems.length}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Gross Demand</p>
              <p className="text-4xl font-bold text-purple-300 mt-3">
                {demandItems.reduce((sum, i) => sum + Number(i.total_sales_qty || 0), 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Net Requirement</p>
              <p className="text-4xl font-bold text-amber-300 mt-3">
                {demandItems.reduce((sum, i) => sum + i.required_production, 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Critical Items</p>
              <p className="text-4xl font-bold text-red-400 mt-3">
                {demandItems.filter(i => i.required_production > 0).length}
              </p>
            </div>
          </div>

          {/* MRP Demand Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-cyan-300">Demand – Stock – Net Requirements</h2>
              <span className="text-slate-400 text-sm">Sorted by urgency (highest net req first)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80">
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-4 px-6 font-medium text-slate-300">Material</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-300">Code</th>
                    <th className="text-center py-4 px-6 font-medium text-slate-300">UoM</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-300">Sales Demand</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-300">Stock</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-300">Net Req.</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-300">Sales Orders</th>
                    <th className="text-center py-4 px-6 font-medium text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {demandItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-500 italic">
                        No demand or stock data available at this time
                      </td>
                    </tr>
                  ) : (
                    demandItems.map((item) => (
                      <tr
                        key={item.product__id}
                        className={`border-b border-slate-800 hover:bg-slate-800/40 transition-colors ${
                          item.required_production > 0 ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">{item.product__name}</td>
                        <td className="py-4 px-6 text-slate-400">{item.product__code}</td>
                        <td className="py-4 px-6 text-center">{item.product__uom || '-'}</td>
                        <td className="py-4 px-6 text-right text-cyan-300 font-medium">
                          {Number(item.total_sales_qty || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">{Number(item.current_stock).toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-bold text-amber-300">
                          {item.required_production.toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1.5">
                            {(item.sales_orders || []).slice(0, 5).map((so, i) => (
                              <span
                                key={i}
                                className="bg-slate-800 px-2.5 py-1 rounded text-xs text-cyan-400 border border-cyan-900/30"
                              >
                                {so}
                              </span>
                            ))}
                            {(item.sales_orders || []).length > 5 && (
                              <span className="text-xs text-slate-500">+{(item.sales_orders.length - 5)} more</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {item.required_production > 0 ? (
                            <button
                              onClick={() => planSingleItem(item)}
                              className="bg-cyan-700 hover:bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto"
                            >
                              <ArrowRightCircle size={16} />
                              Plan
                            </button>
                          ) : (
                            <span className="text-slate-600 text-sm">No action needed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}