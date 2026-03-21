// src/pages/PendingSalesOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Factory,
  ClipboardList,
  Package,
  Settings,
  Play,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Layers,
  BarChart3,
  ArrowRightCircle
} from "lucide-react";
import api from "../../../../services/api";

export default function PendingSalesOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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

        {/* RUN MRP BUTTON */}
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
            <>
              <Play size={16} />
              Run MRP
            </>
          )}
        </button>
      </header>

      <div className="flex flex-1">
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
            <button 
              onClick={() => navigate("/production/planned-orders")} 
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Package className="h-5 w-5 text-purple-500" /> 
              Planned Orders
            </button>
            <button 
              onClick={() => navigate("/production/manufacturing-orders")} 
              className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-800"
            >
              <Settings className="h-5 w-5 text-emerald-500" /> 
              Manufacturing Orders
            </button>
          </nav>

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