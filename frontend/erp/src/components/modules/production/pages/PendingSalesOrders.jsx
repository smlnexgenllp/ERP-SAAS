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

      const processed = res.data.map((item) => {
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
          input_qty: required > 0 ? required : 0,
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

    setPlanningItems((prev) => ({
      ...prev,
      [item.product__id]: true,
    }));

    try {
      const res = await api.post(
        "/production/planned-orders/create/",
        {
          product: item.product__id,
          quantity: item.input_qty,
          sales_orders: item.sales_orders || [],
        }
      );

      alert(`✅ Planned Order #${res.data.id} created successfully!`);

      // Instant UI Update
      setItems((prev) =>
        prev.map((i) =>
          i.product__id === item.product__id
            ? {
                ...i,
                planned_qty: (i.planned_qty || 0) + item.input_qty,
                required_production:
                  i.required_production - item.input_qty > 0
                    ? i.required_production - item.input_qty
                    : 0,
                input_qty: 0,
              }
            : i
        )
      );
    } catch (err) {
      console.error("Plan error:", err);
      alert("Error creating planned order");
    } finally {
      setPlanningItems((prev) => ({
        ...prev,
        [item.product__id]: false,
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-6 text-lg font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-[1600px] mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">

            <button
              onClick={() => navigate("/manufacturing/dashboard")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-2xl text-zinc-700 transition-all shadow-sm"
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

                <p className="text-zinc-500 mt-1">
                  MRP Planning & Production Planning
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchItems}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-2xl text-zinc-700 transition-all shadow-sm"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertTriangle size={22} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white border border-zinc-200 rounded-3xl h-[500px] flex items-center justify-center shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>

              <p className="text-zinc-600 mt-6 text-lg font-medium">
                Loading MRP data...
              </p>
            </div>
          </div>
        ) : items.length === 0 ? (

          // Empty State
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center shadow-sm">
            <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-6" />

            <h2 className="text-2xl font-semibold text-zinc-700">
              No Pending Sales Orders Found
            </h2>

            <p className="text-zinc-500 mt-3">
              All demands have been planned or fulfilled.
            </p>
          </div>

        ) : (

          // Table
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">

            {/* Top Bar */}
            <div className="px-8 py-5 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Production Planning Queue
                  </h2>

                  <p className="text-sm text-zinc-500 mt-1">
                    Analyze demand and generate production plans
                  </p>
                </div>

                <div className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-2xl text-sm font-semibold">
                  {items.length} Item{items.length > 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">

                {/* Header */}
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Product
                    </th>

                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Code
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Sales
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Stock
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Planned
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-amber-600">
                      Required
                    </th>

                    <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Plan Qty
                    </th>

                    <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Sales Orders
                    </th>

                    <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Action
                    </th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-zinc-100 bg-white">

                  {items.map((item, index) => (
                    <tr
                      key={item.product__id}
                      className={`transition-all hover:bg-zinc-50 ${
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-zinc-50/40"
                      }`}
                    >

                      {/* Product */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">

                          <div className="w-11 h-11 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                            <Factory className="w-5 h-5 text-zinc-700" />
                          </div>

                          <div>
                            <p className="font-semibold text-zinc-900 text-sm">
                              {item.product__name}
                            </p>

                            <p className="text-xs text-zinc-500 mt-1">
                              Manufacturing Product
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-xs">
                          {item.product__code}
                        </span>
                      </td>

                      {/* Sales */}
                      <td className="px-6 py-5 text-right">
                        <div>
                          <p className="text-lg font-bold text-blue-600">
                            {item.total_sales_qty}
                          </p>

                          <p className="text-xs text-zinc-400">
                            Demand
                          </p>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-5 text-right">
                        <div>
                          <p className="text-lg font-semibold text-zinc-700">
                            {item.current_stock}
                          </p>

                          <p className="text-xs text-zinc-400">
                            Available
                          </p>
                        </div>
                      </td>

                      {/* Planned */}
                      <td className="px-6 py-5 text-right">
                        <div>
                          <p className="text-lg font-semibold text-violet-600">
                            {item.planned_qty}
                          </p>

                          <p className="text-xs text-zinc-400">
                            Planned
                          </p>
                        </div>
                      </td>

                      {/* Required */}
                      <td className="px-6 py-5 text-right">
                        <div>
                          <p className="text-2xl font-bold text-amber-600">
                            {item.required_production}
                          </p>

                          {item.required_production > 0 ? (
                            <span className="inline-flex items-center mt-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                              Need Production
                            </span>
                          ) : (
                            <span className="inline-flex items-center mt-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                              Sufficient
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plan Input */}
                      <td className="px-6 py-5 text-right">
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

                            setItems((prev) =>
                              prev.map((i) =>
                                i.product__id === item.product__id
                                  ? { ...i, input_qty: val }
                                  : i
                              )
                            );
                          }}
                          className="w-28 text-right bg-white border border-zinc-200 rounded-2xl px-4 py-3 font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400 transition-all shadow-sm"
                        />
                      </td>

                      {/* Sales Orders */}
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2 max-w-[240px]">

                          {(item.sales_order_numbers || []).length > 0 ? (
                            (item.sales_order_numbers || []).map((so, i) => (
                              <span
                                key={i}
                                className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-xl text-xs font-medium"
                              >
                                {so}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-400">
                              No orders
                            </span>
                          )}

                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-center">
                        <button
                          disabled={
                            item.required_production === 0 ||
                            planningItems[item.product__id]
                          }
                          onClick={() => generateProductionPlan(item)}
                          className={`min-w-[170px] px-6 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-3 mx-auto transition-all ${
                            item.required_production === 0 ||
                            planningItems[item.product__id]
                              ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                              : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm hover:shadow-md"
                          }`}
                        >
                          {planningItems[item.product__id] ? (
                            <>
                              <RefreshCw
                                size={18}
                                className="animate-spin"
                              />
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