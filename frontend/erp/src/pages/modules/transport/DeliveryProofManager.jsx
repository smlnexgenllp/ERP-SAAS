// src/pages/DeliveryProofManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { 
  ArrowLeft, Search, RefreshCw, ChevronLeft, ChevronRight, 
  ClipboardList, X 
} from "lucide-react";

const STATUS_CONFIG = {
  delivered: { label: 'DELIVERED', color: 'bg-green-100 text-green-700 border border-green-200' },
  failed: { label: 'FAILED', color: 'bg-red-100 text-red-700 border border-red-200' },
  partial: { label: 'PARTIAL DELIVERED', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  pending: { label: 'PENDING', color: 'bg-gray-100 text-gray-700 border border-gray-200' }
};

const INITIAL_FORM_DATA = {
  trip: '',
  customer_name: '',
  received_by: '',
  received_phone: '',
  delivery_status: 'pending',
  delivery_notes: '',
};

const DeliveryProofManager = () => {
  const navigate = useNavigate();

  const [proofs, setProofs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState({
    proofs: true,
    trips: false,
    submit: false,
    delete: null
  });
  const [showForm, setShowForm] = useState(false);
  const [editingProof, setEditingProof] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [files, setFiles] = useState({ signature: null, photo: null });
  const [previews, setPreviews] = useState({ signature: '', photo: '' });

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchProofs = useCallback(async () => {
    setLoading(prev => ({ ...prev, proofs: true }));
    try {
      const res = await api.get('/transport/delivery-proofs/');
      setProofs(res.data.results || res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load delivery proofs:', err);
      alert('Failed to load delivery proofs');
    } finally {
      setLoading(prev => ({ ...prev, proofs: false }));
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(prev => ({ ...prev, trips: true }));
    try {
      const res = await api.get('/transport/trips/');
      setTrips(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(prev => ({ ...prev, trips: false }));
    }
  }, []);

  useEffect(() => {
    fetchProofs();
    fetchTrips();
  }, [fetchProofs, fetchTrips]);

  useEffect(() => {
    return () => {
      if (previews.signature) URL.revokeObjectURL(previews.signature);
      if (previews.photo) URL.revokeObjectURL(previews.photo);
    };
  }, [previews]);

  const openForm = useCallback((proof = null) => {
    if (proof) {
      setEditingProof(proof);
      setFormData({
        trip: proof.trip.toString(),
        customer_name: proof.customer_name,
        received_by: proof.received_by,
        received_phone: proof.received_phone || '',
        delivery_status: proof.delivery_status,
        delivery_notes: proof.delivery_notes || '',
      });
      setPreviews({
        signature: proof.signature || '',
        photo: proof.photo || ''
      });
    } else {
      setEditingProof(null);
      setFormData(INITIAL_FORM_DATA);
      setPreviews({ signature: '', photo: '' });
    }
    setFiles({ signature: null, photo: null });
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingProof(null);
    setFormData(INITIAL_FORM_DATA);
    setFiles({ signature: null, photo: null });
    if (previews.signature && !editingProof) URL.revokeObjectURL(previews.signature);
    if (previews.photo && !editingProof) URL.revokeObjectURL(previews.photo);
    setPreviews({ signature: '', photo: '' });
  }, [previews, editingProof]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [type]: previewUrl }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });
    if (files.signature) data.append('signature', files.signature);
    if (files.photo) data.append('photo', files.photo);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (editingProof) {
        await api.patch(`/transport/delivery-proofs/${editingProof.id}/`, data, config);
      } else {
        await api.post('/transport/delivery-proofs/', data, config);
      }
      
      closeForm();
      await fetchProofs();
    } catch (err) {
      console.error('Submission Error:', err);
      const errorMsg = err.response?.data 
        ? Object.values(err.response.data).flat().join('\n')
        : err.message;
      alert(`Failed to save delivery proof:\n${errorMsg}`);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery proof?')) return;
    
    setLoading(prev => ({ ...prev, delete: id }));
    const deletedProof = proofs.find(p => p.id === id);
    setProofs(prev => prev.filter(p => p.id !== id));

    try {
      await api.delete(`/transport/delivery-proofs/${id}/`);
    } catch (err) {
      setProofs(prev => [...prev, deletedProof].sort((a, b) => a.id - b.id));
      alert('Failed to delete');
    } finally {
      setLoading(prev => ({ ...prev, delete: null }));
    }
  }, [proofs]);

  const getStatusColor = (status) => {
    return STATUS_CONFIG[status]?.color || STATUS_CONFIG.pending.color;
  };

  // Filter + Pagination
  const filteredProofs = proofs.filter(proof =>
    `${proof.trip_number || ''} ${proof.customer_name || ''} ${proof.received_by || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProofs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProofs = filteredProofs.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Header - Consistent Design */}
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
              <ClipboardList className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Delivery Proofs (POD)</h1>
              <p className="text-zinc-500">Proof of Delivery Management</p>
            </div>
          </div>

          <button
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            + New Delivery Proof
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Delivery Proof Master</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search trip, customer or receiver..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-3 border rounded-2xl w-80"
              />
            </div>
            <button
              onClick={fetchProofs}
              className="border px-4 rounded-2xl hover:bg-zinc-50 transition"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Trip</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Customer</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Received By</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Phone</th>
                <th className="px-6 py-4 text-left font-medium text-zinc-700">Status</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Signature</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Photo</th>
                <th className="px-6 py-4 text-center font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading.proofs ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-500">Loading delivery proofs...</td>
                </tr>
              ) : paginatedProofs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-zinc-500">No delivery proofs found.</td>
                </tr>
              ) : (
                paginatedProofs.map((proof) => (
                  <tr key={proof.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">#{proof.trip_number || proof.trip}</p>
                        <p className="text-xs text-gray-500">{proof.driver_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{proof.customer_name}</td>
                    <td className="px-6 py-4 text-gray-700">{proof.received_by}</td>
                    <td className="px-6 py-4 text-gray-600">{proof.received_phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proof.delivery_status)}`}>
                        {STATUS_CONFIG[proof.delivery_status]?.label || proof.delivery_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {proof.signature ? (
                        <img 
                          src={proof.signature} 
                          alt="Signature" 
                          className="h-12 w-auto mx-auto border rounded-lg cursor-pointer hover:scale-105 transition" 
                          onClick={() => window.open(proof.signature, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {proof.photo ? (
                        <img 
                          src={proof.photo} 
                          alt="POD" 
                          className="h-12 w-auto mx-auto border rounded-lg cursor-pointer hover:scale-105 transition" 
                          onClick={() => window.open(proof.photo, '_blank')}
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => openForm(proof)}
                          className="text-blue-600 hover:text-blue-700 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(proof.id)}
                          disabled={loading.delete === proof.id}
                          className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                        >
                          {loading.delete === proof.id ? 'Deleting...' : 'Delete'}
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
        {filteredProofs.length > 0 && (
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProofs.length)} of {filteredProofs.length} proofs
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
                      currentPage === pageNum ? "bg-blue-600 text-white" : "border hover:bg-white"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingProof ? 'Edit Delivery Proof' : 'New Delivery Proof'}
              </h2>
              <button
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip</label>
                <select
                  name="trip"
                  value={formData.trip}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Trip</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.trip_number} - {trip.driver?.full_name || trip.driver_name || 'No Driver'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input name="customer_name" required value={formData.customer_name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
                  <input name="received_by" required value={formData.received_by} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Phone</label>
                <input name="received_phone" value={formData.received_phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                <select name="delivery_status" value={formData.delivery_status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500">
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                  <option value="partial">Partial Delivered</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
                  {previews.signature && <img src={previews.signature} alt="Signature" className="mt-3 h-28 border rounded-2xl mx-auto object-contain" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="w-full border border-gray-300 rounded-lg px-4 py-3" />
                  {previews.photo && <img src={previews.photo} alt="Photo" className="mt-3 h-28 border rounded-2xl mx-auto object-contain" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes</label>
                <textarea name="delivery_notes" value={formData.delivery_notes} onChange={handleChange} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="Additional notes..." />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={closeForm} className="flex-1 py-3.5 border border-gray-300 rounded-2xl hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={loading.submit} className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-70 transition">
                  {loading.submit ? 'Saving...' : editingProof ? 'Update Proof' : 'Create Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProofManager;