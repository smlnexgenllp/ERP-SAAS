import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { FiPrinter, FiSearch, FiRefreshCw, FiArrowLeft } from "react-icons/fi";

export default function PurchaseOrdersList() {
  const [pos, setPos] = useState([]);
  const [filteredPos, setFilteredPos] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
 const [departments, setDepartments] = useState({});
  useEffect(() => {
    fetchPurchaseOrders();
    fetchDepartments();
  }, []);
const fetchDepartments = async () => {
  try {
    const res = await api.get("/hr/departments/"); // adjust if different

    const map = {};
    res.data.forEach((d) => {
      map[d.id] = d.name;
    });

    setDepartments(map);
  } catch (err) {
    console.error("Error loading departments", err);
  }
};
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/purchase-orders/");
      console.log("Loaded purchase orders:", res.data);
      setPos(res.data || []);
      setFilteredPos(res.data || []);
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
    <title>Purchase Order - ${po.po_number || 'N/A'}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
      .container { max-width: 900px; margin: 0 auto; }
      h1 { text-align: center; margin-bottom: 10px; }
      .info { display: flex; justify-content: space-between; margin: 30px 0; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { border: 1px solid #ccc; padding: 10px; }
      th { background-color: #f8f8f8; text-align: left; }
      .total-section { margin-top: 30px; text-align: right; }
      .total-section div { margin: 6px 0; }
      .grand-total { font-size: 1.3em; font-weight: bold; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Purchase Order</h1>

      <p style="text-align:center;">
        <strong>PO Number:</strong> ${po.po_number || '—'}
      </p>

      <p style="text-align:center;">
        <strong>Date:</strong> ${new Date(po.created_at || Date.now()).toLocaleDateString('en-IN')}
      </p>

      <div class="info">
        <div>
          <strong>Department:</strong><br>
          ${departments[po.department] || po.department || '—'}
        </div>

        <div style="text-align:right;">
          <strong>Vendor:</strong><br>
          ${po.vendor_details?.name || '—'}<br>
          ${po.vendor_details?.phone || ''}<br>
          ${po.vendor_details?.email || ''}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>

        <tbody>
          ${(po.items || []).map((item, i) => {
            const qty = Number(item.ordered_qty || 0);
            const price = Number(item.unit_price || item.rate || 0);
            const total = qty * price;

            return `
              <tr>
                <td>${i + 1}</td>
                <td>${item.item_details?.name || '—'}</td>
                <td style="text-align:center;">${qty}</td>
                <td style="text-align:right;">₹ ${formatAmount(price)}</td>
                <td style="text-align:right;">₹ ${formatAmount(total)}</td>
              </tr>
            `;
          }).join('') || `
            <tr>
              <td colspan="5" style="text-align:center;">No items found</td>
            </tr>
          `}
        </tbody>
      </table>

      <div class="total-section">
        <div>Subtotal: ₹ ${formatAmount(po.subtotal || 0)}</div>
        <div>Tax (${po.tax_percentage || 0}%): ₹ ${formatAmount(po.tax_amount || 0)}</div>

        <div class="grand-total">
          Grand Total: ₹ ${formatAmount(po.total_amount)}
        </div>
      </div>

      <div style="margin-top:60px; text-align:center; color:#555; font-size:0.9em;">
        Thank you for your business
      </div>
    </div>
  </body>
</html>
`);
    printWindow.document.close();
  };

  // Back Button Handler
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-50 p-6 md:p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-cyan-300 hover:text-cyan-200 transition-all"
            >
              <FiArrowLeft size={22} />
              <span className="font-medium">Back</span>
            </button>

            <h1 className="text-3xl md:text-4xl font-bold text-cyan-300">
              All Purchase Orders
            </h1>
          </div>

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
                      <td className="px-6 py-4">
                        {po.department?.name || po.department || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {po.vendor?.name || '—'}
                      </td>
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