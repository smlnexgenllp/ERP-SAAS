// src/components/modules/finance/vendor/VendorList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../../../services/api';
import VendorForm from './VendorForm';

const VendorList = ({ onEdit, onVendorDeleted }) => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editVendorId, setEditVendorId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || '';
      const res = await api.get('/finance/vendors/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(res.data || []);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to load vendors. Please check server logs.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor permanently?')) return;
    try {
      await api.delete(`/finance/vendors/${id}/`);
      setVendors(prev => prev.filter(v => v.id !== id));
      if (onVendorDeleted) onVendorDeleted();
    } catch (err) {
      console.error(err);
      alert('Failed to delete vendor.');
    }
  };

  // Open form for create or edit
  const openFormModal = (vendorId = null) => {
    setEditVendorId(vendorId);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditVendorId(null);
  };

  const handleFormSuccess = () => {
    closeFormModal();
    fetchVendors(); // refresh list
  };

  // Filtered vendors
  const filteredVendors = vendors.filter((v) =>
    [v.name, v.vendor_code, v.gst_number]
      .filter(Boolean)
      .some((val) => val.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyan-300 font-mono">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-800 rounded-xl transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Building className="text-cyan-400" size={28} />
            <h1 className="text-3xl font-bold text-pink-400">Vendors Management</h1>
          </div>
        </div>

        {/* Add Vendor Button */}
        <div className="flex justify-end mb-6 gap-4">
          <button
            onClick={() => openFormModal()}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-lg shadow-cyan-900/30"
          >
            <Plus size={18} /> Add New Vendor
          </button>
          <button
            onClick={() => navigate('/vendor-ledger')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-lg shadow-cyan-900/30"
          >
            vendor ledger
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, vendor code or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 py-3 focus:border-cyan-500 outline-none text-gray-100"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/60 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Table or Empty State */}
        {filteredVendors.length === 0 ? (
          <div className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow text-center py-16">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-12 h-12 text-cyan-500" />
            </div>
            <h3 className="text-2xl font-bold text-pink-400 mb-3">No Vendors Found</h3>
            <p className="text-cyan-300 max-w-md mx-auto">
              {searchTerm
                ? `No results matching "${searchTerm}"`
                : "You haven't added any vendors yet. Start by creating your first supplier."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => openFormModal()}
                className="mt-6 inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-medium transition"
              >
                <Plus size={18} /> Add First Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="bg-gray-900/40 border border-cyan-800 rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-900/60 border-b border-cyan-800">
                  <tr>
                    {["Name", "Code", "GSTIN", "Contact", "Type", "Status", "Actions"].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-cyan-400 uppercase"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-900/60 transition-colors">
                      <td className="px-6 py-5 font-medium text-pink-300">{vendor.name}</td>
                      <td className="px-6 py-5 text-gray-300 font-mono">{vendor.vendor_code || '—'}</td>
                      <td className="px-6 py-5 font-mono">{vendor.gst_number || '—'}</td>
                      <td className="px-6 py-5">
                        {[vendor.phone, vendor.mobile].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-6 py-5 capitalize text-cyan-200">{vendor.vendor_type || 'goods'}</td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              vendor.is_active
                                ? 'bg-green-900/60 text-green-300 border border-green-700/40'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}
                          >
                            {vendor.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              vendor.is_approved
                                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/40'
                                : 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/30'
                            }`}
                          >
                            {vendor.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => openFormModal(vendor.id)}
                            className="text-cyan-400 hover:text-pink-400 transition flex items-center gap-1"
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-400 hover:text-red-300 transition flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVendors.length)} 
                  of {filteredVendors.length} vendors
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>

                  <div className="px-5 py-2 bg-gray-800 rounded-xl text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-xl transition"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vendor Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-cyan-800 rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-gray-900/80 px-6 py-4 border-b border-cyan-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-pink-400">
                {editVendorId ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button
                onClick={closeFormModal}
                className="text-cyan-300 hover:text-red-400 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <VendorForm
                vendorId={editVendorId}
                onSuccess={handleFormSuccess}
                onCancel={closeFormModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;