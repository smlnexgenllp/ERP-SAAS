import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../services/api';
import { Search, Filter, Users, Eye, Edit, ArrowLeft } from 'lucide-react';

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

  const handleGoBack = () => {
    navigate(-1);
  };

  const truncate = (text, max = 35) =>
    text && text.length > max ? text.substring(0, max) + '...' : text || '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900/90 backdrop-blur-lg border-b border-cyan-900/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-4">
            <Users className="w-9 h-9 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-cyan-300">Customers</h1>
              <p className="text-sm text-gray-400">Manage all customer records</p>
            </div>
          </div>
        </div>
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
              placeholder="Search by name, email, phone, or company..."
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
                    <th className="px-6 py-5 text-left text-sm font-semibold text-cyan-300 w-52">Name</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-cyan-300 w-72">Email</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-cyan-300 w-44">Phone</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-cyan-300 w-56">Company</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-cyan-300 w-32">Status</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold text-cyan-300 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/sale/customers/${cust.id}`)}
                    >
                      <td className="px-6 py-5 font-medium text-gray-200">
                        {cust.full_name || '—'}
                      </td>
                      <td className="px-6 py-5 text-gray-300 break-all">
                        {cust.email || '—'}
                      </td>
                      <td className="px-6 py-5 text-gray-300 whitespace-nowrap">
                        {cust.phone || cust.alternate_phone || '—'}
                      </td>
                      <td className="px-6 py-5 text-gray-300">
                        {truncate(cust.company)}
                      </td>
                      <td className="px-6 py-5">
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
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-6">
                          <button
                            onClick={(e) => handleView(cust.id, e)}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={(e) => handleEdit(cust.id, e)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
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
  );
}