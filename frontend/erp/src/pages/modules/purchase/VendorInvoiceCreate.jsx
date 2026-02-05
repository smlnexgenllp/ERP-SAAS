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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGRNsReadyForInvoice();
  }, []);

  const fetchGRNsReadyForInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory/grns/pending_for_invoice/");
      setGrns(res.data || []);
    } catch (err) {
      console.error("Failed to load GRNs ready for invoicing:", err);
      alert("Could not load GRNs. Please try again.");
      setGrns([]);
    } finally {
      setLoading(false);
    }
  };

  const selectGRN = (grnId) => {
    const grn = grns.find((g) => g.id === Number(grnId));
    if (!grn) return;

    setSelectedGRN(grn);
    setForm((prev) => ({
      ...prev,
      grn: grnId,
      total_amount: grn.total_value || grn.po?.total_amount || "0",
    }));
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitInvoice = async () => {
    if (!form.grn) return alert("Please select a GRN");
    if (!form.invoice_number.trim()) return alert("Invoice number is required");
    if (!form.invoice_date) return alert("Invoice date is required");
    if (!form.total_amount || Number(form.total_amount) <= 0)
      return alert("Total amount must be greater than zero");

    setSubmitting(true);

    try {
      await api.post("/inventory/vendor-invoices/", {
        grn: form.grn,
        invoice_number: form.invoice_number.trim(),
        invoice_date: form.invoice_date,
        total_amount: form.total_amount,
      });

      alert("Vendor invoice created successfully!");
      // Reset form
      setForm({
        grn: "",
        invoice_number: "",
        invoice_date: "",
        total_amount: "",
      });
      setSelectedGRN(null);
      fetchGRNsReadyForInvoice(); // refresh list
    } catch (err) {
      console.error("Invoice creation failed:", err);
      const errorDetail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.grn?.[0] ||
        "Unknown error";
      alert(`Failed to create invoice: ${errorDetail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <h1 className="text-3xl font-bold mb-6">Create Vendor Invoice</h1>

      {/* GRN Selection + Form */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Select GRN Pending Invoice</h2>

        {loading ? (
          <p className="text-cyan-400">Loading GRNs ready for invoicing...</p>
        ) : grns.length === 0 ? (
          <p className="text-yellow-400">No GRNs pending for invoice at this time.</p>
        ) : (
          <>
            <select
              value={selectedGRN?.id || ""}
              onChange={(e) => selectGRN(e.target.value)}
              className="bg-gray-800 text-cyan-200 px-4 py-3 rounded-lg outline-none w-full mb-6 border border-cyan-700"
            >
              <option value="">-- Select GRN to Invoice --</option>
              {grns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.grn_number} • PO: {g.po?.po_number || "—"} • Vendor: {g.po?.vendor?.name || "—"} • ₹
                  {Number(g.total_value || g.po?.total_amount || 0).toLocaleString()}
                </option>
              ))}
            </select>

            {selectedGRN && (
              <div className="bg-gray-800/60 border border-cyan-700 rounded-xl p-5 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-cyan-200">Selected GRN Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div>
                    <p className="text-cyan-500 text-sm">GRN Number</p>
                    <p className="font-medium">{selectedGRN.grn_number}</p>
                  </div>
                  <div>
                    <p className="text-cyan-500 text-sm">PO Number</p>
                    <p className="font-medium">{selectedGRN.po?.po_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-cyan-500 text-sm">Vendor</p>
                    <p className="font-medium">{selectedGRN.po?.vendor?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-cyan-500 text-sm">Total Value</p>
                    <p className="font-medium text-green-400">
                      ₹ {(Number(selectedGRN.total_value || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Invoice Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-cyan-400 text-sm mb-1">Invoice Number *</label>
                    <input
                      type="text"
                      placeholder="INV-2025-001"
                      value={form.invoice_number}
                      onChange={(e) => handleChange("invoice_number", e.target.value)}
                      className="w-full bg-gray-800 border border-cyan-700 rounded px-3 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 text-sm mb-1">Invoice Date *</label>
                    <input
                      type="date"
                      value={form.invoice_date}
                      onChange={(e) => handleChange("invoice_date", e.target.value)}
                      className="w-full bg-gray-800 border border-cyan-700 rounded px-3 py-2 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-400 text-sm mb-1">Total Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.total_amount}
                      onChange={(e) => handleChange("total_amount", e.target.value)}
                      className="w-full bg-gray-800 border border-cyan-700 rounded px-3 py-2 outline-none focus:border-cyan-400"
                      placeholder="Enter invoice total"
                    />
                  </div>
                </div>

                <button
                  onClick={submitInvoice}
                  disabled={submitting}
                  className={`mt-6 px-8 py-3 rounded-lg font-medium transition
                    ${submitting 
                      ? "bg-gray-700 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {submitting ? "Creating Invoice..." : "Create Invoice"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Optional: List of recently created invoices or pending ones */}
      {/* You can add another section here fetching /inventory/vendor-invoices/ */}
    </div>
  );
}