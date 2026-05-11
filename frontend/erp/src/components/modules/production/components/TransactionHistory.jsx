// src/pages/TransactionHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import {
  Search,
  RefreshCw,
  Printer,
  X,
  ArrowLeft,
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function TransactionHistory() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedTransfer, setSelectedTransfer] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/inventory/material-transfer/");
      setTransactions(res.data || []);
      setFilteredTransactions(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      setError("Could not load transfer history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();

      result = result.filter(
        (tx) =>
          tx.from_department_name?.toLowerCase().includes(q) ||
          tx.to_department_name?.toLowerCase().includes(q) ||
          tx.item_name?.toLowerCase().includes(q) ||
          tx.sent_by_name?.toLowerCase().includes(q) ||
          String(tx.quantity).includes(q) ||
          tx.created_at?.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      result = result.filter(
        (tx) => new Date(tx.created_at) >= new Date(fromDate)
      );
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);

      result = result.filter(
        (tx) => new Date(tx.created_at) < end
      );
    }

    setFilteredTransactions(result);
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate, transactions]);

  const totalPages = Math.ceil(
    filteredTransactions.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (iso) => {
    if (!iso) return "—";

    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = (tx) => {
    setSelectedTransfer(tx);
  };

  const closePrintModal = () => {
    setSelectedTransfer(null);
  };

  const printSlip = () => {
    const printContent =
      document.getElementById("printSlipContent")?.innerHTML;

    if (!printContent) return;

    const printWindow = window.open("", "", "width=900,height=700");

    printWindow.document.write(`
      <html>
        <head>
          <title>Transfer Slip</title>
          <style>
            body {
              font-family: Arial;
              padding: 30px;
            }

            h1 {
              text-align:center;
            }

            .row {
              margin: 14px 0;
              display:flex;
            }

            .label {
              width:200px;
              font-weight:bold;
            }
          </style>
        </head>

        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-5 py-7">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-7">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                navigate("/manufacturing/dashboard")
              }
              className="h-11 px-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 flex items-center gap-2 text-sm font-medium transition"
            >
              <ArrowLeft size={18} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-sm">
                <History className="w-5 h-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Transfer History
                </h1>

                <p className="text-sm text-zinc-500 mt-0.5">
                  Material transfer records
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="h-11 px-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div className="relative md:col-span-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search transfer..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
              />
            </div>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>

              <p className="mt-4 text-zinc-500 text-sm">
                Loading transfer history...
              </p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center">
            <History className="w-12 h-12 text-zinc-300 mx-auto mb-4" />

            <p className="text-zinc-600 font-medium">
              No transfer records found
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1000px]">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        From
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        To
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Item
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Qty
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Sent By
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-100">
                    {paginatedTransactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={`transition hover:bg-zinc-50 ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-zinc-50/40"
                        }`}
                      >
                        <td className="px-5 py-4 text-sm text-zinc-600 whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-zinc-800 whitespace-nowrap">
                          {tx.from_department_name || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-zinc-800 whitespace-nowrap">
                          {tx.to_department_name || "—"}
                        </td>

                        <td className="px-5 py-4 text-sm text-zinc-700">
                          {tx.item_name || "—"}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[55px] px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                            {tx.quantity}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-zinc-600 whitespace-nowrap">
                          {tx.sent_by_name || "—"}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handlePrint(tx)}
                            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium transition"
                          >
                            <Printer size={16} />
                            Print
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <p className="text-sm text-zinc-500">
                  Showing{" "}
                  <span className="font-medium text-zinc-700">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-zinc-700">
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredTransactions.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-zinc-700">
                    {filteredTransactions.length}
                  </span>
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.max(prev - 1, 1)
                      )
                    }
                    disabled={currentPage === 1}
                    className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="h-10 px-5 rounded-xl bg-zinc-900 text-white flex items-center text-sm font-medium">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
                    }
                    disabled={currentPage === totalPages}
                    className="h-10 px-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">

            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">
                Material Transfer Slip
              </h2>

              <button
                onClick={closePrintModal}
                className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 bg-zinc-50">
              <div
                id="printSlipContent"
                className="bg-white border border-zinc-200 rounded-2xl p-8"
              >
                <h1 className="text-2xl font-bold text-center mb-10">
                  MATERIAL TRANSFER SLIP
                </h1>

                <div className="space-y-5 text-sm">
                  <div className="flex">
                    <div className="w-44 font-semibold">
                      Date & Time
                    </div>
                    <div>{formatDate(selectedTransfer.created_at)}</div>
                  </div>

                  <div className="flex">
                    <div className="w-44 font-semibold">
                      From Department
                    </div>
                    <div>
                      {selectedTransfer.from_department_name}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-44 font-semibold">
                      To Department
                    </div>
                    <div>
                      {selectedTransfer.to_department_name}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-44 font-semibold">Item</div>
                    <div>{selectedTransfer.item_name}</div>
                  </div>

                  <div className="flex">
                    <div className="w-44 font-semibold">
                      Quantity
                    </div>
                    <div className="font-bold text-lg">
                      {selectedTransfer.quantity}
                    </div>
                  </div>

                  <div className="flex">
                    <div className="w-44 font-semibold">
                      Sent By
                    </div>
                    <div>{selectedTransfer.sent_by_name}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-zinc-200 flex justify-end gap-3">
              <button
                onClick={closePrintModal}
                className="h-11 px-5 border border-zinc-200 rounded-xl hover:bg-zinc-50"
              >
                Close
              </button>

              <button
                onClick={printSlip}
                className="h-11 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center gap-2"
              >
                <Printer size={18} />
                Print Slip
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}