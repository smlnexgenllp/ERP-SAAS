// src/pages/PendingSalesOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import {
  Factory,
  RefreshCw,
  AlertTriangle,
  ArrowRightCircle,
  ArrowLeft,
  AlertCircle,
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
      alert("Please enter a valid quantity");
      return;
    }

    setPlanningItems(prev => ({ ...prev, [item.product__id]: true }));

    try {
      const res = await api.post("/production/planned-orders/create/", {
        product: item.product__id,
        quantity: item.input_qty,
        sales_orders: item.sales_orders || []
      });

      alert(`✅ Planned Order #${res.data.id} created successfully!`);

      // Instant UI Update
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Factory className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Pending Sales Orders
                </h1>
                <p className="text-zinc-500">MRP Planning & Production Planning</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchItems}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertTriangle size={22} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading MRP data...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
            <p className="text-2xl font-medium text-zinc-600">No pending sales orders found</p>
            <p className="text-zinc-500 mt-2">All demands have been planned or fulfilled.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Item</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Code</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Sales Qty</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Current Stock</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Planned Qty</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-amber-600">Required Production</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Plan Qty</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Sales Orders</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {items.map(item => (
                    <tr key={item.product__id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-medium text-zinc-900">{item.product__name}</td>
                      <td className="px-8 py-6 text-zinc-500 font-mono">{item.product__code}</td>

                      <td className="px-8 py-6 text-right font-semibold text-blue-600">
                        {item.total_sales_qty}
                      </td>

                      <td className="px-8 py-6 text-right text-zinc-600">
                        {item.current_stock}
                      </td>

                      <td className="px-8 py-6 text-right text-purple-600 font-medium">
                        {item.planned_qty}
                      </td>

                      <td className="px-8 py-6 text-right font-bold text-amber-600">
                        {item.required_production}
                      </td>

                      {/* Input Quantity */}
                      <td className="px-8 py-6 text-right">
                        <input
                          type="number"
                          value={item.input_qty}
                          min="0"
                          max={item.required_production}
                          onChange={(e) => {
                            const val = Math.min(
                              Number(e.target.value) || 0,
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
                          className="w-28 text-right bg-white border border-zinc-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                        />
                      </td>

                      {/* Sales Orders */}
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2 max-w-[260px]">
                          {(item.sales_order_numbers || []).map((so, i) => (
                            <span
                              key={i}
                              className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-2xl text-xs font-medium"
                            >
                              {so}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="px-8 py-6 text-center">
                        <button
                          disabled={
                            item.required_production === 0 ||
                            planningItems[item.product__id]
                          }
                          onClick={() => generateProductionPlan(item)}
                          className={`px-8 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 mx-auto transition-all ${
                            item.required_production === 0 || planningItems[item.product__id]
                              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                          }`}
                        >
                          {planningItems[item.product__id] ? (
                            <>
                              <RefreshCw size={18} className="animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <ArrowRightCircle size={18} />
                              Generate Plan
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
        )}
      </div>
    </div>
  );
}