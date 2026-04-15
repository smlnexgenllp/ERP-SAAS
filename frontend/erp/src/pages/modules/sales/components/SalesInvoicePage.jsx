import React, { useState, useEffect, useMemo } from "react";
import api from "../../../../services/api";
import { ArrowLeft, FileText, Plus, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function SalesInvoicePage() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState(null);

  // Filters
  const [customerFilter, setCustomerFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoiceRes, dispatchRes] = await Promise.all([
        api.get("/sale/invoices/"),
        api.get("/inventory/dispatch/?status=dispatched")
      ]);

      setInvoices(invoiceRes.data || []);
      setDispatches(dispatchRes.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const createInvoiceFromDispatch = async (dispatchId) => {
    if (creatingId) return;

    setCreatingId(dispatchId);

    try {
      await api.post("/sale/invoices/create_from_dispatch/", {
        dispatch_id: dispatchId,
      });

      alert("✅ Sales Invoice created successfully!");

      await fetchData(); // Refresh both lists
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "";

      if (errorMsg.toLowerCase().includes("already")) {
        alert("⚠️ This dispatch has already been converted to an invoice.");
      } else {
        alert(`❌ ${errorMsg}`);
      }

      await fetchData();
    } finally {
      setCreatingId(null);
    }
  };

  // Filtered Dispatches (only those not yet invoiced)
  const filteredDispatches = useMemo(() => {
    const invoicedDCNumbers = new Set(
      invoices
        .map((inv) => String(inv.dispatch || inv.dispatch_number || "").trim())
        .filter(Boolean)
    );

    return dispatches.filter((dc) => {
      const dcNumber = String(dc.dc_number).trim();

      const isInvoiced = invoicedDCNumbers.has(dcNumber);

      return (
        !isInvoiced &&
        (!customerFilter || 
          dc.customer_name?.toLowerCase().includes(customerFilter.toLowerCase())) &&
        (!fromDate || dayjs(dc.date || dc.created_at).isAfter(dayjs(fromDate).subtract(1, "day"))) &&
        (!toDate || dayjs(dc.date || dc.created_at).isBefore(dayjs(toDate).add(1, "day")))
      );
    });
  }, [dispatches, invoices, customerFilter, fromDate, toDate]);

  // Total Amount from existing invoices
  const totalInvoiceAmount = invoices.reduce((sum, inv) => {
    return sum + parseFloat(inv.grand_total || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-10 h-10 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold">Sales Invoice Management</h1>
              <p className="text-cyan-400 mt-1">Create invoices from dispatched Delivery Challans</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-cyan-700 rounded-xl text-cyan-300 transition"
            >
              <ArrowLeft size={20} /> Back
            </button>
            <button
              onClick={() => navigate("/sales-invoice-list")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
            >
              <FileText size={20} /> View All Invoices
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-cyan-400 text-sm mb-2">Search by Customer</label>
              <input
                type="text"
                placeholder="Type customer name..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-5 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-cyan-400 text-sm mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-gray-800 border border-cyan-700 text-cyan-200 px-5 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-cyan-400 text-sm mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-gray-800 border border-cyan-700 text-cyan-200 px-5 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>

            <button
              onClick={() => {
                setCustomerFilter("");
                setFromDate("");
                setToDate("");
              }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-cyan-700 text-cyan-300 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
            <p className="text-cyan-400 text-sm">Total Invoices Created</p>
            <p className="text-5xl font-bold text-cyan-100 mt-4">{invoices.length}</p>
          </div>

          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
            <p className="text-cyan-400 text-sm">Pending for Invoicing</p>
            <p className="text-5xl font-bold text-orange-400 mt-4">{filteredDispatches.length}</p>
          </div>

          <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6">
            <p className="text-cyan-400 text-sm">Total Invoice Value</p>
            <p className="text-5xl font-bold text-green-400 mt-4">
              ₹{totalInvoiceAmount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Pending Dispatches Table */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-cyan-800 flex justify-between items-center bg-gray-950">
            <div>
              <h2 className="text-2xl font-semibold text-cyan-200">Dispatches Ready for Invoicing</h2>
              <p className="text-cyan-400 mt-1">
                {filteredDispatches.length} dispatches available to convert into Sales Invoice
              </p>
            </div>
            {loading && <Loader2 className="animate-spin text-cyan-400" size={28} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-950 border-b border-cyan-800">
                  <th className="p-5 text-left text-cyan-400 font-medium">DC Number</th>
                  <th className="p-5 text-left text-cyan-400 font-medium">Customer</th>
                  <th className="p-5 text-center text-cyan-400 font-medium">Dispatch Date</th>
                  <th className="p-5 text-right text-cyan-400 font-medium">Amount (₹)</th>
                  <th className="p-5 text-center text-cyan-400 font-medium w-56">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900">
                {filteredDispatches.map((dc) => {
                  const amount = parseFloat(dc.total_value || dc.grand_total || dc.total_amount || 0);

                  return (
                    <tr key={dc.id} className="hover:bg-gray-800/70 transition-colors">
                      <td className="p-5 font-mono text-cyan-100">{dc.dc_number}</td>
                      <td className="p-5 text-cyan-200">{dc.customer_name}</td>
                      <td className="p-5 text-center text-cyan-300">
                        {dayjs(dc.date || dc.created_at).format("DD-MM-YYYY")}
                      </td>
                      <td className="p-5 text-right font-semibold text-green-400">
                        ₹{amount.toLocaleString("en-IN")}
                      </td>
                      <td className="p-5">
                        <button
                          onClick={() => createInvoiceFromDispatch(dc.id)}
                          disabled={creatingId === dc.id}
                          className={`w-full py-3 px-6 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all
                            ${creatingId === dc.id
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                        >
                          {creatingId === dc.id ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              Creating Invoice...
                            </>
                          ) : (
                            <>
                              <Plus size={18} />
                              Create Sales Invoice
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredDispatches.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="p-20 text-center">
                      <p className="text-cyan-400 text-lg">
                        No pending dispatches found
                      </p>
                      <p className="text-cyan-500 mt-2">
                        All dispatched Delivery Challans have been converted to invoices.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}