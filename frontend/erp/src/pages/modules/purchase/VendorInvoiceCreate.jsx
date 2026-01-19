import React, { useEffect, useState } from "react";
import api from "../../../services/api";

export default function VendorInvoiceCreate() {
  const [grns, setGrns] = useState([]);
  const [form, setForm] = useState({
    grn: "",
    invoice_number: "",
    invoice_date: "",
    total_amount: "",
  });
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedGRNs();
  }, []);

  // Fetch only QC-approved GRNs
  const fetchApprovedGRNs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/grns/");
      // Only include GRNs that have QC approved and assigned vendor
      const approvedGrns = (res.data || []).filter(
        (g) => g.is_quality_approved && g.po?.vendor
      );
      setGrns(approvedGrns);
    } catch (err) {
      console.error("Failed to fetch GRNs:", err);
      setGrns([]);
    } finally {
      setLoading(false);
    }
  };

  // When a GRN is selected, auto-fill details
  const selectGRN = (grnId) => {
    const grn = grns.find((g) => g.id === Number(grnId));
    if (!grn) return;

    setSelectedGRN(grn);

    setForm({
      ...form,
      grn: grnId,
      total_amount: grn.po?.total_amount || 0,
    });
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const submitInvoice = async () => {
    if (!form.grn) return alert("Please select a GRN");

    // Backend validation: ensure GRN has vendor and is QC-approved
    if (!selectedGRN?.po?.vendor) return alert("Selected GRN has no vendor assigned");
    if (!selectedGRN?.is_quality_approved)
      return alert("Selected GRN is not approved for invoicing");

    try {
      await api.post("/inventory/vendor-invoices/", form);
      alert("Invoice created successfully!");

      // Reset form and reload
      setForm({
        grn: "",
        invoice_number: "",
        invoice_date: "",
        total_amount: "",
      });
      setSelectedGRN(null);
      fetchApprovedGRNs();
    } catch (err) {
      console.error("Invoice creation failed:", err.response?.data || err);
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      alert(`Failed to create invoice: ${detail}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <h1 className="text-3xl font-bold mb-6">Vendor Invoice</h1>

      {/* GRN Selection */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Select GRN (QC Approved)</h2>

        <select
          value={selectedGRN?.id || ""}
          onChange={(e) => selectGRN(e.target.value)}
          className="bg-gray-800 px-4 py-2 rounded-lg outline-none w-full mb-4"
        >
          <option value="">-- Select GRN --</option>
          {grns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.grn_number} | PO: {g.po?.po_number || "—"} | Vendor:{" "}
              {g.po?.vendor?.name || "—"}
            </option>
          ))}
        </select>

        {/* GRN Details */}
        {selectedGRN && (
          <div className="mb-4 bg-gray-800/50 border border-cyan-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2 text-cyan-300">GRN Details</h3>
            <p>
              <strong>PO Number:</strong> {selectedGRN.po?.po_number || "—"}
            </p>
            <p>
              <strong>Vendor:</strong> {selectedGRN.po?.vendor?.name || "—"}
            </p>
            <p>
              <strong>Total Amount:</strong> {selectedGRN.po?.total_amount || 0}
            </p>

            {/* Items in GRN */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-cyan-700">
                <thead className="bg-gray-800/70">
                  <tr>
                    <th className="px-4 py-2 border border-cyan-700">Item</th>
                    <th className="px-4 py-2 border border-cyan-700">Received Qty</th>
                    <th className="px-4 py-2 border border-cyan-700">Price</th>
                    <th className="px-4 py-2 border border-cyan-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGRN.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="px-4 py-2 border border-cyan-700">{item.item?.name || item.item_name}</td>
                      <td className="px-4 py-2 border border-cyan-700">{item.received_qty}</td>
                      <td className="px-4 py-2 border border-cyan-700">{item.price}</td>
                      <td className="px-4 py-2 border border-cyan-700">
                        {(item.price || 0) * (item.received_qty || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Form */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Invoice Number"
                value={form.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
              />
              <input
                type="date"
                value={form.invoice_date}
                onChange={(e) => handleChange("invoice_date", e.target.value)}
                className="bg-gray-800 px-4 py-2 rounded-lg outline-none"
              />
              <input
                type="number"
                placeholder="Total Amount"
                value={form.total_amount}
                readOnly
                className="bg-gray-800 px-4 py-2 rounded-lg outline-none cursor-not-allowed"
              />
            </div>

            <button
              onClick={submitInvoice}
              className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-2"
            >
              Save Invoice
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Invoices Pending Payment</h2>
        {loading ? (
          <p>Loading...</p>
        ) : grns.length === 0 ? (
          <p className="text-center text-gray-500">No QC-approved GRNs available</p>
        ) : (
          <table className="w-full text-left border-collapse border border-cyan-700">
            <thead className="bg-gray-800/70">
              <tr>
                <th className="px-4 py-2 border border-cyan-700">Invoice Number</th>
                <th className="px-4 py-2 border border-cyan-700">GRN Number</th>
                <th className="px-4 py-2 border border-cyan-700">PO Number</th>
                <th className="px-4 py-2 border border-cyan-700">Vendor</th>
                <th className="px-4 py-2 border border-cyan-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => (
                <tr key={g.id} className="hover:bg-gray-800/40">
                  <td className="px-4 py-2 border border-cyan-700">--</td>
                  <td className="px-4 py-2 border border-cyan-700">{g.grn_number}</td>
                  <td className="px-4 py-2 border border-cyan-700">{g.po?.po_number || "—"}</td>
                  <td className="px-4 py-2 border border-cyan-700">{g.po?.vendor?.name || "—"}</td>
                  <td className="px-4 py-2 border border-cyan-700">{g.po?.total_amount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
