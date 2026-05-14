// src/pages/PurchaseOrdersList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { 
  FiPrinter, 
  FiSearch, 
  FiRefreshCw, 
  FiArrowLeft,
  FiPackage 
} from "react-icons/fi";

export default function PurchaseOrdersList() {
  const navigate = useNavigate();

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
      const res = await api.get("/hr/departments/");
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

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN");
  };

  const items = po.items || [];

  const itemsHtml = items.length
    ? items.map((item, index) => {
        const qty = Number(item.ordered_qty || item.quantity || 0);
        const price = Number(item.unit_price || item.rate || 0);
        const total = qty * price;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.item_details?.name || item.item?.name || "—"}</td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">₹ ${formatAmount(price)}</td>
            <td style="text-align:right;">₹ ${formatAmount(total)}</td>
          </tr>
        `;
      }).join("")
    : `
      <tr>
        <td colspan="5" style="text-align:center; padding:20px;">
          No items found
        </td>
      </tr>
    `;

  printWindow.document.write(`
    <html>
      <head>
        <title>Purchase Order - ${po.po_number || "N/A"}</title>

        <style>
          *{
            box-sizing:border-box;
          }

          body{
            font-family: Arial, sans-serif;
            padding:40px;
            color:#222;
          }

          .container{
            max-width:1000px;
            margin:auto;
          }

          .header{
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-bottom:40px;
            border-bottom:2px solid #e5e5e5;
            padding-bottom:20px;
          }

          .title{
            font-size:32px;
            font-weight:bold;
          }

          .po-info{
            text-align:right;
            line-height:1.8;
          }

          .section{
            display:flex;
            justify-content:space-between;
            margin-bottom:30px;
            gap:40px;
          }

          .card{
            flex:1;
            border:1px solid #ddd;
            border-radius:10px;
            padding:20px;
            background:#fafafa;
          }

          .card h3{
            margin-top:0;
            margin-bottom:15px;
            font-size:18px;
          }

          table{
            width:100%;
            border-collapse:collapse;
            margin-top:20px;
          }

          th{
            background:#f4f4f4;
            padding:14px;
            border:1px solid #ddd;
            text-align:left;
          }

          td{
            padding:14px;
            border:1px solid #ddd;
          }

          .totals{
            margin-top:30px;
            margin-left:auto;
            width:350px;
          }

          .totals-row{
            display:flex;
            justify-content:space-between;
            margin-bottom:12px;
            font-size:16px;
          }

          .grand-total{
            font-size:22px;
            font-weight:bold;
            border-top:2px solid #000;
            padding-top:15px;
            margin-top:15px;
          }

          .footer{
            margin-top:80px;
            text-align:center;
            color:#666;
            font-size:14px;
          }

          @media print {
            body{
              padding:20px;
            }
          }
        </style>
      </head>

      <body>
        <div class="container">

          <div class="header">
            <div>
              <div class="title">Purchase Order</div>
            </div>

            <div class="po-info">
              <div><strong>PO Number:</strong> ${po.po_number || "—"}</div>
              <div><strong>Date:</strong> ${formatDate(po.created_at)}</div>
              <div><strong>Status:</strong> ${(po.status || "DRAFT").toUpperCase()}</div>
            </div>
          </div>

          <div class="section">

            <div class="card">
              <h3>Department</h3>
              <div>
                ${departments[po.department] || po.department_name || "—"}
              </div>
            </div>

            <div class="card">
              <h3>Vendor Details</h3>

              <div>
                ${po.vendor?.name || po.vendor_name || "—"}
              </div>

              <div>
                ${po.vendor?.phone || ""}
              </div>

              <div>
                ${po.vendor?.email || ""}
              </div>
            </div>

          </div>

          <table>
            <thead>
              <tr>
                <th style="width:70px;">#</th>
                <th>Item</th>
                <th style="width:120px; text-align:center;">Qty</th>
                <th style="width:160px; text-align:right;">Unit Price</th>
                <th style="width:180px; text-align:right;">Total</th>
              </tr>
            </thead>

            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">

            <div class="totals-row">
              <span>Subtotal</span>
              <span>₹ ${formatAmount(po.subtotal || 0)}</span>
            </div>

            <div class="totals-row">
              <span>Tax (${po.tax_percentage || 0}%)</span>
              <span>₹ ${formatAmount(po.tax_amount || 0)}</span>
            </div>

            <div class="totals-row grand-total">
              <span>Grand Total</span>
              <span>₹ ${formatAmount(po.total_amount || 0)}</span>
            </div>

          </div>

          <div class="footer">
            Thank you for your business
          </div>

        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>

      </body>
    </html>
  `);

  printWindow.document.close();
};

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiPackage className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Purchase Orders
                </h1>
                <p className="text-zinc-500">Manage and track all purchase orders</p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchPurchaseOrders}
            className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
          >
            <FiRefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search PO Number, Vendor or Department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 px-5 py-3.5 rounded-2xl focus:outline-none focus:border-zinc-400 min-w-[180px]"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">PO Number</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Department</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                  <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total Amount</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-zinc-500 mt-4">Loading purchase orders...</p>
                    </td>
                  </tr>
                ) : filteredPos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-20 text-zinc-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredPos.map((po) => (
                    <tr key={po.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-medium text-zinc-900">
                        {po.po_number || '—'}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {departments[po.department] || po.department_name || '—'}
                      </td>
                      <td className="px-8 py-6 text-zinc-700">
                        {po.vendor_name || po.vendor?.name || '—'}
                      </td>
                      <td className="px-8 py-6 text-right font-semibold text-zinc-900">
                        ₹ {formatAmount(po.total_amount)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                            po.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {(po.status || "DRAFT").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => handlePrint(po)}
                          className="text-zinc-700 hover:text-zinc-900 transition p-3 hover:bg-zinc-100 rounded-xl"
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