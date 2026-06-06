// src/components/maintenance/MaintenanceList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api'; // Adjust path as needed

const MaintenanceList = ({ onEdit }) => {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // For loading state on delete button

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/transport/vehicle-maintenance/');
      
      let maintenanceData = [];
      if (res.data && Array.isArray(res.data)) {
        maintenanceData = res.data;
      } else if (res.data && Array.isArray(res.data.results)) {
        maintenanceData = res.data.results;
      } else if (res.data && typeof res.data === 'object') {
        console.warn('Unexpected API response format:', res.data);
        maintenanceData = [];
      }
      
      setMaintenances(maintenanceData);
    } catch (err) {
      console.error("Error fetching maintenance records", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch maintenance records');
      setMaintenances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance record?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.delete(`/transport/vehicle-maintenance/${id}/`);
      
      // Remove from local state immediately for better UX
      setMaintenances(prev => prev.filter(item => item.id !== id));
      
      // Optional: Show success message
      alert('Maintenance record deleted successfully.');
    } catch (err) {
      console.error("Error deleting maintenance record", err);
      alert(err.response?.data?.message || 'Failed to delete maintenance record');
      // Refetch if deletion failed to stay in sync
      fetchMaintenances();
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <p className="p-4">Loading maintenance records...</p>;
  
  if (error) return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600">Error: {error}</p>
      <button 
        onClick={fetchMaintenances}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  if (!maintenances.length) return (
    <div className="p-8 text-center text-gray-500">
      No maintenance records found.
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">All Maintenance Records</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Vehicle</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Service Date</th>
              <th className="px-6 py-3 text-left">Next Due</th>
              <th className="px-6 py-3 text-left">Cost</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {maintenances.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{item.vehicle_number || item.vehicle?.number || '-'}</td>
                <td className="px-6 py-4">{item.maintenance_type || '-'}</td>
                <td className="px-6 py-4">{item.service_date || '-'}</td>
                <td className="px-6 py-4">{item.next_service_date || '-'}</td>
                <td className="px-6 py-4">₹{item.cost ? parseFloat(item.cost).toLocaleString() : '0'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                    {item.status ? item.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === item.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceList;