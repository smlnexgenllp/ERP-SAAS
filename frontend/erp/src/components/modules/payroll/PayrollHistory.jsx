// PayrollHistory.jsx - Cyberpunk / Neon Terminal Theme
import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const PayrollHistory = ({ history = [], loading = false }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':    return 'green';
      case 'PENDING': return 'amber';
      case 'DRAFT':   return 'gray';
      default:        return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="bg-gray-900/20 border border-cyan-900 rounded-xl p-6 shadow-lg shadow-cyan-950/30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-pink-400 shadow shadow-pink-500/50"></div>
        <h2 className="text-pink-400 text-2xl font-bold">PAYROLL HISTORY TERMINAL</h2>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
          <p className="text-cyan-300">Loading payroll records...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No payroll history available yet</p>
          <p className="text-gray-500 mt-2">Generate invoices to see records here</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800/60 border-b border-cyan-800">
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Invoice #</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Employee</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Month</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold text-right">Amount</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Status</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold">Generated</th>
                  <th className="px-6 py-4 text-cyan-300 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-cyan-900/50 hover:bg-gray-800/40 transition"
                    >
                      <td className="px-6 py-4 text-gray-300 font-medium">
                        {invoice.invoiceNumber || invoice.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-cyan-300">{invoice.employeeName}</p>
                          <p className="text-sm text-gray-500">{invoice.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{invoice.month}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-400">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(
                            invoice.status
                          )}-900/40 text-${getStatusColor(invoice.status)}-300 border border-${getStatusColor(
                            invoice.status
                          )}-700`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {invoice.generatedDate
                          ? new Date(invoice.generatedDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            title="View Invoice"
                            className="text-cyan-400 hover:text-pink-400 transition"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            title="Download PDF"
                            className="text-cyan-400 hover:text-pink-400 transition"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div className="flex items-center gap-3 text-gray-400">
              <label className="text-sm">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                className="bg-gray-900 border border-cyan-700 rounded px-3 py-1 text-cyan-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-sm">
                {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, history.length)} of {history.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 0}
                  className="px-3 py-1 bg-gray-800 border border-cyan-700 rounded hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  Prev
                </button>
                <button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= history.length}
                  className="px-3 py-1 bg-gray-800 border border-cyan-700 rounded hover:bg-gray-700 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollHistory;