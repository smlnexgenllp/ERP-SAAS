// src/components/maintenance/UpcomingMaintenance.jsx
import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Calendar, AlertTriangle } from "lucide-react";

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

      const res = await api.get('/transport/vehicle-maintenance/upcoming/');

      let data = res.data;
      if (data.results && Array.isArray(data.results)) {
        data = data.results;
      }
      if (!Array.isArray(data)) data = [];

      setUpcoming(data.slice(0, 5)); // Show top 5
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
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Maintenance</h2>
        </div>
        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          Next 30 days
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-zinc-500">Loading upcoming maintenance...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">{error}</div>
      ) : upcoming.length === 0 ? (
        <div className="py-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-500">No upcoming maintenance scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.vehicle_number || item.vehicle?.vehicle_number || 'Unknown Vehicle'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{item.maintenance_type}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(item.status)}`}
                >
                  {item.status ? item.status.replace('_', ' ').toUpperCase() : 'SCHEDULED'}
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
                  <span className="text-gray-500">Est. Cost: </span>
                  <span className="font-semibold text-emerald-600">
                    ₹{parseFloat(item.cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingMaintenance;