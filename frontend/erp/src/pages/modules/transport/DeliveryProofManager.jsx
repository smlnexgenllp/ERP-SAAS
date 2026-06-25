import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

// Status configuration for better maintainability
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

  // State management
  const [proofs, setProofs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState({
    proofs: true,
    trips: false,
    submit: false,
    delete: null // Store ID being deleted
  });
  const [showForm, setShowForm] = useState(false);
  const [editingProof, setEditingProof] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [files, setFiles] = useState({
    signature: null,
    photo: null
  });
  const [previews, setPreviews] = useState({
    signature: '',
    photo: ''
  });

  // Fetch Delivery Proofs with loading state
  const fetchProofs = useCallback(async () => {
    setLoading(prev => ({ ...prev, proofs: true }));
    try {
      const res = await api.get('/transport/delivery-proofs/');
      setProofs(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load delivery proofs:', err);
      alert('Failed to load delivery proofs');
    } finally {
      setLoading(prev => ({ ...prev, proofs: false }));
    }
  }, []);

  // Fetch Trips with loading state
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

  // Initial data fetch
  useEffect(() => {
    fetchProofs();
    fetchTrips();
  }, [fetchProofs, fetchTrips]);

  // Cleanup preview URLs to prevent memory leaks
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
    // Cleanup previews
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
    
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [type]: previewUrl }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(prev => ({ ...prev, submit: true }));
    
    const data = new FormData();
    
    // Append form data
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });
    
    // Append files
    if (files.signature) data.append('signature', files.signature);
    if (files.photo) data.append('photo', files.photo);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (editingProof) {
        await api.patch(`/transport/delivery-proofs/${editingProof.id}/`, data, config);
        setProofs(prev => prev.map(p => 
          p.id === editingProof.id ? { ...p, ...formData } : p
        ));
      } else {
        const response = await api.post('/transport/delivery-proofs/', data, config);
        setProofs(prev => [response.data, ...prev]);
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
      console.error('Delete error:', err);
    } finally {
      setLoading(prev => ({ ...prev, delete: null }));
    }
  }, [proofs]);

  const getStatusColor = useCallback((status) => {
    return STATUS_CONFIG[status]?.color || STATUS_CONFIG.pending.color;
  }, []);

  const tripOptions = useMemo(() => {
    return trips.map(trip => (
      <option key={trip.id} value={trip.id}>
        {trip.trip_number} - {trip.driver?.full_name || trip.driver_name || 'No Driver'}
      </option>
    ));
  }, [trips]);

  // Loading Spinner Component
  const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
    const sizeClasses = {
      sm: 'w-5 h-5',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600 mx-auto`}></div>
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    );
  };

  // Table Skeleton
  const TableSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="border-b">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/transport')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <span className="text-2xl leading-none">←</span>
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Delivery Proofs (POD)</h1>
        </div>

        <button
          onClick={() => openForm()}
          disabled={loading.submit}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition"
        >
          {loading.submit ? (
            <>
              <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>New Delivery Proof</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {loading.proofs ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Trip</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Received By</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Signature</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700">Photo</th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proofs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No delivery proofs found.
                    </td>
                  </tr>
                ) : (
                  proofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">#{proof.trip_number || proof.trip}</p>
                          <p className="text-xs text-gray-500">{proof.driver_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {proof.customer_name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {proof.received_by}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {proof.received_phone || '-'}
                      </td>
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
                            loading="lazy"
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
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openForm(proof)}
                            disabled={loading.delete === proof.id}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(proof.id)}
                            disabled={loading.delete === proof.id}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg transition flex items-center gap-1"
                          >
                            {loading.delete === proof.id ? (
                              <>
                                <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-red-600"></div>
                                <span>...</span>
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-auto shadow-2xl">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingProof ? 'Edit Delivery Proof' : 'Create New Delivery Proof'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Trip</label>
                  <select
                    name="trip"
                    value={formData.trip}
                    onChange={handleChange}
                    required
                    disabled={loading.trips}
                    className="w-full border border-gray-300 rounded-2xl p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {loading.trips ? 'Loading trips...' : 'Select Trip'}
                    </option>
                    {tripOptions}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Customer Name</label>
                    <input
                      name="customer_name"
                      required
                      value={formData.customer_name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-2xl p-3 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Received By</label>
                    <input
                      name="received_by"
                      required
                      value={formData.received_by}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-2xl p-3 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Received Phone</label>
                  <input
                    name="received_phone"
                    value={formData.received_phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-2xl p-3 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Status</label>
                  <select
                    name="delivery_status"
                    value={formData.delivery_status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-2xl p-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                    <option value="partial">Partial Delivered</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Signature</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'signature')} 
                      className="w-full border border-gray-300 rounded-2xl p-3" 
                    />
                    {previews.signature && (
                      <img 
                        src={previews.signature} 
                        alt="Signature Preview" 
                        className="mt-3 h-28 border rounded-2xl mx-auto object-contain" 
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Photo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'photo')} 
                      className="w-full border border-gray-300 rounded-2xl p-3" 
                    />
                    {previews.photo && (
                      <img 
                        src={previews.photo} 
                        alt="Photo Preview" 
                        className="mt-3 h-28 border rounded-2xl mx-auto object-contain" 
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Notes</label>
                  <textarea
                    name="delivery_notes"
                    value={formData.delivery_notes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-2xl p-3 h-28 resize-y"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={loading.submit}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-semibold transition flex items-center justify-center gap-2"
                  >
                    {loading.submit ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      editingProof ? 'Update Proof' : 'Create Delivery Proof'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={loading.submit}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 py-3.5 rounded-2xl font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryProofManager;