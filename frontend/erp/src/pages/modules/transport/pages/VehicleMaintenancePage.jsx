// src/pages/VehicleMaintenancePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceList from '../MaintenanceList';
import MaintenanceFormModal from '../MaintenanceFormModal';
import UpcomingMaintenance from '../UpcomingMaintenance';
import { ArrowLeft, Wrench } from "lucide-react";

const VehicleMaintenancePage = () => {
  const navigate = useNavigate();

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
    <div className="flex-1 p-8 bg-zinc-100 min-h-screen">
      {/* Consistent Header */}
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
              <Wrench className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Vehicle Maintenance</h1>
              <p className="text-zinc-500">Track and manage vehicle service records</p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-medium"
          >
            + New Maintenance
          </button>
        </div>
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