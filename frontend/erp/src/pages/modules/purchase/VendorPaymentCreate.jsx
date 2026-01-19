import React, { useEffect, useState } from "react";
import api from "../../../services/api";

export default function VendorPaymentCreate() {
  const [invoices, setInvoices] = useState([]);
  const [form, setForm] = useState({
    invoice: "",
    amount: "",
    payment_mode: ""
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const res = await api.get("/inventory/vendor-invoices/");
    setInvoices(res.data);
  };

  const selectInvoice = (invoiceId) => {
    const invoice = invoices.find(i => i.id == invoiceId);
    setSelectedInvoice(invoice);
    setForm({
      ...form,
      invoice: invoiceId,
      amount: invoice.total_amount
    });
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const submitPayment = async () => {
    if (!form.invoice) return alert("Please select an invoice");
    if (!form.payment_mode) return alert("Please select payment mode");

    try {
      await api.post("/inventory/vendor-payments/", form);
      alert("Payment completed successfully");

      setForm({
        invoice: "",
        amount: "",
        payment_mode: ""
      });
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to complete payment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <h1 className="text-3xl font-bold mb-6">Vendor Payment</h1>

      {/* Invoice Selection */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Select Invoice</h2>

        <select
          value={selectedInvoice?.id || ""}
          onChange={e => selectInvoice(e.target.value)}
          className="bg-gray-800 px-4 py-2 rounded-lg outline-none w-full mb-4"
        >
          <option>Select Invoice</option>
          {invoices.map(inv => (
            <option key={inv.id} value={inv.id}>
              {inv.invoice_number} | Vendor: {inv.vendor} | Amount: {inv.total_amount}
            </option>
          ))}
        </select>

        {selectedInvoice && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={e => handleChange("amount", e.target.value)}
              className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
            />

            <select
              value={form.payment_mode}
              onChange={e => handleChange("payment_mode", e.target.value)}
              className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
            >
              <option>Select Payment Mode</option>
              <option value="Bank">Bank</option>
              <option value="Cash">Cash</option>
            </select>

            <button
              onClick={submitPayment}
              className="bg-green-600 hover:bg-green-700 rounded-lg px-6 py-2 col-span-full"
            >
              Make Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment Table */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Invoices</h2>
        <table className="w-full text-left">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-2">Invoice Number</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">GRN Number</th>
              <th className="px-4 py-2">PO Number</th>
              <th className="px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  No invoices available
                </td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr
                  key={inv.id}
                  className="border-t border-cyan-800 hover:bg-gray-800/40"
                >
                  <td className="px-4 py-2">{inv.invoice_number}</td>
                  <td className="px-4 py-2">{inv.vendor}</td>
                  <td className="px-4 py-2">{inv.grn.grn_number}</td>
                  <td className="px-4 py-2">{inv.grn.po.po_number}</td>
                  <td className="px-4 py-2">{inv.total_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
