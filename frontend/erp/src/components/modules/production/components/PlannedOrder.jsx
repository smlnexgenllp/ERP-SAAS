import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import {
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function PlannedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [mrpLoading, setMrpLoading] = useState(null);

  // =========================
  // FETCH PLANNED ORDERS
  // =========================
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/production/planned-orders/");
      const safeData = res.data.map((o) => ({
        ...o,
        bom_details: Array.isArray(o.bom_details) ? o.bom_details : [],
      }));
      setOrders(safeData);
    } catch (err) {
      console.error("Failed to load planned orders:", err);
      alert("Failed to load planned orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================
  // RUN MRP → CREATE MANUFACTURING ORDER (Based on Planned Order ID)
  // =========================
  const runMRP = async (plannedOrderId, hasShortage) => {
    if (hasShortage) {
      alert("❌ Cannot create Production Order.\n\nMaterial shortage detected.\nPlease resolve component shortages first.");
      return;
    }

    if (!window.confirm("Create Manufacturing Order from this Planned Order?")) {
      return;
    }

    setMrpLoading(plannedOrderId);

    try {
      const res = await api.post(`/production/planned-orders/${plannedOrderId}/run-mrp/`);

      alert(`✅ Manufacturing Order Created Successfully!\n\nMO ID: ${res.data.manufacturing_order_id}`);

      fetchOrders(); // Refresh list to disable button
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Failed to create Manufacturing Order";
      alert(`❌ ${errorMsg}`);
    } finally {
      setMrpLoading(null);
    }
  };

  // =========================
  // TOGGLE BOM DETAILS
  // =========================
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Planned Orders (MRP)</h1>

        <button
          onClick={fetchOrders}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-cyan-400">
          <RefreshCw className="animate-spin mr-3" size={24} />
          Loading Planned Orders...
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="p-4 text-left w-8"></th>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4">Sales Orders</th>
                <th className="p-4 text-center">BOM Status</th>
                <th className="p-4 text-center">Planned Start</th>
                <th className="p-4 text-center">Planned Finish</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-500">
                    No planned orders found
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const hasBom = o.bom_details.length > 0;
                  const hasShortage = o.bom_details.some(
                    (c) => parseFloat(c.shortage || 0) > 0
                  );

                  // Button disabled if already converted or MRP running
                  const isDisabled = hasShortage || mrpLoading === o.id || o.status === "converted";

                  return (
                    <React.Fragment key={o.id}>
                      {/* Main Row */}
                      <tr className="hover:bg-gray-800/50 transition-colors">
                        <td className="p-4">
                          {hasBom && (
                            <button
                              onClick={() => toggleRow(o.id)}
                              className="text-gray-400 hover:text-cyan-400"
                            >
                              {expandedRow === o.id ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>
                          )}
                        </td>

                        <td className="p-4 font-medium text-cyan-300">
                          {o.product_name}
                        </td>

                        <td className="p-4 text-right font-semibold">
                          {parseFloat(o.quantity).toLocaleString()}
                        </td>

                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {o.sales_orders && o.sales_orders.length > 0 ? (
                              o.sales_orders.map((so) => (
                                <span
                                  key={so.id}
                                  className="bg-gray-800 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full"
                                >
                                  {so.order_number}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-xs">—</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {hasBom ? (
                            hasShortage ? (
                              <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                                <AlertTriangle size={16} />
                                Shortage
                              </span>
                            ) : (
                              <span className="text-green-400 font-semibold">✓ OK</span>
                            )
                          ) : (
                            <span className="text-gray-500">No BOM</span>
                          )}
                        </td>

                        <td className="p-4 text-center text-gray-300">
                          {o.planned_start || "—"}
                        </td>
                        <td className="p-4 text-center text-gray-300">
                          {o.planned_finish || "—"}
                        </td>

                        {/* MRP Button - Now based on Planned Order ID */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => runMRP(o.id, hasShortage)}
                            disabled={isDisabled}
                            className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-all ${
                              isDisabled
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-violet-600 hover:bg-violet-700 text-white shadow-md"
                            }`}
                          >
                            {mrpLoading === o.id ? (
                              <>
                                <RefreshCw size={16} className="animate-spin" />
                                Creating...
                              </>
                            ) : hasShortage ? (
                              <>
                                <AlertTriangle size={16} />
                                Shortage
                              </>
                            ) : o.status === "converted" ? (
                              <>
                                <CheckCircle size={16} className="text-green-400" />
                                MO Created
                              </>
                            ) : (
                              <>
                                <Zap size={16} />
                                Create Manufacturing Order
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded BOM Details */}
                      {expandedRow === o.id && (
                        <tr className="bg-gray-950">
                          <td colSpan="8" className="p-6">
                            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                              <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
                                Component Requirements for {o.product_name}
                              </h3>

                              {o.bom_details.length === 0 ? (
                                <p className="text-gray-400">No BOM components found.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="text-left py-3">Component</th>
                                        <th className="text-right py-3">Required</th>
                                        <th className="text-right py-3">Stock</th>
                                        <th className="text-right py-3">Planned</th>
                                        <th className="text-center py-3">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                      {o.bom_details.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-800/50">
                                          <td className="py-3">{c.component}</td>
                                          <td className="py-3 text-right">{parseFloat(c.required).toFixed(2)}</td>
                                          <td className="py-3 text-right">{parseFloat(c.stock).toFixed(2)}</td>
                                          <td className="py-3 text-right">{parseFloat(c.planned).toFixed(2)}</td>
                                          <td className="py-3 text-center">
                                            {parseFloat(c.shortage) > 0 ? (
                                              <span className="text-red-400 font-medium">
                                                Short {parseFloat(c.shortage).toFixed(2)}
                                              </span>
                                            ) : (
                                              <span className="text-green-400 font-medium">OK</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No planned orders available at the moment.
        </div>
      )}
    </div>
  );
}