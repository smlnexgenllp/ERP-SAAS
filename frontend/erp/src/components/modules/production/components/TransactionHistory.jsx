// src/pages/TransactionHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { 
  Search, 
  RefreshCw, 
  Printer, 
  X, 
  Calendar,
  ArrowLeft,
  History,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";

export default function TransactionHistory() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Date filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Print modal
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

  // Apply filters
  useEffect(() => {
    let result = [...transactions];

    // Text search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(tx => 
        (tx.from_department_name?.toLowerCase().includes(q) ||
         tx.to_department_name?.toLowerCase().includes(q) ||
         tx.item_name?.toLowerCase().includes(q) ||
         tx.sent_by_name?.toLowerCase().includes(q) ||
         String(tx.quantity).includes(q) ||
         tx.created_at?.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (fromDate) {
      result = result.filter(tx => new Date(tx.created_at) >= new Date(fromDate));
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      result = result.filter(tx => new Date(tx.created_at) < end);
    }

    setFilteredTransactions(result);
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate, transactions]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

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
    const printContent = document.getElementById("printSlipContent")?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Material Transfer Slip - ${selectedTransfer?.id || "N/A"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #000; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
            .slip { max-width: 700px; margin: 0 auto; }
            .row { display: flex; margin: 12px 0; font-size: 15px; }
            .label { width: 180px; font-weight: bold; }
            .value { flex: 1; }
            hr { border: 0; border-top: 1px solid #999; margin: 30px 0; }
            .footer { text-align: center; margin-top: 50px; font-size: 14px; color: #555; }
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
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
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
                <History className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Transfer History
                </h1>
                <p className="text-zinc-500">Material movement records between departments</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition disabled:opacity-70"
          >
            <RefreshCw size={20} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search department, item, or person..."
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFromDate("");
                  setToDate("");
                }}
                className="w-full px-6 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
            <AlertCircle size={22} />
            {error}
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading transfer history...</p>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
            <History className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
            <p className="text-xl font-medium text-zinc-600">
              {searchTerm || fromDate || toDate ? "No matching transfers found" : "No material transfers recorded yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Date & Time</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">From → To</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Item</th>
                      <th className="px-8 py-5 text-right text-sm font-semibold text-zinc-600">Quantity</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Sent By</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 text-zinc-600">{formatDate(tx.created_at)}</td>
                        <td className="px-8 py-6">
                          <div className="font-medium text-zinc-900">{tx.from_department_name || "—"}</div>
                          <div className="text-sm text-zinc-500 mt-1">→ {tx.to_department_name || "—"}</div>
                        </td>
                        <td className="px-8 py-6 text-zinc-700">{tx.item_name || "—"}</td>
                        <td className="px-8 py-6 text-right font-semibold text-zinc-900">{tx.quantity}</td>
                        <td className="px-8 py-6 text-zinc-600">{tx.sent_by_name || "—"}</td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => handlePrint(tx)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition mx-auto"
                          >
                            <Printer size={18} />
                            Print Slip
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
              <div className="flex items-center justify-between mt-8 px-4">
                <div className="text-sm text-zinc-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} 
                  of {filteredTransactions.length} transfers
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>

                  <div className="px-6 py-3 bg-white border border-zinc-200 rounded-2xl font-medium text-zinc-700">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Print Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-semibold text-zinc-900">
                Material Transfer Slip #{selectedTransfer.id}
              </h2>
              <button 
                onClick={closePrintModal} 
                className="text-zinc-400 hover:text-zinc-600 p-2 rounded-full hover:bg-zinc-100 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-zinc-50">
              <div id="printSlipContent" className="bg-white p-10 rounded-2xl border border-zinc-200 text-black">
                <h1 className="text-2xl font-bold text-center mb-10">MATERIAL TRANSFER SLIP</h1>

                <div className="space-y-6 text-base">
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">Date & Time:</div>
                    <div>{formatDate(selectedTransfer.created_at)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">From Department:</div>
                    <div>{selectedTransfer.from_department_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">To Department:</div>
                    <div>{selectedTransfer.to_department_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">Item:</div>
                    <div>{selectedTransfer.item_name || "—"}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">Quantity:</div>
                    <div className="font-bold text-xl">{selectedTransfer.quantity}</div>
                  </div>
                  <div className="flex">
                    <div className="w-44 font-semibold text-zinc-600">Sent By:</div>
                    <div>{selectedTransfer.sent_by_name || "—"}</div>
                  </div>
                </div>

                <hr className="my-12 border-zinc-300" />

                <div className="text-center text-sm text-zinc-500">
                  Generated on {new Date().toLocaleDateString("en-IN")}
                  <div className="mt-16">
                    <p className="border-t border-zinc-400 inline-block pt-2 px-16">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-100 flex justify-end gap-4">
              <button
                onClick={closePrintModal}
                className="px-8 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700"
              >
                Close
              </button>
              <button
                onClick={printSlip}
                className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl flex items-center gap-3"
              >
                <Printer size={20} />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}