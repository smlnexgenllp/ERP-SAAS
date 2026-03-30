import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { FiPrinter, FiSearch, FiRefreshCw } from "react-icons/fi";

export default function PurchaseOrdersList() {
  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/purchase-orders/");
      setPos(res.data.results || res.data || []);
      setFilteredPos(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search
  useEffect(() => {
    let result = [...pos];

    if (statusFilter !== "all") {
      result = result.filter(po => 
        (po.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(po =>
        (po.po_number || "").toLowerCase().includes(term) ||
        (po.vendor_name || "").toLowerCase().includes(term) ||
        (po.department_name || "").toLowerCase().includes(term)
      );
    }

    setFilteredPos(result);
  }, [pos, statusFilter, searchTerm]);

  const formatAmount = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('en-IN', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  const handlePrint = (po) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the document");
      return;
    }

    // Safe data extraction
    const poNumber = po.po_number || "—";
    const poDate = po.created_at 
      ? new Date(po.created_at).toLocaleDateString('en-IN') 
      : "—";

    const departmentName = po.department_name || po.department || "—";
    const vendorName = po.vendor_name || "—";

    // Items
    const itemsHtml = (po.items || []).map((item, i) => {
      const itemName = item.item_details?.name || "—";
      const qty = Number(item.ordered_qty || item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const lineTotal = qty * unitPrice;

      return `
        <tr>
          <td style="text-align:center; padding:12px; border:1px solid #ccc;">${i + 1}</td>
          <td style="padding:12px; border:1px solid #ccc;">${itemName}</td>
          <td style="text-align:center; padding:12px; border:1px solid #ccc;">${qty}</td>
          <td style="text-align:right; padding:12px; border:1px solid #ccc;">₹ ${formatAmount(unitPrice)}</td>
          <td style="text-align:right; padding:12px; border:1px solid #ccc; font-weight:500;">
            ₹ ${formatAmount(lineTotal)}
          </td>
        </tr>
      `;
    }).join('');

    const subtotal = Number(po.subtotal || 0);
    const taxPercentage = Number(po.tax_percentage || 0);
    const taxAmount = Number(po.tax_amount || 0);
    const grandTotal = Number(po.total_amount || 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${poNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { text-align: center; color: #1e3a8a; }
            .po-header { text-align: center; margin-bottom: 30px; }
            .info { display: flex; justify-content: space-between; margin: 30px 0; font-size: 1.1em; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th, td { border: 1px solid #555; padding: 12px; }
            th { background-color: #1e3a8a; color: white; }
            .totals { margin-top: 40px; text-align: right; font-size: 1.15em; }
            .grand-total { font-size: 1.45em; font-weight: bold; color: #1e3a8a; margin-top: 15px; }
            .footer { margin-top: 80px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>PURCHASE ORDER</h1>
            <div class="po-header">
              <p><strong>PO Number:</strong> ${poNumber}</p>
              <p><strong>Date:</strong> ${poDate}</p>
            </div>

            <div class="info">
              <div>
                <strong>Department:</strong><br>
                ${departmentName}
              </div>
              <div style="text-align:right;">
                <strong>Vendor:</strong><br>
                ${vendorName}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || '<tr><td colspan="5" style="text-align:center;padding:30px;color:#666;">No items found</td></tr>'}
              </tbody>
            </table>

            <div class="totals">
              <div>Subtotal: ₹ ${formatAmount(subtotal)}</div>
              <div>Tax (${taxPercentage}%): ₹ ${formatAmount(taxAmount)}</div>
              <div class="grand-total">
                Grand Total: ₹ ${formatAmount(grandTotal)}
              </div>
            </div>

            <div class="footer">
              This is a computer generated document.<br>
              Thank you for your business.
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 p-6 md:p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-300">
            All Purchase Orders
          </h1>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                placeholder="Search PO # / Vendor / Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-700 pl-10 pr-4 py-2 rounded-lg w-72 focus:outline-none focus:border-cyan-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:border-cyan-600"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
            </select>

            <button
              onClick={fetchPurchaseOrders}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-gray-900 border border-cyan-900/50 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4">PO Number</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900/30">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : filteredPos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredPos.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium">{po.po_number || '—'}</td>
                      <td className="px-6 py-4">{po.department_name || po.department || '—'}</td>
                      <td className="px-6 py-4">{po.vendor_name || '—'}</td>
                      <td className="px-6 py-4 text-right font-medium text-cyan-200">
                        ₹ {formatAmount(po.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            po.status === "approved"
                              ? "bg-green-900/60 text-green-300"
                              : po.status === "draft"
                              ? "bg-yellow-900/60 text-yellow-300"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {(po.status || "DRAFT").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handlePrint(po)}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors p-2"
                          title="Print Purchase Order"
                        >
                          <FiPrinter size={22} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}