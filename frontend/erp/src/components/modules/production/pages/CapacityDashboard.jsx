// src/pages/production/CapacityDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Factory, AlertTriangle, CheckCircle, XCircle, 
  Calendar, Clock, Download 
} from 'lucide-react';
import api from '../../../../services/api';

export default function CapacityDashboard() {
  const [machineLoad, setMachineLoad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchMachineLoad();
  }, [dateRange]);

  const fetchMachineLoad = async () => {
    setLoading(true);
    try {
      const response = await api.get('/production/machine-load/', {
        params: dateRange
      });
      setMachineLoad(response.data);
    } catch (err) {
      console.error('Failed to fetch machine load:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'operational':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'maintenance':
        return <AlertTriangle className="text-yellow-400" size={20} />;
      case 'breakdown':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Factory className="text-gray-400" size={20} />;
    }
  };

  const getUtilizationColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getUtilizationWarning = (percentage) => {
    if (percentage >= 100) return 'text-red-400 font-bold';
    if (percentage >= 80) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6 flex items-center justify-center">
        <div className="text-cyan-400">Loading capacity data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Machine Capacity Dashboard</h1>
            <p className="text-gray-400 mt-2">Monitor machine load and utilization</p>
          </div>
          
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
            />
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/70 p-6 rounded-2xl border border-cyan-900/40">
            <p className="text-sm text-cyan-400">Total Machines</p>
            <p className="text-3xl font-bold">{machineLoad.length}</p>
          </div>
          
          <div className="bg-gray-900/70 p-6 rounded-2xl border border-green-900/40">
            <p className="text-sm text-green-400">Operational</p>
            <p className="text-3xl font-bold">
              {machineLoad.filter(m => m.maintenance_status === 'operational').length}
            </p>
          </div>
          
          <div className="bg-gray-900/70 p-6 rounded-2xl border border-yellow-900/40">
            <p className="text-sm text-yellow-400">Overloaded (&gt;100%)</p>
            <p className="text-3xl font-bold">
              {machineLoad.filter(m => m.utilization_percentage > 100).length}
            </p>
          </div>
          
          <div className="bg-gray-900/70 p-6 rounded-2xl border border-purple-900/40">
            <p className="text-sm text-purple-400">Total Load</p>
            <p className="text-3xl font-bold">
              {machineLoad.reduce((sum, m) => sum + (m.total_load || 0), 0).toFixed(0)} hrs
            </p>
          </div>
        </div>

        {/* Machine Load Table */}
        <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-cyan-300">Machine Load Analysis</h2>
            <p className="text-sm text-gray-400 mt-1">
              Period: {new Date(dateRange.start_date).toLocaleDateString()} - {new Date(dateRange.end_date).toLocaleDateString()}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Machine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Capacity/Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total Load</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Remaining Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Utilization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {machineLoad.map((machine) => (
                  <tr key={machine.machine_id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{machine.machine_name}</div>
                      <div className="text-xs text-gray-500">{machine.machine_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize">{machine.work_center_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(machine.maintenance_status)}
                        <span className="capitalize">{machine.maintenance_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">{machine.capacity_per_day} hrs</td>
                    <td className="px-6 py-4 font-mono">
                      <span className={machine.utilization_percentage > 100 ? 'text-red-400 font-bold' : ''}>
                        {machine.total_load?.toFixed(1)} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <span className={machine.remaining_capacity < 0 ? 'text-red-400' : 'text-green-400'}>
                        {machine.remaining_capacity?.toFixed(1)} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`${getUtilizationColor(machine.utilization_percentage)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(machine.utilization_percentage, 100)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-mono ${getUtilizationWarning(machine.utilization_percentage)}`}>
                          {machine.utilization_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          console.log('View details for machine:', machine.machine_id);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {machineLoad.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No machines found for the selected date range
              </div>
            )}
          </div>
        </div>

        {/* Load Details Section */}
        {machineLoad.some(m => m.load_details && m.load_details.length > 0) && (
          <div className="mt-8 bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-cyan-300">Load Breakdown by Machine</h2>
              <p className="text-gray-400 text-sm mt-1">Planned orders contributing to machine load</p>
            </div>
            <div className="divide-y divide-gray-800">
              {machineLoad.map((machine) => (
                machine.load_details && machine.load_details.length > 0 && (
                  <div key={`details-${machine.machine_id}`} className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-cyan-400">
                        {machine.machine_name}
                        <span className="text-sm text-gray-400 ml-2">
                          ({machine.machine_code})
                        </span>
                      </h3>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${getUtilizationWarning(machine.utilization_percentage)}`}>
                          {machine.utilization_percentage}% Utilization
                        </div>
                        <div className="text-xs text-gray-400">
                          {machine.total_load.toFixed(1)} / {machine.effective_capacity?.toFixed(1)} hrs
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {machine.load_details.map((detail, idx) => (
                        <div key={detail.planned_order_id || idx} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800/70 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-cyan-300">{detail.product}</span>
                                <span className="text-xs px-2 py-1 bg-gray-700 rounded-full capitalize">
                                  {detail.scheduling_type}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-400">Operation:</span>
                                  <span className="ml-2">{detail.operation}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Quantity:</span>
                                  <span className="ml-2">{detail.quantity} units</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Load Hours:</span>
                                  <span className="ml-2 font-mono font-bold">{detail.load_hours} hrs</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Schedule:</span>
                                  <span className="ml-2 text-xs">
                                    {new Date(detail.start_date).toLocaleDateString()} - {new Date(detail.finish_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}