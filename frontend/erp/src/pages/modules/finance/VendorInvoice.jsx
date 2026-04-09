// src/pages/modules/finance/VendorInvoice.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  ArrowLeft,
  FileText,
  Search,
  PlusCircle,
} from 'lucide-react';
import dayjs from 'dayjs';

const VendorInvoice = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [pendingGRNs, setPendingGRNs] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: dayjs().format('YYYY-MM-DD'),
    total_amount: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invoicesRes, pendingRes] = await Promise.allSettled([
        api.get('/inventory/vendor-invoices/'),
        api.get('/inventory/vendor-invoices/pending_for_invoice/'),
      ]);

      if (invoicesRes.status === 'fulfilled') {
        setInvoices(invoicesRes.value.data || []);
      }

      if (pendingRes.status === 'fulfilled') {
        setPendingGRNs(pendingRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openInvoiceModal = (grn) => {
    setSelectedGRN(grn);
    setFormData({
      invoice_number: `INV-${dayjs().format('YYYYMMDD')}-`,
      invoice_date: dayjs().format('YYYY-MM-DD'),
      total_amount: grn.total_value || '',
    });
    setIsModalOpen(true);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedGRN) return;

    setSubmitLoading(true);
    try {
      await api.post(`/inventory/grns/${selectedGRN.id}/create-from-grn/`, {
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        total_amount: parseFloat(formData.total_amount),
      });

      alert('Invoice created successfully!');
      setIsModalOpen(false);
      setSelectedGRN(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredPending = pendingGRNs.filter((grn) =>
    grn.grn_number?.toLowerCase().includes(search.toLowerCase()) ||
    grn.po_number?.toLowerCase().includes(search.toLowerCase()) ||
    grn.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInvoices = invoices.filter((inv) =>
    inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.grn_number?.toLowerCase().includes(search.toLowerCase()) ||
    inv.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sales/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <FileText className="text-cyan-400" size={28} />
              <h1 className="text-3xl font-bold text-cyan-300">Vendor Invoices</h1>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search GRN, Invoice, Vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading vendor invoices...
          </div>
        ) : (
          <>
            {/* Pending GRNs */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-3">
                  Pending GRNs for Invoicing
                  <span className="text-sm bg-blue-900/70 text-blue-300 px-3 py-1 rounded-full border border-blue-700/50">
                    {pendingGRNs.length} Pending
                  </span>
                </h2>
              </div>

              <div className="bg-gray-900/70 rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">GRN Number</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">PO Number</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Vendor</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Received Date</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Total Value</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredPending.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                            No pending GRNs for invoicing.
                          </td>
                        </tr>
                      ) : (
                        filteredPending.map((grn) => (
                          <tr key={grn.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-200">{grn.grn_number}</td>
                            <td className="px-6 py-4 text-gray-300">{grn.po_number || '—'}</td>
                            <td className="px-6 py-4 text-gray-300">{grn.vendor_name}</td>
                            <td className="px-6 py-4 text-gray-300">
                              {dayjs(grn.received_date).format('DD-MM-YYYY')}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-400">
                              ₹{Number(grn.total_value || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => openInvoiceModal(grn)}
                                className="flex items-center gap-2 mx-auto px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-medium transition"
                              >
                                <PlusCircle size={18} />
                                Create Invoice
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

            {/* Generated Invoices */}
            <div>
              <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Generated Invoices</h2>
              <div className="bg-gray-900/70 rounded-2xl overflow-hidden border border-cyan-900/40 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Invoice No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">GRN No</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Vendor</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Invoice Date</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Total Amount</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                            No invoices generated yet.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-200">{inv.invoice_number}</td>
                            <td className="px-6 py-4 text-gray-300">{inv.grn_number || '—'}</td>
                            <td className="px-6 py-4 text-gray-300">{inv.vendor_name}</td>
                            <td className="px-6 py-4 text-gray-300">
                              {dayjs(inv.invoice_date).format('DD-MM-YYYY')}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-400">
                              ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-green-400">
                              ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal (same as before) */}
      {isModalOpen && selectedGRN && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-cyan-900 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-cyan-300">
                Create Invoice - GRN: {selectedGRN.grn_number}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setSelectedGRN(null); }} className="text-gray-400 hover:text-gray-200 text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
              {/* Disabled fields with black background */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">GRN Number</label>
                <input type="text" value={selectedGRN.grn_number} disabled className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">PO Number</label>
                <input type="text" value={selectedGRN.po_number || ''} disabled className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vendor</label>
                <input type="text" value={selectedGRN.vendor_name} disabled className="w-full p-3 bg-gray-950 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed" />
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Invoice Number <span className="text-red-400">*</span></label>
                <input type="text" value={formData.invoice_number} onChange={(e) => setFormData({...formData, invoice_number: e.target.value})} required className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Invoice Date <span className="text-red-400">*</span></label>
                <input type="date" value={formData.invoice_date} onChange={(e) => setFormData({...formData, invoice_date: e.target.value})} required className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Total Invoice Amount (₹) <span className="text-red-400">*</span></label>
                <input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} required className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl focus:border-cyan-500 outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setSelectedGRN(null); }} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-semibold disabled:opacity-50">
                  {submitLoading ? 'Creating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInvoice;