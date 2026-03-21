// src/pages/PendingSalesOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Factory, ClipboardList, Package, Settings, PlayCircle, LogOut,
  AlertTriangle, ArrowRightCircle, Database, Layers, BarChart3
  Factory,
  ClipboardList,
  Package,
  Settings,
  Play,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import api from "../../../../services/api";

export default function MRPPlanningBoard() {
export default function PendingSalesOrders() {
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
  const [runningMRP, setRunningMRP] = useState(false);
  const [planningItems, setPlanningItems] = useState({});
  const [mrpResult, setMrpResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch MRP Data
  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get("/production/item-sales-summary/");
      
      const processed = res.data.map(item => {
        const stock = parseFloat(item.current_stock) || 0;
        const totalSales = parseFloat(item.total_sales_qty) || 0;
        const required = totalSales - stock;

        return {
          ...item,
          current_stock: stock,
          total_sales_qty: totalSales,
          required_production: required > 0 ? required : 0
        };
      });

      setItems(processed);
    } catch (err) {
      console.error("MRP fetch error:", err);
      setError("Failed to load MRP data. Please try again.");
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
    if (!authLoading) {
      fetchItems();
    }
  }, [authLoading]);

  // Generate Planned Order for single item
  const generateProductionPlan = async (item) => {
    if (item.required_production <= 0) {
      alert("No production required for this item");
      return;
    }

    setPlanningItems(prev => ({ ...prev, [item.product__id]: true }));
    setError(null);

    try {
      const response = await api.post("/production/planned-orders/create/", {
        product: item.product__id,
        quantity: item.required_production,
        sales_orders: item.sales_orders || []
      });

      alert(`✅ Planned Order #${response.data.id} created successfully`);
      fetchItems(); // Refresh data

    } catch (err) {
      console.error("Plan creation error:", err);
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.detail || 
                      "Error generating planned order";
      alert(`❌ ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setPlanningItems(prev => ({ ...prev, [item.product__id]: false }));
    }
  };

  // RUN FULL MRP
  const runMRP = async () => {
    setRunningMRP(true);
    setError(null);
    setMrpResult(null);
    
    try {
      const response = await api.post("/production/run-mrp/");
      
      // Show success message with details
      const data = response.data;
      setMrpResult(data);
      
      // Show alert with summary
      alert(`✅ MRP Completed!\n\n` +
            `Planned Orders Created: ${data.production_plan_id ? 'Yes' : 'No'}\n` +
            `Capacity Warnings: ${data.capacity_warnings?.length || 0}`);
      
      // Refresh the item list
      fetchItems();
      
    } catch (err) {
      console.error("MRP error:", err);
      const errorMsg = err.response?.data?.detail || 
                      err.response?.data?.error || 
                      "MRP failed. Please try again.";
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setRunningMRP(false);
    }
  };

  if (authLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex flex-col">
      {/* HEADER */}
      <header className="bg-gray-900/90 border-b border-cyan-900/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Factory className="w-9 h-9 text-cyan-400"/>
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">
              MRP Planning Board
            </h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-IN")} • {user?.username}
            </p>
          </div>
        </div>

        <button
          onClick={executeGlobalMRP}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 px-6 py-3 rounded-lg font-medium shadow-md transition-all"
        >
          <PlayCircle size={18} />
          Execute MRP Run
        {/* RUN MRP BUTTON with loading state */}
        <button
          onClick={runMRP}
          disabled={runningMRP}
          className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
            runningMRP 
              ? 'bg-green-800 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {runningMRP ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Running MRP...
            </>
          ) : (
            'Run MRP'
          )}
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
        {/* SIDEBAR */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/60 flex flex-col">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-lg font-bold text-cyan-300">
              Manufacturing
            </h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => navigate("/manufacturing/dashboard")}
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <ClipboardList className="h-5 w-5 text-cyan-400"/>
              Dashboard
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

          <div className="p-4 border-t border-gray-800">
            <button
              onClick={() => navigate("/logout")}
              className="flex items-center gap-3 w-full p-3 rounded-xl bg-red-700 hover:bg-red-800"
            >
              <LogOut className="h-5 w-5"/>
              Logout
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
        {/* MAIN CONTENT */}
        <div className="flex-1 p-8 overflow-auto">
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MRP Results Banner */}
          {mrpResult && mrpResult.capacity_warnings?.length > 0 && (
            <div className="mb-6 bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-4 rounded-lg">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <AlertTriangle size={18} />
                Capacity Warnings
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {mrpResult.capacity_warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {loading ? (
            <div className="text-cyan-400 animate-pulse flex items-center gap-3">
              <RefreshCw className="animate-spin" size={20} />
              Loading MRP Data...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-20 h-20 mx-auto text-gray-600 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-400 mb-2">No Sales Orders Found</h2>
              <p className="text-gray-500">Create sales orders first to run MRP</p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40">
                  <p className="text-sm text-cyan-400 uppercase">Items</p>
                  <p className="text-3xl font-bold text-cyan-300">{items.length}</p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40">
                  <p className="text-sm text-purple-400 uppercase">Total Demand</p>
                  <p className="text-3xl font-bold text-purple-300">
                    {items.reduce((sum,i)=>sum+Number(i.total_sales_qty||0),0)}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40">
                  <p className="text-sm text-yellow-400 uppercase">Production Needed</p>
                  <p className="text-3xl font-bold text-yellow-300">
                    {items.reduce((sum,i)=>sum+Number(i.required_production||0),0)}
                  </p>
                </div>

                <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40">
                  <p className="text-sm text-green-400 uppercase">Available Stock</p>
                  <p className="text-3xl font-bold text-green-300">
                    {items.reduce((sum,i)=>sum+Number(i.current_stock||0),0)}
                  </p>
                </div>
              </div>

              {/* TABLE */}
              <div className="bg-gray-900/70 rounded-2xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-cyan-300">
                  Material Requirement Planning
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700 text-left text-gray-300">
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">UOM</th>
                        <th className="py-3 px-4 text-right">Sales Qty</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4 text-right">Required</th>
                        <th className="py-3 px-4">Sales Orders</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/40">
                          <td className="py-3 px-4 font-medium">{item.product__name}</td>
                          <td className="py-3 px-4 text-gray-400">{item.product__code}</td>
                          <td className="py-3 px-4">{item.product__uom}</td>
                          <td className="py-3 px-4 text-right text-cyan-300 font-semibold">
                            {item.total_sales_qty}
                          </td>
                          <td className="py-3 px-4 text-right">{item.current_stock}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-semibold ${
                              item.required_production > 0 
                                ? 'text-yellow-300' 
                                : 'text-green-300'
                            }`}>
                              {item.required_production}
                              {item.required_production > 0 && ' 🔔'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {(item.sales_orders || []).slice(0, 3).map((so, i) => (
                                <span
                                  key={i}
                                  className="bg-gray-800 px-2 py-0.5 rounded text-xs text-cyan-300"
                                  title={so}
                                >
                                  {so.length > 8 ? so.substring(0,8)+'...' : so}
                                </span>
                              ))}
                              {(item.sales_orders || []).length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{item.sales_orders.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              disabled={item.required_production === 0 || planningItems[item.product__id]}
                              onClick={() => generateProductionPlan(item)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded mx-auto text-xs ${
                                item.required_production === 0
                                  ? "bg-gray-700 cursor-not-allowed text-gray-400"
                                  : planningItems[item.product__id]
                                  ? "bg-blue-500 cursor-wait"
                                  : "bg-blue-600 hover:bg-blue-700"
                              }`}
                            >
                              {planningItems[item.product__id] ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Play size={12} />
                                  Plan
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}