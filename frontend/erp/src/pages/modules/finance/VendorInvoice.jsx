// src/pages/modules/finance/VendorInvoice.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { 
  FiArrowLeft, 
  FiFileText, 
  FiSearch, 
  FiPlus 
} from "react-icons/fi";
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

      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.data || []);
      if (pendingRes.status === 'fulfilled') setPendingGRNs(pendingRes.value.data || []);
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
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            {/* Fixed Back Button - Goes back one step */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiFileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Vendor Invoices
                </h1>
                <p className="text-zinc-500">Manage GRN to Invoice conversion</p>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search GRN, Invoice or Vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
            <p className="ml-4 text-zinc-500">Loading vendor invoices...</p>
          </div>
        ) : (
          <>
            {/* Pending GRNs Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-zinc-900 flex items-center gap-3">
                  Pending GRNs for Invoicing
                  <span className="text-sm bg-blue-100 text-blue-700 px-4 py-1.5 rounded-2xl font-medium">
                    {pendingGRNs.length} Pending
                  </span>
                </h2>
              </div>

              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">GRN Number</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">PO Number</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Received Date</th>
                        <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total Value</th>
                        <th className="px-8 py-5 text-center font-semibold text-zinc-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredPending.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center text-zinc-500">
                            No pending GRNs for invoicing.
                          </td>
                        </tr>
                      ) : (
                        filteredPending.map((grn) => (
                          <tr key={grn.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-8 py-6 font-medium text-zinc-900">{grn.grn_number}</td>
                            <td className="px-8 py-6 text-zinc-700">{grn.po_number || '—'}</td>
                            <td className="px-8 py-6 text-zinc-700">{grn.vendor_name}</td>
                            <td className="px-8 py-6 text-zinc-700">
                              {dayjs(grn.received_date).format('DD-MM-YYYY')}
                            </td>
                            <td className="px-8 py-6 text-right font-semibold text-emerald-600">
                              ₹{Number(grn.total_value || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <button
                                onClick={() => openInvoiceModal(grn)}
                                className="flex items-center gap-2 mx-auto px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl text-sm font-medium transition"
                              >
                                <FiPlus size={18} />
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
              <h2 className="text-2xl font-semibold text-zinc-900 mb-6">Generated Invoices</h2>
              <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Invoice No</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">GRN No</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor</th>
                        <th className="px-8 py-5 text-left font-semibold text-zinc-600">Invoice Date</th>
                        <th className="px-8 py-5 text-right font-semibold text-zinc-600">Total Amount</th>
                        <th className="px-8 py-5 text-right font-semibold text-zinc-600">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-20 text-center text-zinc-500">
                            No invoices generated yet.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-8 py-6 font-medium text-zinc-900">{inv.invoice_number}</td>
                            <td className="px-8 py-6 text-zinc-700">{inv.grn_number || '—'}</td>
                            <td className="px-8 py-6 text-zinc-700">{inv.vendor_name}</td>
                            <td className="px-8 py-6 text-zinc-700">
                              {dayjs(inv.invoice_date).format('DD-MM-YYYY')}
                            </td>
                            <td className="px-8 py-6 text-right font-semibold text-emerald-600">
                              ₹{Number(inv.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-8 py-6 text-right font-semibold text-emerald-600">
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

      {/* Create Invoice Modal */}
      {isModalOpen && selectedGRN && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-zinc-900">
                Create Invoice
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedGRN(null); }}
                className="text-3xl text-zinc-400 hover:text-zinc-600 transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-8 space-y-6">
              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">GRN Number</label>
                <input type="text" value={selectedGRN.grn_number} disabled className="w-full px-5 py-3.5 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-500" />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">PO Number</label>
                <input type="text" value={selectedGRN.po_number || ''} disabled className="w-full px-5 py-3.5 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-500" />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">Vendor Name</label>
                <input type="text" value={selectedGRN.vendor_name} disabled className="w-full px-5 py-3.5 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-500" />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">Invoice Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  required
                  className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">Invoice Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  required
                  className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-700 text-sm font-medium mb-2">Total Invoice Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                  className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedGRN(null); }}
                  className="flex-1 py-3.5 border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-3.5 bg-zinc-900 hover:bg-black text-white rounded-2xl font-medium transition disabled:opacity-70"
                >
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