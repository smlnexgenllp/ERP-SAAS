// src/pages/VehicleMaintenancePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Added this
import MaintenanceList from '../MaintenanceList';
import MaintenanceFormModal from '../MaintenanceFormModal';
import UpcomingMaintenance from '../UpcomingMaintenance';
import { ArrowLeft, List } from "lucide-react";

const VehicleMaintenancePage = () => {
  const navigate = useNavigate(); // ← Added

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingRecord(null);
    setRefreshKey(prev => prev + 1); // Refresh list
  };

  

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
         <button
                      onClick={() => navigate("/transport")}
                      className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
                    >
                      <ArrowLeft size={20} />
                      <span className="font-medium">Back</span>
                    </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Maintenance</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          + New Maintenance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Upcoming Maintenance Widget */}
        <div className="lg:col-span-1">
          <UpcomingMaintenance />
        </div>

        {/* Maintenance List */}
        <div className="lg:col-span-3">
          <MaintenanceList 
            key={refreshKey} 
            onEdit={handleEdit} 
          />
        </div>
      </div>

      {/* Form Modal */}
      <MaintenanceFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRecord(null);
        }}
        onSuccess={handleSuccess}
        initialData={editingRecord}
      />
    </div>
  );
};

export default VehicleMaintenancePage;