// src/pages/TransportInvoicePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import Select from 'react-select';
import { 
  ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight, 
  List, FileText 
} from "lucide-react";

const TransportInvoicePage = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    trip: '',
    customer: '',
    invoice_date: '',
    due_date: '',
    taxable_amount: '',
    gst_percentage: '18',
    amount_paid: '',
    notes: '',
  });

  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transport/transport-invoices/');
      setInvoices(Array.isArray(res.data) ? res.data : res.data.results || []);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const res = await api.get('/transport/trips/');
      const tripOptions = res.data.map(t => ({
        value: t.id,
        label: `${t.trip_number} - ${t.vehicle?.vehicle_number || 'No Vehicle'}`,
        customer: t.customer,
        customer_name: t.customer_name || t.customer?.full_name || 'N/A',
      }));
      setTrips(tripOptions);
    } catch (err) {
      console.error("Failed to load trips", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/sale/customers/');
      const customerList = Array.isArray(res.data) ? res.data : res.data.results || [];
      setCustomers(customerList.map(c => ({
        value: c.id,
        label: c.full_name || c.company || c.email || `Customer ${c.id}`,
      })));
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddNew = () => {
    setEditingInvoice(null);
    setFormData({
      trip: '',
      customer: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      taxable_amount: '',
      gst_percentage: '18',
      amount_paid: '0',
      notes: '',
    });
    setShowForm(true);
    fetchTrips();
    fetchCustomers();
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      trip: invoice.trip,
      customer: invoice.customer,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date || '',
      taxable_amount: invoice.taxable_amount || '',
      gst_percentage: invoice.gst_percentage || '18',
      amount_paid: invoice.amount_paid || '0',
      notes: invoice.notes || '',
    });
    setShowForm(true);
    fetchTrips();
    fetchCustomers();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTripChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      trip: selected?.value || '',
      customer: selected?.customer || prev.customer,
    }));
  };

  const handleCustomerChange = (selected) => {
    setFormData(prev => ({ ...prev, customer: selected?.value || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingInvoice) {
        await api.put(`/transport/transport-invoices/${editingInvoice.id}/`, formData);
      } else {
        await api.post('/transport/transport-invoices/', formData);
      }
      setShowForm(false);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      setDeletingId(id);
      await api.delete(`/transport/transport-invoices/${id}/`);
      setInvoices(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert('Failed to delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  // Filter + Pagination
  const filteredInvoices = invoices.filter(inv =>
    `${inv.invoice_number || ''} ${inv.trip_number || ''} ${inv.customer_name || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header - Exact Match */}
      <div className="bg-white rounded-3xl p-6 border shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/transport")}
              className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
            >
              <ArrowLeft size={24} className="text-zinc-600" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
              <FileText className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Transport Invoices</h1>
              <p className="text-zinc-500">Manage customer billing & payments</p>
            </div>
          </div>

          <button 
            onClick={handleAddNew} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Invoice Master</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search invoice, trip or customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
              />
            </div>
            <button 
              onClick={fetchInvoices} 
              className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Invoice No</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Trip</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Customer</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Invoice Date</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Grand Total</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Paid</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Status</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-500">Loading invoices...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-red-600">{error}</td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-500">No invoices found.</td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{inv.invoice_number}</td>
                    <td className="px-6 py-4">{inv.trip_number}</td>
                    <td className="px-6 py-4">{inv.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4">{inv.invoice_date}</td>
                    <td className="px-6 py-4 font-semibold">₹{Number(inv.grand_total || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">₹{Number(inv.amount_paid || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(inv.payment_status)}`}>
                        {inv.payment_status_display || inv.payment_status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleEdit(inv)} 
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)} 
                          disabled={deletingId === inv.id}
                          className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          {deletingId === inv.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} invoices
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 border rounded-2xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => goToPage(pageNum)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "border hover:bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 border rounded-2xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Improved Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header with X */}
            <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip <span className="text-red-500">*</span></label>
                  <Select 
                    options={trips} 
                    value={trips.find(t => t.value === formData.trip)} 
                    onChange={handleTripChange} 
                    placeholder="Select Trip..." 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer <span className="text-red-500">*</span></label>
                  <Select 
                    options={customers} 
                    value={customers.find(c => c.value === formData.customer)} 
                    onChange={handleCustomerChange} 
                    placeholder="Select Customer..." 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxable Amount (₹)</label>
                  <input type="number" name="taxable_amount" value={formData.taxable_amount} onChange={handleChange} step="0.01" required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                  <input type="number" name="gst_percentage" value={formData.gst_percentage} onChange={handleChange} step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                  <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleChange} step="0.01" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 transition">
                  {isSubmitting && <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportInvoicePage;