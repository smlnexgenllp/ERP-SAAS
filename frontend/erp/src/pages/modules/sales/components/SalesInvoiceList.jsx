import React, { useEffect, useState } from "react";
import api from "../../../../services/api";
import { Printer, CheckCircle, ArrowLeft, Eye, X } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

export default function SalesInvoiceList() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [organization, setOrganization] = useState(null);

  // Filters
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchInvoices();
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const userRes = await api.get("/auth/current-user/");
      if (userRes.data?.organization) {
        setOrganization(userRes.data.organization);
      }
    } catch (err) {
      console.warn("Organization fetch failed, using fallback");
      setOrganization({
        name: "VAF pvt lmt",
        address: "Address Line, City, Tamil Nadu - PIN",
        gstin: "29AAACC1234C1Z5",
        pan: "AAACC1234C",
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/sale/invoices/");
      setInvoices(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    return (
      (!customerFilter ||
        inv.customer_name?.toLowerCase().includes(customerFilter.toLowerCase())) &&
      (!statusFilter || inv.status === statusFilter) &&
      (!fromDate || dayjs(inv.invoice_date).isAfter(dayjs(fromDate).subtract(1, "day"))) &&
      (!toDate || dayjs(inv.invoice_date).isBefore(dayjs(toDate).add(1, "day")))
    );
  });

  const approveInvoice = async (id) => {
    try {
      await api.post(`/sale/invoices/${id}/approve/`);
      alert("✅ Invoice approved successfully!");
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  // Professional Invoice Preview (kept mostly same but improved for dark modal)
  const InvoicePrintView = ({ invoice, org }) => {
    if (!invoice) return null;

    const items = invoice.items || [];

    let taxableTotal = 0;
    let gstTotal = 0;

    items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gst_rate) || 18;

      const lineTaxable = qty * rate;
      const lineGst = lineTaxable * (gstRate / 100);

      taxableTotal += lineTaxable;
      gstTotal += lineGst;
    });

    const grandTotal = taxableTotal + gstTotal;

    return (
      <div className="bg-white text-black p-10 max-w-5xl mx-auto font-serif min-h-[297mm]">
        {/* Header */}
        <div className="flex justify-between border-b-4 border-black pb-8 mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-wider">TAX INVOICE</h1>
            <p className="text-lg mt-2">Original / Duplicate Copy</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold uppercase">{org?.name || "VAF pvt lmt"}</div>
            <div className="text-sm mt-3 leading-tight">
              {org?.address || "Address Line, City, Tamil Nadu - PIN"}
            </div>
            {org?.gstin && <div className="text-sm mt-1">GSTIN: {org.gstin}</div>}
            {org?.pan && <div className="text-sm">PAN: {org.pan}</div>}
          </div>
        </div>

        {/* Bill To & Invoice Info */}
        <div className="grid grid-cols-2 gap-12 mb-10">
          <div>
            <p className="font-semibold text-lg mb-3">Bill To:</p>
            <p className="font-medium text-xl">{invoice.customer_name}</p>
            <p className="whitespace-pre-line mt-2 text-gray-700">
              {invoice.customer_address || "Customer Address"}
            </p>
            {invoice.customer_gstin && (
              <p className="mt-3 font-medium">GSTIN: {invoice.customer_gstin}</p>
            )}
          </div>

          <div className="text-right space-y-1">
            <p><strong>Invoice No:</strong> {invoice.invoice_number}</p>
            <p><strong>Date:</strong> {dayjs(invoice.invoice_date).format("DD-MM-YYYY")}</p>
            <p><strong>Place of Supply:</strong> Tamil Nadu</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border border-black text-sm mb-10">
          <thead className="bg-gray-100 font-medium">
            <tr className="border-b-2 border-black">
              <th className="p-4 text-left border-r border-black w-12">S.No</th>
              <th className="p-4 text-left border-r border-black">Description / HSN</th>
              <th className="p-4 text-right border-r border-black w-20">Qty</th>
              <th className="p-4 text-right border-r border-black w-28">Rate (₹)</th>
              <th className="p-4 text-right border-r border-black w-32">Taxable Value</th>
              <th className="p-4 text-right border-r border-black w-20">GST %</th>
              <th className="p-4 text-right border-r border-black w-32">GST Amount</th>
              <th className="p-4 text-right w-32">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.rate) || 0;
              const gstRate = parseFloat(item.gst_rate) || 18;
              const taxable = qty * rate;
              const gstAmt = taxable * (gstRate / 100);
              const amount = taxable + gstAmt;

              return (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="p-4 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-4 border-r border-black">
                    {item.item_name || "Item Name"}
                    <br />
                    <span className="text-xs text-gray-500">HSN: {item.hsn || "N/A"}</span>
                  </td>
                  <td className="p-4 text-right border-r border-black">{qty}</td>
                  <td className="p-4 text-right border-r border-black">₹{rate.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right border-r border-black">₹{taxable.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right border-r border-black">{gstRate}%</td>
                  <td className="p-4 text-right border-r border-black">₹{gstAmt.toLocaleString("en-IN")}</td>
                  <td className="p-4 text-right font-semibold">₹{amount.toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-96 border border-black p-6 text-sm">
            <div className="flex justify-between py-2">
              <span>Taxable Amount</span>
              <span>₹{taxableTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>CGST</span>
              <span>₹{(gstTotal / 2).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>SGST</span>
              <span>₹{(gstTotal / 2).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-4 border-t-2 border-black font-bold text-xl mt-3">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-xs text-center mt-6 pt-4 border-t">
              Amount in Words: Rupees Only
            </div>
          </div>
        </div>

        <div className="text-center text-xs mt-16 text-gray-600">
          This is a computer-generated invoice. No signature required.
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <ArrowLeft 
              onClick={() => navigate(-1)} 
              className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition" 
              size={28} 
            />
            <h1 className="text-3xl font-bold">Sales Invoice List</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-cyan-400 text-sm mb-2">Search by Customer</label>
              <input
                placeholder="Type customer name..."
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-gray-800 border border-cyan-700 text-cyan-200 px-5 py-3 rounded-lg outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-cyan-400 text-sm mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-cyan-700 text-cyan-200 px-5 py-3 rounded-lg outline-none focus:border-cyan-400"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
              </select>
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
                setStatusFilter("");
                setFromDate("");
                setToDate("");
              }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-cyan-700 text-cyan-300 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-cyan-800 bg-gray-950">
            <h2 className="text-2xl font-semibold text-cyan-200">Sales Invoices</h2>
            <p className="text-cyan-400 mt-1">{filteredInvoices.length} invoices found</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-950 border-b border-cyan-800">
                  <th className="p-5 text-left text-cyan-400 font-medium">Invoice No</th>
                  <th className="p-5 text-left text-cyan-400 font-medium">Customer</th>
                  <th className="p-5 text-center text-cyan-400 font-medium">Date</th>
                  <th className="p-5 text-right text-cyan-400 font-medium">Grand Total</th>
                  <th className="p-5 text-center text-cyan-400 font-medium">Status</th>
                  <th className="p-5 text-center text-cyan-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-900">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-800/70 transition-colors">
                    <td className="p-5 font-mono text-cyan-100">{inv.invoice_number}</td>
                    <td className="p-5 text-cyan-200">{inv.customer_name}</td>
                    <td className="p-5 text-center text-cyan-300">
                      {dayjs(inv.invoice_date).format("DD-MM-YYYY")}
                    </td>
                    <td className="p-5 text-right font-semibold text-green-400">
                      ₹{(parseFloat(inv.grand_total) || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider
                        ${(inv.status === "issued" || inv.status === "paid")
                          ? "bg-green-900 text-green-400 border border-green-700" 
                          : "bg-yellow-900 text-yellow-400 border border-yellow-700"}`}>
                        {inv.status?.toUpperCase() || "DRAFT"}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex gap-3 justify-center">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => approveInvoice(inv.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                        >
                          <Eye size={16} /> View / Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-20 text-center text-cyan-500">
                      No invoices found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="bg-gray-900 border border-cyan-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-cyan-800 bg-gray-950">
              <h2 className="text-2xl font-semibold text-cyan-200">
                Invoice Preview — {selectedInvoice.invoice_number}
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition"
                >
                  <Printer size={20} /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-cyan-400 hover:text-white p-3 rounded-full hover:bg-gray-800 transition"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-auto p-8 bg-gray-950">
              <InvoicePrintView invoice={selectedInvoice} org={organization} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}