// src/pages/TransportExpensePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import Select from 'react-select';
import { 
  ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight, 
  List 
} from "lucide-react";

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

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      setCurrentPage(1);
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
      fetchExpenses();
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

  // Filter + Pagination
  const filteredExpenses = expenses.filter(exp =>
    `${exp.trip_number || ''} ${exp.vehicle_number || ''} ${exp.expense_type || ''} ${exp.reference_number || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header - Perfect Match */}
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
              <List className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Transport Expenses</h1>
              <p className="text-zinc-500">Manage all transport related expenses</p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            + New Expense
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {/* Table Header with Search */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Expense Master</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search trip, type or reference..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
              />
            </div>
            <button
              onClick={fetchExpenses}
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
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Trip</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Vehicle</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Type</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Date</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Amount</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Reference</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-zinc-500">Loading expenses...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-red-600">{error}</td>
                </tr>
              ) : paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-zinc-500">No expenses found.</td>
                </tr>
              ) : (
                paginatedExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
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
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
        {filteredExpenses.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} of{" "}
              {filteredExpenses.length} expenses
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

      {/* Form Modal - Already Updated */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header with Close Button */}
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingExpense ? 'Edit Expense' : 'New Transport Expense'}
              </h2>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6h12v12" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip <span className="text-red-500">*</span>
                </label>
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional remarks..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 transition"
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