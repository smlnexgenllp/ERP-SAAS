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
        sales_orders: item.sales_orders || []
      });

      alert(`✅ Planned Order #${res.data.id} created`);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center text-cyan-400">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/manufacturing/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Factory className="text-cyan-400" size={28} />
            <h1 className="text-3xl font-bold text-cyan-300">Pending Sales Orders - MRP Planning</h1>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={fetchItems}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-5 py-2.5 rounded-xl transition"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 p-4 rounded-xl mb-6 flex items-center gap-2 text-red-300">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-cyan-400">
            <RefreshCw className="animate-spin mr-3" size={24} />
            Loading MRP Data...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No pending sales orders found
          </div>
        ) : (
          <div className="bg-gray-900/70 border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="p-4 text-left">Item</th>
                  <th className="p-4 text-left">Code</th>
                  <th className="p-4 text-right">Sales Qty</th>
                  <th className="p-4 text-right">Current Stock</th>
                  <th className="p-4 text-right">Planned Qty</th>
                  <th className="p-4 text-right text-yellow-300">Required Production</th>
                  <th className="p-4 text-right">Plan Qty</th>
                  <th className="p-4">Sales Orders</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {items.map(item => (
                  <tr key={item.product__id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-medium text-gray-200">{item.product__name}</td>
                    <td className="p-4 text-gray-400">{item.product__code}</td>

                    <td className="p-4 text-right text-cyan-300 font-medium">
                      {item.total_sales_qty}
                    </td>

                    <td className="p-4 text-right text-gray-300">
                      {item.current_stock}
                    </td>

                    <td className="p-4 text-right text-purple-300">
                      {item.planned_qty}
                    </td>

                    <td className="p-4 text-right font-semibold text-yellow-300">
                      {item.required_production}
                    </td>

                    {/* Input Quantity */}
                    <td className="p-4 text-right">
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
                        className="w-24 bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl text-right focus:border-cyan-500 outline-none"
                      />
                    </td>

                    {/* Sales Orders */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {(item.sales_order_numbers || []).map((so, i) => (
                          <span
                            key={i}
                            className="bg-gray-800 px-2.5 py-0.5 rounded-full text-xs text-cyan-300"
                          >
                            {so}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-center">
                      <button
                        disabled={
                          item.required_production === 0 ||
                          planningItems[item.product__id]
                        }
                        onClick={() => generateProductionPlan(item)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 mx-auto transition-all ${
                          item.required_production === 0
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {planningItems[item.product__id] ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <ArrowRightCircle size={16} />
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
        )}
      </div>
    </div>
  );
}