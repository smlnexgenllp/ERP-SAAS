// src/components/modules/finance/vendor/VendorList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiUsers, 
  FiArrowLeft,
  FiRefreshCw 
} from "react-icons/fi";
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
      const res = await api.get('/finance/vendors/');
      setVendors(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to load vendors.'
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
    fetchVendors();
  };

  // Filtered & Paginated
  const filteredVendors = vendors.filter((v) =>
    [v.name, v.vendor_code, v.gst_number]
      .filter(Boolean)
      .some((val) => val.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + itemsPerPage);

  const formatPhone = (vendor) => {
    return [vendor.phone, vendor.mobile].filter(Boolean).join(' / ') || '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <FiArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <FiUsers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Vendors
                </h1>
                <p className="text-zinc-500">Manage your suppliers and vendors</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchVendors}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
            >
              <FiRefreshCw size={18} /> Refresh
            </button>

            <button
              onClick={() => navigate('/vendor-ledger')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition"
            >
              Vendor Ledger
            </button>

            <button
              onClick={() => openFormModal()}
              className="flex items-center gap-3 px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-2xl font-medium transition shadow-sm"
            >
              <FiPlus size={20} /> Add New Vendor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 mb-8">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, vendor code or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Vendor Name</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Code</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">GSTIN</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Contact</th>
                  <th className="px-8 py-5 text-left font-semibold text-zinc-600">Type</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Status</th>
                  <th className="px-8 py-5 text-center font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-zinc-500">
                      {searchTerm ? `No vendors found for "${searchTerm}"` : "No vendors found"}
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-medium text-zinc-900">{vendor.name}</td>
                      <td className="px-8 py-6 font-mono text-zinc-700">{vendor.vendor_code || '—'}</td>
                      <td className="px-8 py-6 font-mono text-zinc-700">{vendor.gst_number || '—'}</td>
                      <td className="px-8 py-6 text-zinc-700">{formatPhone(vendor)}</td>
                      <td className="px-8 py-6 capitalize text-zinc-700">{vendor.vendor_type || 'goods'}</td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${vendor.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                            {vendor.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${vendor.is_approved ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                            {vendor.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => openFormModal(vendor.id)}
                            className="text-zinc-700 hover:text-zinc-900 transition p-3 hover:bg-zinc-100 rounded-xl"
                            title="Edit"
                          >
                            <FiEdit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-zinc-700 hover:text-red-600 transition p-3 hover:bg-zinc-100 rounded-xl"
                            title="Delete"
                          >
                            <FiTrash2 size={20} />
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
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-zinc-100 flex items-center justify-between bg-white">
              <div className="text-sm text-zinc-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <div className="px-6 py-2.5 bg-zinc-100 rounded-2xl font-medium text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 border border-zinc-200 rounded-2xl hover:bg-zinc-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-zinc-900">
                {editVendorId ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <button
                onClick={closeFormModal}
                className="text-3xl text-zinc-400 hover:text-zinc-600 transition"
              >
                ×
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
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