// src/pages/TransportInvoicePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import Select from 'react-select';
import { ArrowLeft, List } from "lucide-react";

const TransportInvoicePage = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        customer: t.customer,                    // Customer ID
        customer_name: t.customer_name || t.customer?.full_name || 'N/A',
      }));
      setTrips(tripOptions);
    } catch (err) {
      console.error("Failed to load trips", err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/sale/customers/');   // ← Correct Endpoint
      const customerList = Array.isArray(res.data) ? res.data : res.data.results || [];
      
      setCustomers(customerList.map(c => ({
        value: c.id,
        label: c.full_name || c.company || c.email || `Customer ${c.id}`,
      })));
    } catch (err) {
      console.error("Failed to load customers:", err);
      alert("Could not load customers. Please check if /crm/customers/ endpoint exists.");
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
      customer: selected?.customer || prev.customer,   // Auto-fill customer from trip
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

  // const handleBack = () => navigate('/transport');

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
              onClick={() => navigate("/transport")}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transport Invoices</h1>
        <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium">
          + New Invoice
        </button>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center">Loading invoices...</p>
        ) : error ? (
          <p className="p-8 text-red-600 text-center">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Invoice No</th>
                  <th className="px-6 py-3 text-left">Trip</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Invoice Date</th>
                  <th className="px-6 py-3 text-left">Grand Total</th>
                  <th className="px-6 py-3 text-left">Paid</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{inv.invoice_number}</td>
                    <td className="px-6 py-4">{inv.trip_number}</td>
                    <td className="px-6 py-4">{inv.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4">{inv.invoice_date}</td>
                    <td className="px-6 py-4 font-semibold">₹{Number(inv.grand_total).toLocaleString()}</td>
                    <td className="px-6 py-4">₹{Number(inv.amount_paid).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(inv.payment_status)}`}>
                        {inv.payment_status_display || inv.payment_status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleEdit(inv)} className="text-blue-600 hover:text-blue-800 mr-4">Edit</button>
                      <button onClick={() => handleDelete(inv.id)} disabled={deletingId === inv.id}
                        className="text-red-600 hover:text-red-800">
                        {deletingId === inv.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-semibold">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trip <span className="text-red-500">*</span></label>
                  <Select 
                    options={trips} 
                    value={trips.find(t => t.value === formData.trip)} 
                    onChange={handleTripChange} 
                    placeholder="Select Trip..." 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Customer <span className="text-red-500">*</span></label>
                  <Select 
                    options={customers} 
                    value={customers.find(c => c.value === formData.customer)} 
                    onChange={handleCustomerChange} 
                    placeholder="Select Customer..." 
                    required 
                  />
                </div>
              </div>

              {/* Rest of form remains same */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Invoice Date</label>
                  <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Taxable Amount (₹)</label>
                  <input type="number" name="taxable_amount" value={formData.taxable_amount} onChange={handleChange} step="0.01" required className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST %</label>
                  <input type="number" name="gst_percentage" value={formData.gst_percentage} onChange={handleChange} step="0.01" className="w-full border rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Paid (₹)</label>
                  <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleChange} step="0.01" className="w-full border rounded-lg px-4 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4} className="w-full border rounded-lg px-4 py-2" />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
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