import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { Search, Filter, Users, Eye, Edit } from 'lucide-react';

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
      const res = await api.get('/sale/customers/'); // or /sale/customers/ – use your working endpoint
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
    e.stopPropagation(); // prevent row click
    navigate(`/sale/customers/${customerId}`);
  };

  const handleEdit = (customerId, e) => {
    e.stopPropagation();
    if (window.confirm("Do you want to edit this customer's details?")) {
      navigate(`/sale/customers/${customerId}/edit`);
    }
  };

  const truncate = (text, max = 40) =>
    text && text.length > max ? text.substring(0, max) + '...' : text || '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <Users className="w-9 h-9 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300">Customers</h1>
            <p className="text-sm text-gray-400">Manage all customer records with full details</p>
          </div>
        </div>

        {/* <button
          onClick={() => navigate('/sale/customers/create')}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all"
        >
          <Users size={20} /> Add Customer
        </button> */}
      </header>

      <div className="p-6 md:p-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, PAN, GSTIN, industry, notes..."
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-gray-200 placeholder-gray-500 focus:border-cyan-600 focus:ring-cyan-600"
            />
          </div>

          <div className="relative min-w-[180px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-900/70 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-gray-200 focus:border-cyan-600 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="churned">Churned</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading customers...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No customers found matching your search/filters.
          </div>
        ) : (
          <div className="bg-gray-900/60 backdrop-blur-sm border border-cyan-900/40 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Company</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">PAN</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">GSTIN</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Business Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Industry</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-cyan-300">Credit Limit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-cyan-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/sale/customers/${cust.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-200">
                        {cust.full_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300 break-all">
                        {cust.email || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {cust.phone || cust.alternate_phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {cust.company || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300 uppercase">
                        {cust.pan_number || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300 uppercase">
                        {cust.gstin || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {cust.business_type
                          ? cust.business_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {cust.industry || '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-medium">
                        ₹{Number(cust.credit_limit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            cust.status === 'active'
                              ? 'bg-green-900/60 text-green-300 border border-green-700/50'
                              : cust.status === 'inactive'
                              ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
                              : 'bg-red-900/60 text-red-300 border border-red-700/50'
                          }`}
                        >
                          {cust.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center flex items-center justify-center gap-4">
                        <button
                          onClick={(e) => handleView(cust.id, e)}
                          className="text-cyan-400 hover:text-cyan-300 transition"
                          title="View Full Details"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={(e) => handleEdit(cust.id, e)}
                          className="text-purple-400 hover:text-purple-300 transition"
                          title="Edit Customer Details"
                        >
                          <Edit size={18} />
                        </button>
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
  );
}