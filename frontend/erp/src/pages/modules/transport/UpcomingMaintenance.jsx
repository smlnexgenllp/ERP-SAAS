// src/components/maintenance/UpcomingMaintenance.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api'; // Adjust path as needed

const UpcomingMaintenance = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUpcomingMaintenance();
  }, []);

  const fetchUpcomingMaintenance = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Make sure this URL matches your router
      const res = await api.get('/transport/vehicle-maintenance/upcoming/');

      // Handle both normal array and DRF paginated response
      let data = res.data;
      if (data.results && Array.isArray(data.results)) {
        data = data.results;           // DRF pagination case
      }

      if (!Array.isArray(data)) {
        data = [];
      }

      setUpcoming(data.slice(0, 5));   // Top 5 upcoming
    } catch (err) {
      console.error("Error fetching upcoming maintenance", err);
      setError("Failed to load upcoming maintenance");
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Upcoming Maintenance</h2>
        <span className="text-sm text-blue-600 font-medium">Next 30 days</span>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8 text-center">Loading upcoming maintenance...</p>
      ) : error ? (
        <p className="text-red-500 py-8 text-center">{error}</p>
      ) : upcoming.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No upcoming maintenance scheduled
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{item.vehicle_number}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.maintenance_type}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mt-3 flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-500">Due: </span>
                  <span className="font-medium text-gray-700">
                    {item.next_service_date || '-'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Cost: </span>
                  <span className="font-semibold">
                    ₹{parseFloat(item.cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* {upcoming.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => (window.location.href = '/maintenance')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Maintenance →
          </button>
        </div>
      )} */}
    </div>
  );
};

export default UpcomingMaintenance;