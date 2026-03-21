// TransactionHistory.jsx
import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { Search, RefreshCw, Printer, X, Calendar } from "lucide-react";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Date filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
    } catch (err) {
      setError("Could not load transfer history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever searchTerm, fromDate, or toDate changes
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
      // Add one day to include the full toDate
      const end = new Date(toDate);
      end.setDate(end.getDate() + 1);
      result = result.filter(tx => new Date(tx.created_at) < end);
    }

    setFilteredTransactions(result);
  }, [searchTerm, fromDate, toDate, transactions]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">Transfer History</h1>
          <p className="text-slate-400 mt-1">All department-to-department material movements</p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Text Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search department, item, person..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 py-3 focus:border-cyan-500 outline-none"
          />
        </div>

        {/* From Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 py-3 focus:border-cyan-500 outline-none"
          />
        </div>

        {/* To Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 py-3 focus:border-cyan-500 outline-none"
          />
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSearchTerm("");
            setFromDate("");
            setToDate("");
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600"
        >
          <X size={18} /> Clear Filters
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading transfer history...</div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {searchTerm || fromDate || toDate
            ? "No matching transfers found"
            : "No material transfers recorded yet"}
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium">Date & Time</th>
                    <th className="px-6 py-4 text-left font-medium">From → To</th>
                    <th className="px-6 py-4 text-left font-medium">Item</th>
                    <th className="px-6 py-4 text-left font-medium">Qty</th>
                    <th className="px-6 py-4 text-left font-medium">Sent By</th>
                    <th className="px-6 py-4 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/60">
                      <td className="px-6 py-4">{formatDate(tx.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.from_department_name || "—"}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          → {tx.to_department_name || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">{tx.item_name || "—"}</td>
                      <td className="px-6 py-4 font-medium">{tx.quantity}</td>
                      <td className="px-6 py-4">{tx.sent_by_name || "—"}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePrint(tx)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-900/40 hover:bg-green-900/60 border border-green-700 rounded text-green-300 text-sm"
                        >
                          <Printer size={16} /> Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredTransactions.length} of {transactions.length} transfers
          </div>
        </>
      )}

      {/* Print Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-cyan-300">
                Material Transfer Slip #{selectedTransfer.id}
              </h2>
              <button
                onClick={closePrintModal}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Slip Content */}
            <div className="p-6">
              <div id="printSlipContent" className="bg-white text-black p-8 rounded-lg">
                <h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide">
                  Material Transfer Slip
                </h1>

                <div className="space-y-5 text-base">
                  <div className="row flex">
                    <div className="label w-44 font-bold">Date & Time:</div>
                    <div>{formatDate(selectedTransfer.created_at)}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">From Department:</div>
                    <div>{selectedTransfer.from_department_name || "—"}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">To Department:</div>
                    <div>{selectedTransfer.to_department_name || "—"}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">Item / Material:</div>
                    <div>{selectedTransfer.item_name || "—"}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">Quantity:</div>
                    <div className="font-bold text-lg">{selectedTransfer.quantity}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">Sent By:</div>
                    <div>{selectedTransfer.sent_by_name || "—"}</div>
                  </div>
                  <div className="row flex">
                    <div className="label w-44 font-bold">Status:</div>
                    <div className="capitalize">{selectedTransfer.status || "—"}</div>
                  </div>
                </div>

                <hr className="my-10 border-gray-400" />

                <div className="text-center text-sm text-gray-600">
                  <p>Generated on {new Date().toLocaleDateString("en-IN")}</p>
                  <div className="mt-12">
                    <p className="border-t border-gray-500 inline-block pt-2 px-12">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 p-5 border-t border-slate-700">
              <button
                onClick={closePrintModal}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={printSlip}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
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