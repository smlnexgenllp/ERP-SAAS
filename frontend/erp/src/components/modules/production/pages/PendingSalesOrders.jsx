// src/pages/PendingSalesOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Factory,
  ClipboardList,
  Package,
  Settings,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ArrowRightCircle
} from "lucide-react";
import api from "../../../../services/api";

export default function PendingSalesOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planningItems, setPlanningItems] = useState({});
  const [error, setError] = useState(null);

  // =========================
  // FETCH DATA
  // =========================
  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/production/item-sales-summary/");

      const processed = res.data.map(item => {
        const stock = parseFloat(item.current_stock) || 0;
        const totalSales = parseFloat(item.total_sales_qty) || 0;
        const planned = parseFloat(item.planned_qty) || 0;

        const required = totalSales - stock - planned;

        return {
          ...item,
          current_stock: stock,
          total_sales_qty: totalSales,
          planned_qty: planned,
          required_production: required > 0 ? required : 0,
          input_qty: required > 0 ? required : 0
        };
      });

      setItems(processed);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load MRP data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchItems();
  }, [authLoading]);

  // =========================
  // GENERATE PLAN ORDER
  // =========================
  const generateProductionPlan = async (item) => {
    if (!item.input_qty || item.input_qty <= 0) {
      alert("Enter valid quantity");
      return;
    }

    setPlanningItems(prev => ({ ...prev, [item.product__id]: true }));

    try {
      const res = await api.post("/production/planned-orders/create/", {
        product: item.product__id,
        quantity: item.input_qty,
        sales_orders: item.sales_orders || [] // ✅ IDs sent
      });

      alert(`✅ Planned Order #${res.data.id} created`);

      // 🔥 Instant UI Update
      setItems(prev =>
        prev.map(i =>
          i.product__id === item.product__id
            ? {
                ...i,
                planned_qty: (i.planned_qty || 0) + item.input_qty,
                required_production:
                  i.required_production - item.input_qty > 0
                    ? i.required_production - item.input_qty
                    : 0,
                input_qty: 0
              }
            : i
        )
      );

    } catch (err) {
      console.error("Plan error:", err);
      alert("Error creating planned order");
    } finally {
      setPlanningItems(prev => ({ ...prev, [item.product__id]: false }));
    }
  };

  // =========================
  // LOADING
  // =========================
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-cyan-400">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">

      {/* HEADER */}
      <header className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Factory className="text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-cyan-300">
              MRP Planning Board
            </h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN")} • {user?.username}
            </p>
          </div>
        </div>

        <button
          onClick={fetchItems}
          className="flex items-center gap-2 bg-cyan-600 px-3 py-1 rounded"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      <div className="flex flex-1">

        {/* SIDEBAR */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-2">
          <button onClick={() => navigate("/manufacturing/dashboard")} className="flex gap-2 w-full p-2 hover:bg-gray-800 rounded">
            <ClipboardList size={16}/> Dashboard
          </button>
          <button onClick={() => navigate("/planned-orders")} className="flex gap-2 w-full p-2 hover:bg-gray-800 rounded">
            <Package size={16}/> Planned Orders
          </button>
          <button onClick={() => navigate("/production/manufacturing-orders")} className="flex gap-2 w-full p-2 hover:bg-gray-800 rounded">
            <Settings size={16}/> Manufacturing Orders
          </button>
          <button onClick={() => navigate("/logout")} className="flex gap-2 w-full p-2 bg-red-700 rounded">
            <LogOut size={16}/> Logout
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-6">

          {error && (
            <div className="bg-red-900 p-3 mb-4 rounded flex gap-2">
              <AlertTriangle size={16}/>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-cyan-400 flex gap-2">
              <RefreshCw className="animate-spin" />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No Sales Orders Found
            </div>
          ) : (

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">

              <h2 className="text-lg mb-4 text-cyan-300">
                Material Requirement Planning
              </h2>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="p-2">Item</th>
                    <th className="p-2">Code</th>
                    <th className="p-2 text-right">Sales</th>
                    <th className="p-2 text-right">Stock</th>
                    <th className="p-2 text-right">Planned</th>
                    <th className="p-2 text-right">Required</th>
                    <th className="p-2 text-right">Plan Qty</th>
                    <th className="p-2">Sales Orders</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(item => (
                    <tr key={item.product__id} className="border-b border-gray-800">

                      <td className="p-2">{item.product__name}</td>
                      <td className="p-2">{item.product__code}</td>

                      <td className="p-2 text-right text-cyan-300">
                        {item.total_sales_qty}
                      </td>

                      <td className="p-2 text-right">
                        {item.current_stock}
                      </td>

                      <td className="p-2 text-right text-purple-300">
                        {item.planned_qty}
                      </td>

                      <td className="p-2 text-right text-yellow-300">
                        {item.required_production}
                      </td>

                      {/* INPUT */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          value={item.input_qty}
                          min="0"
                          max={item.required_production}
                          onChange={(e) => {
                            const val = Math.min(
                              Number(e.target.value),
                              item.required_production
                            );

                            setItems(prev =>
                              prev.map(i =>
                                i.product__id === item.product__id
                                  ? { ...i, input_qty: val }
                                  : i
                              )
                            );
                          }}
                          className="w-20 bg-gray-800 border border-gray-700 px-2 py-1 rounded text-right"
                        />
                      </td>

                      {/* SALES ORDER DISPLAY */}
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(item.sales_order_numbers || []).map((so, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-0.5 rounded text-xs text-cyan-300">
                              {so}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* BUTTON */}
                      <td className="p-2 text-center">
                        <button
                          disabled={
                            item.required_production === 0 ||
                            planningItems[item.product__id]
                          }
                          onClick={() => generateProductionPlan(item)}
                          className={`px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto ${
                            item.required_production === 0
                              ? "bg-gray-700"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {planningItems[item.product__id] ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              Creating
                            </>
                          ) : (
                            <>
                              <ArrowRightCircle size={12} />
                              Generate
                            </>
                          )}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}