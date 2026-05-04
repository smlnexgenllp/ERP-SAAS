// src/pages/sales/CustomersList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import {
  Users,
  Search,
  Eye,
  Edit,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export default function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sale/customers/');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      cust.full_name?.toLowerCase().includes(searchLower) ||
      cust.email?.toLowerCase().includes(searchLower) ||
      cust.phone?.toLowerCase().includes(searchLower) ||
      cust.company?.toLowerCase().includes(searchLower) ||
      cust.pan_number?.toLowerCase().includes(searchLower) ||
      cust.gstin?.toLowerCase().includes(searchLower) ||
      cust.industry?.toLowerCase().includes(searchLower) ||
      cust.business_type?.toLowerCase().includes(searchLower) ||
      cust.notes?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter ? cust.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const handleView = (customerId, e) => {
    e.stopPropagation();
    navigate(`/sale/customers/${customerId}`);
  };

  const handleEdit = (customerId, e) => {
    e.stopPropagation();
    if (window.confirm("Do you want to edit this customer's details?")) {
      navigate(`/sale/customers/${customerId}/edit`);
    }
  };

  const truncate = (text, max = 35) =>
    text && text.length > max ? text.substring(0, max) + '...' : text || '—';

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      {/* Main Content */}
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-10">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-zinc-900">All Customers</h1>
                  <p className="text-zinc-500">Manage and track your customer records</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, company, PAN, GSTIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-end mb-6">
            <div className="relative min-w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-3.5 text-zinc-900 focus:outline-none focus:border-zinc-400 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="churned">Churned</option>
              </select>
            </div>
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin"></div>
                <p className="text-zinc-600 mt-6 text-lg font-medium">Loading customers...</p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-20 text-center">
              <AlertCircle className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
              <p className="text-xl text-zinc-600">No customers found</p>
              <p className="text-zinc-500 mt-2">Try adjusting your search or filter</p>
            </div>
          ) : (
            /* Table Card */
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Name</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Email</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Phone</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Company</th>
                      <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Status</th>
                      <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredCustomers.map((cust) => (
                      <tr 
                        key={cust.id} 
                        className="hover:bg-zinc-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/sale/customers/${cust.id}`)}
                      >
                        <td className="px-8 py-6 font-medium text-zinc-900">
                          {cust.full_name || '—'}
                        </td>
                        <td className="px-8 py-6 text-zinc-700 break-all">
                          {cust.email || '—'}
                        </td>
                        <td className="px-8 py-6 text-zinc-700 whitespace-nowrap">
                          {cust.phone || cust.alternate_phone || '—'}
                        </td>
                        <td className="px-8 py-6 text-zinc-700">
                          {truncate(cust.company)}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-block px-4 py-1.5 rounded-2xl text-xs font-medium ${
                            cust.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            cust.status === 'inactive' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {cust.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-6">
                            <button
                              onClick={(e) => handleView(cust.id, e)}
                              className="text-zinc-600 hover:text-zinc-900 transition"
                              title="View Details"
                            >
                              <Eye size={20} />
                            </button>
                            <button
                              onClick={(e) => handleEdit(cust.id, e)}
                              className="text-zinc-600 hover:text-zinc-900 transition"
                              title="Edit Customer"
                            >
                              <Edit size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}