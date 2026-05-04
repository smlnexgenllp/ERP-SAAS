import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";

import {
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

export default function SalesOrderList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [customers, setCustomers] = useState({});
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState(null);
  const [approveAction, setApproveAction] = useState("");

  // Command bar states
  const [command, setCommand] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchCustomer();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get("/sale/sales-orders/");
      setOrders(res.data);
    } catch (error) {
      console.error("Error loading orders", error);
      setErrorMsg("Failed to load sales orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async () => {
    try {
      const res = await api.get("/sale/customers/");
      const map = {};
      res.data.forEach((c) => {
        map[c.id] = c;
      });
      setCustomers(map);
    } catch (error) {
      console.error("Error loading customers", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    const customerName = customers[order.customer]?.full_name || "";

    const matchSearch =
      order.order_number?.toLowerCase().includes(search) ||
      customerName.toLowerCase().includes(search) ||
      order.notes?.toLowerCase().includes(search);

    const matchStatus = statusFilter ? order.status === statusFilter : true;

    return matchSearch && matchStatus;
  });

  const showToast = (msg) => {
    setAlertMessage(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleCommand = (e) => {
    if (e.key !== "Enter") return;

    const cmd = command.trim().toLowerCase();
    setCommand("");

    if (!cmd) return;

    if (["help", "commands"].includes(cmd)) {
      showToast("Available commands: orders, stats, clear");
      return;
    }

    if (["orders", "list"].includes(cmd)) {
      showToast(`Total ${orders.length} orders found`);
    } else if (["stats", "statistics"].includes(cmd)) {
      const totalValue = orders.reduce((sum, o) => sum + Number(o.computed_total || 0), 0);
      showToast(`Total: ${orders.length} orders | Value: ₹${totalValue.toLocaleString("en-IN")}`);
    } else if (cmd === "clear") {
      showToast("Terminal cleared ✓");
    } else {
      showToast(`Unknown command: ${cmd}`);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/sale/sales-orders/${orderToDelete.id}/`);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setShowDeleteModal(false);
      showToast(`Order ${orderToDelete.order_number} deleted`);
    } catch (error) {
      showToast("Cannot delete order. It may have related records.");
    }
  };

  /* ---------------- APPROVE / REJECT ---------------- */
  const handleApprovalClick = (order, action) => {
    setOrderToApprove(order);
    setApproveAction(action);
    setShowApproveModal(true);
  };

  const confirmApproval = async () => {
    const status = approveAction === "approve" ? "approved" : "rejected";

    try {
      await api.post(`/sale/sales-orders/${orderToApprove.id}/status/`, { status });
      fetchOrders();
      setShowApproveModal(false);
      showToast(`Order ${orderToApprove.order_number} ${status}`);
    } catch (error) {
      showToast("Failed to update status");
    }
  };

  /* ---------------- STATUS BADGE ---------------- */
  const getStatusBadge = (status) => {
    const map = {
      draft: "bg-zinc-100 text-zinc-700",
      confirmed: "bg-blue-100 text-blue-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
      processing: "bg-amber-100 text-amber-700",
      shipped: "bg-purple-100 text-purple-700",
      delivered: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${map[status] || "bg-gray-100 text-gray-700"}`}>
        {status?.toUpperCase() || "UNKNOWN"}
      </span>
    );
  };

  // Back Button Handler
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
          <p className="text-zinc-600 mt-4 text-lg font-medium">Loading Sales Orders...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 max-w-md text-center shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Something went wrong</h2>
          <p className="text-zinc-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-zinc-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-semibold transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800 pb-28">
      {/* HEADER with Back Button */}
      <header className="flex items-center justify-between p-6 md:p-10 border-b border-zinc-200 bg-white/90 backdrop-blur-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600 hover:text-zinc-900 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl flex items-center justify-center shadow">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Sales Orders</h1>
              <p className="text-zinc-500 text-sm">Manage customer orders</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 bg-white border border-zinc-200 rounded-3xl text-sm flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          Live • {orders.length} orders
        </div>
      </header>

      {/* FILTERS */}
      <div className="p-6 md:p-10 max-w-screen-2xl mx-auto">
        <div className="flex gap-4 flex-wrap mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              className="bg-white border border-zinc-200 pl-10 pr-4 py-2.5 rounded-xl w-full focus:outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select
              className="bg-white border border-zinc-200 pl-10 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-zinc-300 cursor-pointer appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
              className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 bg-white border border-zinc-200 rounded-xl transition"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* TABLE */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
            <FileText className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <p className="text-xl font-medium text-zinc-400">No orders found</p>
            <p className="text-zinc-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-5 text-left text-sm font-semibold text-zinc-600">Order #</th>
                    <th className="p-5 text-left text-sm font-semibold text-zinc-600">Customer</th>
                    <th className="p-5 text-left text-sm font-semibold text-zinc-600">Order Date</th>
                    <th className="p-5 text-right text-sm font-semibold text-zinc-600">Total</th>
                    <th className="p-5 text-center text-sm font-semibold text-zinc-600">Status</th>
                    <th className="p-5 text-center text-sm font-semibold text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50 transition cursor-pointer"
                      onClick={() => navigate(`/sale/orders/${order.id}`)}
                    >
                      <td className="p-5 font-medium text-zinc-900">{order.order_number}</td>
                      <td className="p-5 text-zinc-600">
                        {customers[order.customer]?.full_name || "Unknown"}
                      </td>
                      <td className="p-5 text-zinc-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-right font-semibold text-emerald-600">
                        ₹{Number(order.computed_total).toLocaleString()}
                      </td>
                      <td className="p-5 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                          {["draft", "confirmed"].includes(order.status) && (
                            <>
                              <button
                                onClick={() => handleApprovalClick(order, "approve")}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
                                title="Approve"
                              >
                                <CheckCircle size={16} className="text-emerald-600" />
                              </button>
                              <button
                                onClick={() => handleApprovalClick(order, "reject")}
                                className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                                title="Reject"
                              >
                                <XCircle size={16} className="text-rose-600" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteClick(order)}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Command Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-8 py-5 flex items-center shadow-2xl z-50"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-zinc-400 font-bold text-2xl mr-4 font-mono">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="Type command: help, orders, stats, clear..."
          className="flex-1 bg-transparent outline-none text-base placeholder:text-zinc-400 text-zinc-700"
          spellCheck={false}
        />
      </div>

      {/* Toast Notification */}
      {showAlert && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 shadow-lg text-zinc-800 px-7 py-3.5 rounded-2xl text-sm z-50 flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
          {alertMessage}
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900">Delete Order</h2>
            </div>
            <p className="text-zinc-600 mb-8">
              Are you sure you want to delete order <span className="font-semibold text-zinc-900">{orderToDelete?.order_number}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE/REJECT MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                approveAction === "approve" ? "bg-emerald-100" : "bg-rose-100"
              }`}>
                {approveAction === "approve" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                {approveAction === "approve" ? "Approve Order" : "Reject Order"}
              </h2>
            </div>
            <p className="text-zinc-600 mb-8">
              {approveAction === "approve" ? "Approve" : "Reject"} order <span className="font-semibold text-zinc-900">{orderToApprove?.order_number}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                className={`px-6 py-2.5 rounded-xl font-medium transition ${
                  approveAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}