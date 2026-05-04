// src/pages/production/PlannedOrders.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import {
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Package,
} from "lucide-react";

export default function PlannedOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [mrpLoading, setMrpLoading] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      const res = await api.post(`/production/planned-orders/${plannedOrderId}/convert-to-mo/`);

      alert(`✅ Manufacturing Order Created Successfully!\n\nMO ID: ${res.data.manufacturing_order_id}`);

      fetchOrders();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || "Failed to create Manufacturing Order";
      alert(`❌ ${errorMsg}`);
    } finally {
      setMrpLoading(null);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/production/pending-sales-orders')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to MRP Planning</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Planned Orders
                </h1>
                <p className="text-zinc-500">MRP Generated Production Plans</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading planned orders...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left w-12"></th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Product</th>
                    <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Quantity</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Sales Orders</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">BOM Status</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Planned Start</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Planned Finish</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <AlertCircle className="w-16 h-16 text-zinc-300 mb-6" />
                          <p className="text-xl font-medium text-zinc-600">No planned orders found</p>
                          <p className="text-zinc-500 mt-2">Run MRP to generate planned orders</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const hasBom = o.bom_details.length > 0;
                      const hasShortage = o.bom_details.some(
                        (c) => parseFloat(c.shortage || 0) > 0
                      );

                      const isDisabled = hasShortage || mrpLoading === o.id || o.status === "converted";

                      return (
                        <React.Fragment key={o.id}>
                          {/* Main Row */}
                          <tr className="hover:bg-zinc-50 transition-colors">
                            <td className="px-8 py-6">
                              {hasBom && (
                                <button
                                  onClick={() => toggleRow(o.id)}
                                  className="text-zinc-400 hover:text-zinc-600 transition"
                                >
                                  {expandedRow === o.id ? (
                                    <ChevronUp size={20} />
                                  ) : (
                                    <ChevronDown size={20} />
                                  )}
                                </button>
                              )}
                            </td>

                            <td className="px-8 py-6">
                              <div className="font-medium text-zinc-900">{o.product_name}</div>
                            </td>

                            <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                              {parseFloat(o.quantity).toLocaleString('en-IN')}
                            </td>

                            <td className="px-8 py-6">
                              <div className="flex flex-wrap gap-2">
                                {o.sales_orders && o.sales_orders.length > 0 ? (
                                  o.sales_orders.map((so) => (
                                    <span
                                      key={so.id}
                                      className="bg-zinc-100 text-zinc-600 text-xs px-3 py-1 rounded-2xl"
                                    >
                                      {so.order_number}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-zinc-400 text-sm">—</span>
                                )}
                              </div>
                            </td>

                            <td className="px-8 py-6 text-center">
                              {hasBom ? (
                                hasShortage ? (
                                  <span className="inline-flex items-center gap-2 text-red-600 font-medium">
                                    <AlertTriangle size={18} />
                                    Shortage
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 text-emerald-600 font-medium">
                                    <CheckCircle size={18} />
                                    OK
                                  </span>
                                )
                              ) : (
                                <span className="text-zinc-500">No BOM</span>
                              )}
                            </td>

                            <td className="px-8 py-6 text-center text-zinc-600">
                              {o.planned_start || "—"}
                            </td>
                            <td className="px-8 py-6 text-center text-zinc-600">
                              {o.planned_finish || "—"}
                            </td>

                            <td className="px-8 py-6 text-center">
                              <button
                                onClick={() => runMRP(o.id, hasShortage)}
                                disabled={isDisabled}
                                className={`px-8 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 mx-auto transition-all ${
                                  isDisabled
                                    ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
                                }`}
                              >
                                {mrpLoading === o.id ? (
                                  <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    Creating MO...
                                  </>
                                ) : hasShortage ? (
                                  <>
                                    <AlertTriangle size={18} />
                                    Shortage
                                  </>
                                ) : o.status === "converted" ? (
                                  <>
                                    <CheckCircle size={18} className="text-emerald-600" />
                                    MO Created
                                  </>
                                ) : (
                                  <>
                                    <Zap size={18} />
                                    Create MO
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded BOM Details */}
                          {expandedRow === o.id && (
                            <tr className="bg-zinc-50">
                              <td colSpan="8" className="px-8 py-8">
                                <div className="bg-white border border-zinc-200 rounded-3xl p-8">
                                  <h3 className="text-lg font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                                    Component Requirements for {o.product_name}
                                  </h3>

                                  {o.bom_details.length === 0 ? (
                                    <p className="text-zinc-500">No BOM components found.</p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-zinc-100 text-sm">
                                        <thead className="bg-zinc-50">
                                          <tr>
                                            <th className="px-6 py-4 text-left font-medium text-zinc-600">Component</th>
                                            <th className="px-6 py-4 text-right font-medium text-zinc-600">Required</th>
                                            <th className="px-6 py-4 text-right font-medium text-zinc-600">Stock</th>
                                            <th className="px-6 py-4 text-right font-medium text-zinc-600">Planned</th>
                                            <th className="px-6 py-4 text-center font-medium text-zinc-600">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100">
                                          {o.bom_details.map((c, i) => (
                                            <tr key={i} className="hover:bg-zinc-50">
                                              <td className="px-6 py-5">{c.component}</td>
                                              <td className="px-6 py-5 text-right font-medium">
                                                {parseFloat(c.required).toFixed(2)}
                                              </td>
                                              <td className="px-6 py-5 text-right">
                                                {parseFloat(c.stock).toFixed(2)}
                                              </td>
                                              <td className="px-6 py-5 text-right">
                                                {parseFloat(c.planned).toFixed(2)}
                                              </td>
                                              <td className="px-6 py-5 text-center">
                                                {parseFloat(c.shortage) > 0 ? (
                                                  <span className="inline-flex items-center gap-2 text-red-600 font-medium">
                                                    <AlertTriangle size={16} />
                                                    Short {parseFloat(c.shortage).toFixed(2)}
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-2 text-emerald-600 font-medium">
                                                    <CheckCircle size={16} />
                                                    OK
                                                  </span>
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
          </div>
        )}
      </div>
    </div>
  );
}