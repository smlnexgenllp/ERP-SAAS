// src/pages/TransportExpensePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import Select from 'react-select';
import { ArrowLeft, List } from "lucide-react";

const TransportExpensePage = () => {
  const navigate = useNavigate();

  // States
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    trip: '',
    expense_type: 'fuel',
    expense_date: '',
    amount: '',
    reference_number: '',
    notes: '',
  });

  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Fetch Expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transport/transport-expenses/');
      setExpenses(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Trips for Dropdown
  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await api.get('/transport/trips/');
      const options = res.data.map(t => ({
        value: t.id,
        label: `${t.trip_number} - ${t.vehicle?.vehicle_number || 'No Vehicle'}`,
      }));
      setTrips(options);
    } catch (err) {
      console.error("Failed to load trips", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Load data on mount
  React.useEffect(() => {
    fetchExpenses();
  }, []);

  // Open form for new expense
  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      trip: '',
      expense_type: 'fuel',
      expense_date: new Date().toISOString().split('T')[0],
      amount: '',
      reference_number: '',
      notes: '',
    });
    setShowForm(true);
    fetchTrips();
  };

  // Open form for editing
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      trip: expense.trip,
      expense_type: expense.expense_type,
      expense_date: expense.expense_date,
      amount: expense.amount,
      reference_number: expense.reference_number || '',
      notes: expense.notes || '',
    });
    setShowForm(true);
    fetchTrips();
  };

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTripChange = (selected) => {
    setFormData(prev => ({ ...prev, trip: selected ? selected.value : '' }));
  };

  // Submit Form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingExpense) {
        await api.put(`/transport/transport-expenses/${editingExpense.id}/`, formData);
      } else {
        await api.post('/transport/transport-expenses/', formData);
      }

      setShowForm(false);
      fetchExpenses(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      setDeletingId(id);
      await api.delete(`/transport/transport-expenses/${id}/`);
      setExpenses(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  // Back Button
  // const handleBack = () => {
  //   navigate('/transport');
  // };

  return (
    <div className="p-6">
      {/* Header */}
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
        <h1 className="text-3xl font-bold text-gray-800">Transport Expenses</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"
        >
          + New Expense
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center">Loading expenses...</p>
        ) : error ? (
          <p className="p-8 text-red-600 text-center">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Trip</th>
                  <th className="px-6 py-3 text-left">Vehicle</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Reference</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.trip_number}</td>
                    <td className="px-6 py-4">{item.vehicle_number || '-'}</td>
                    <td className="px-6 py-4 capitalize font-medium">
                      {item.expense_type_display || item.expense_type}
                    </td>
                    <td className="px-6 py-4">{item.expense_date}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">
                      ₹{parseFloat(item.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{item.reference_number || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-semibold">
                {editingExpense ? 'Edit Expense' : 'New Transport Expense'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip <span className="text-red-500">*</span></label>
                <Select
                  options={trips}
                  value={trips.find(t => t.value === formData.trip)}
                  onChange={handleTripChange}
                  isLoading={loadingTrips}
                  placeholder="Select Trip..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                  <select
                    name="expense_type"
                    value={formData.expense_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="fuel">Fuel</option>
                    <option value="toll">Toll</option>
                    <option value="driver_bata">Driver Bata</option>
                    <option value="loading">Loading</option>
                    <option value="unloading">Unloading</option>
                    <option value="repair">Repair</option>
                    <option value="parking">Parking</option>
                    <option value="penalty">Penalty</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Bill/Receipt Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="Additional remarks..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  {editingExpense ? 'Update Expense' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportExpensePage;