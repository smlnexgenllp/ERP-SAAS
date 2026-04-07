import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function SalesOrderList() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
   const [customers, setCustomers]=useState({});
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [orderToApprove, setOrderToApprove] = useState(null);
  const [approveAction, setApproveAction] = useState("");

  useEffect(() => {
    fetchOrders();
    fetchCustomer();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sale/sales-orders/");
      setOrders(res.data);
    } catch (error) {
      console.error("Error loading orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomer = async () => {
  try {
    const res = await api.get("/sale/customers/");

    const map = {};
    res.data.forEach((c) => {
      map[c.id] = c; // store full object
    });

    setCustomers(map);
  } catch (error) {
    console.error("Error loading customers", error);
  }
};
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();

    const matchSearch =
      order.order_number?.toLowerCase().includes(search) ||
      order.customer?.full_name?.toLowerCase().includes(search) ||
      order.notes?.toLowerCase().includes(search);

    const matchStatus = statusFilter
      ? order.status === statusFilter
      : true;

    return matchSearch && matchStatus;
  });

  /* ---------------- DELETE ---------------- */
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/sale/sales-orders/${orderToDelete.id}/`);

      setOrders((prev) =>
        prev.filter((o) => o.id !== orderToDelete.id)
      );

      setShowDeleteModal(false);
    } catch (error) {
      alert("Cannot delete order.");
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
      await api.post(
        `/sale/sales-orders/${orderToApprove.id}/status/`,
        { status }
      );

      fetchOrders();
      setShowApproveModal(false);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  /* ---------------- STATUS BADGE ---------------- */
  const getStatusBadge = (status) => {
    const map = {
      draft: "bg-gray-700 text-gray-300",
      confirmed: "bg-blue-700 text-blue-200",
      approved: "bg-green-700 text-green-200",
      rejected: "bg-red-700 text-red-200",
      processing: "bg-indigo-700 text-indigo-200",
      shipped: "bg-purple-700 text-purple-200",
      delivered: "bg-green-800 text-green-200",
      cancelled: "bg-red-800 text-red-200",
    };

    return (
      <span className={`px-3 py-1 text-xs rounded-full ${map[status] || "bg-gray-700 text-gray-300"}`}>
        {status?.toUpperCase() || "UNKNOWN"}
      </span>
    );
  };

  // Back Button Handler
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">

      {/* HEADER with Back Button */}
      <header className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/90 backdrop-blur-lg sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-cyan-300 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <FileText className="text-cyan-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold">Sales Orders</h1>
              <p className="text-gray-400 text-sm">Manage customer orders</p>
            </div>
          </div>
        </div>

        {/* <button
          onClick={() => navigate("/sale/orders/create")}
          className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg flex gap-2 items-center"
        >
          <Plus size={18} />
          New Order
        </button> */}
      </header>

      {/* FILTERS */}
      <div className="p-6 flex gap-4 flex-wrap">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-500" />
          <input
            className="bg-gray-900 border border-gray-700 pl-10 pr-4 py-2 rounded-lg w-full"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 text-gray-500" />
          <select
            className="bg-gray-900 border border-gray-700 pl-10 pr-4 py-2 rounded-lg"
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
      </div>

      {/* TABLE */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-20">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No orders found</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="p-4 text-left">Order #</th>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Order Date</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-gray-800 hover:bg-gray-800"
                  >
                    <td className="p-4 font-medium">{order.order_number}</td>
                    <td className="p-4">
  {customers[order.customer]?.full_name || "Unknown"}
</td>
                    <td className="p-4">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right text-green-400">
                      ₹{Number(order.computed_total).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4 flex gap-3 justify-center">
                      {["draft", "confirmed"].includes(order.status) && (
                        <button
                          onClick={() => handleApprovalClick(order, "approve")}
                          className="text-green-400"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}

                      {["draft", "confirmed"].includes(order.status) && (
                        <button
                          onClick={() => handleApprovalClick(order, "reject")}
                          className="text-red-400"
                        >
                          <XCircle size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteClick(order)}
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4 flex gap-2 items-center text-red-400">
              <AlertCircle size={20} />
              Delete Order
            </h2>
            <p className="mb-6">
              Delete order {orderToDelete?.order_number}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h2 className="text-xl mb-4">
              {approveAction === "approve" ? "Approve Order" : "Reject Order"}
            </h2>
            <p className="mb-6">
              {approveAction === "approve" ? "Approve" : "Reject"} order{" "}
              {orderToApprove?.order_number}?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                className={`px-4 py-2 rounded ${
                  approveAction === "approve" ? "bg-green-600" : "bg-red-600"
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