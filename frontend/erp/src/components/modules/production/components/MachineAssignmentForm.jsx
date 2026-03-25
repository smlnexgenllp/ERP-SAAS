// src/pages/production/MachineAssignmentForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Factory,
  Settings,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Package,
  Clock,
  Wrench,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ChevronRight,
  Check,
  User,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import api from '../../../../services/api';

const MachineAssignmentForm = () => {
  // State for wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({ 1: false, 2: false, 3: false });
  
  // Data states
  const [draftOrders, setDraftOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedMachineDetails, setSelectedMachineDetails] = useState(null);
  const [workOrderResult, setWorkOrderResult] = useState(null);

  const fetchData = async () => {
    try {
      const [ordersRes, machinesRes] = await Promise.all([
        api.get('/production/draft-orders/'),
        api.get('/production/machines-list/')
      ]);
      setDraftOrders(ordersRes.data);
      setMachines(machinesRes.data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load data. Please check API connection.');
      setSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrderId || !selectedMachineId) {
      setMessage('Please select both Manufacturing Order and Machine');
      setSuccess(false);
      return;
    }

    setAssignLoading(true);
    setMessage('');
    setSuccess(false);

    try {
      const response = await api.post('/production/assign-machines/', {
        manufacturing_order_id: parseInt(selectedOrderId),
        machine_id: parseInt(selectedMachineId)
      });

      setSuccess(true);
      setMessage(response.data.message || 'Work Order created successfully!');
      setWorkOrderResult(response.data);
      
      // Mark step 3 as completed
      setCompletedSteps(prev => ({ ...prev, 3: true }));
      
    } catch (error) {
      setSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to create Work Order. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Update order details when selected order changes
  useEffect(() => {
    if (selectedOrderId) {
      const order = draftOrders.find(o => o.id === parseInt(selectedOrderId));
      setSelectedOrderDetails(order);
      setCompletedSteps(prev => ({ ...prev, 1: true }));
    } else {
      setSelectedOrderDetails(null);
      setCompletedSteps(prev => ({ ...prev, 1: false }));
    }
  }, [selectedOrderId, draftOrders]);

  // Update machine details when selected machine changes
  useEffect(() => {
    if (selectedMachineId) {
      const machine = machines.find(m => m.id === parseInt(selectedMachineId));
      setSelectedMachineDetails(machine);
      setCompletedSteps(prev => ({ ...prev, 2: true }));
    } else {
      setSelectedMachineDetails(null);
      setCompletedSteps(prev => ({ ...prev, 2: false }));
    }
  }, [selectedMachineId, machines]);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form for new assignment
  const resetForm = () => {
    setSelectedOrderId('');
    setSelectedMachineId('');
    setSelectedOrderDetails(null);
    setSelectedMachineDetails(null);
    setWorkOrderResult(null);
    setMessage('');
    setSuccess(false);
    setCurrentStep(1);
    setCompletedSteps({ 1: false, 2: false, 3: false });
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedOrderId) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedMachineId) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getMachineStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'operational':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Operational' };
      case 'maintenance':
        return { icon: Settings, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Under Maintenance' };
      case 'breakdown':
        return { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Breakdown' };
      default:
        return { icon: Factory, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', label: 'Available' };
    }
  };

  const steps = [
    { number: 1, title: 'Select Order', icon: ClipboardList, description: 'Choose manufacturing order' },
    { number: 2, title: 'Select Machine', icon: Factory, description: 'Choose machine for production' },
    { number: 3, title: 'Confirm & Create', icon: Check, description: 'Review and create work order' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Work Order Assignment
          </h1>
          <p className="text-gray-400 mt-2">Create work orders by assigning machines to manufacturing orders</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Bar Background */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-800 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps[step.number] || currentStep > step.number;
              
              return (
                <div key={step.number} className="relative flex flex-col items-center z-10">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg shadow-purple-500/25' 
                        : isActive
                          ? 'bg-gray-700 border-2 border-cyan-500'
                          : 'bg-gray-800 border border-gray-700'
                    }`}
                  >
                    {isCompleted && currentStep !== step.number ? (
                      <Check size={20} className="text-white" />
                    ) : (
                      <StepIcon size={20} className={isActive ? 'text-cyan-400' : 'text-gray-500'} />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>
                      Step {step.number}
                    </p>
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-600 hidden sm:block">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 rounded-xl border-l-4 p-4 ${
            success 
              ? 'bg-green-500/10 border-green-500 text-green-400' 
              : 'bg-red-500/10 border-red-500 text-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Manufacturing Order */}
            {currentStep === 1 && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <ClipboardList size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-cyan-300">Select Manufacturing Order</h2>
                    <p className="text-sm text-gray-400">Choose the order you want to assign a machine to</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-gray-800">Select Manufacturing Order</option>
                    {draftOrders.map((order) => (
                      <option key={order.id} value={order.id} className="bg-gray-800">
                        #{order.id} — {order.product} ({parseFloat(order.quantity).toLocaleString()} units)
                      </option>
                    ))}
                  </select>

                  {/* Order Details Preview */}
                  {selectedOrderDetails && (
                    <div className="p-5 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-cyan-500/20">
                      <h3 className="text-sm font-medium text-cyan-400 mb-4 flex items-center gap-2">
                        <Package size={14} />
                        Order Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Product</p>
                          <p className="font-medium text-white mt-1">{selectedOrderDetails.product}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Quantity</p>
                          <p className="font-medium text-white mt-1">{parseFloat(selectedOrderDetails.quantity).toLocaleString()} units</p>
                        </div>
                        {selectedOrderDetails.due_date && (
                          <div>
                            <p className="text-gray-400">Due Date</p>
                            <p className="flex items-center gap-1 mt-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="font-medium">{new Date(selectedOrderDetails.due_date).toLocaleDateString()}</span>
                            </p>
                          </div>
                        )}
                        {selectedOrderDetails.priority && (
                          <div>
                            <p className="text-gray-400">Priority</p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                              selectedOrderDetails.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              selectedOrderDetails.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {selectedOrderDetails.priority.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Select Machine */}
            {currentStep === 2 && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Factory size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-300">Select Machine</h2>
                    <p className="text-sm text-gray-400">Choose the machine for production</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="" className="bg-gray-800">Select Available Machine</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id} className="bg-gray-800">
                        {machine.name} ({machine.code}) — {machine.effective_capacity || machine.capacity_per_day_hours} hrs/day
                      </option>
                    ))}
                  </select>

                  {/* Machine Details Preview */}
                  {selectedMachineDetails && (
                    <div className="p-5 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-purple-500/20">
                      <h3 className="text-sm font-medium text-purple-400 mb-4 flex items-center gap-2">
                        <Settings size={14} />
                        Machine Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Machine Name</p>
                          <p className="font-medium text-white mt-1">{selectedMachineDetails.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Code</p>
                          <p className="font-mono text-cyan-300 mt-1">{selectedMachineDetails.code}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Daily Capacity</p>
                          <p className="flex items-center gap-1 mt-1">
                            <Clock size={14} className="text-gray-400" />
                            <span className="font-medium">{selectedMachineDetails.effective_capacity || selectedMachineDetails.capacity_per_day_hours} hrs</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const statusStyle = getMachineStatusStyle(selectedMachineDetails.maintenance_status);
                              const StatusIcon = statusStyle.icon;
                              return (
                                <>
                                  <StatusIcon size={14} className={statusStyle.color} />
                                  <span className={`capitalize text-sm ${statusStyle.color}`}>
                                    {statusStyle.label}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      {selectedMachineDetails.utilization_percentage !== undefined && (
                        <div className="mt-4 pt-3 border-t border-gray-700">
                          <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>Current Utilization</span>
                            <span className={`font-mono ${
                              selectedMachineDetails.utilization_percentage > 100 ? 'text-red-400' :
                              selectedMachineDetails.utilization_percentage > 80 ? 'text-orange-400' :
                              selectedMachineDetails.utilization_percentage > 50 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {selectedMachineDetails.utilization_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                selectedMachineDetails.utilization_percentage > 100 ? 'bg-red-500' :
                                selectedMachineDetails.utilization_percentage > 80 ? 'bg-orange-500' :
                                selectedMachineDetails.utilization_percentage > 50 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(selectedMachineDetails.utilization_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Confirm & Create */}
            {currentStep === 3 && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <Check size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-300">Confirm Assignment</h2>
                    <p className="text-sm text-gray-400">Review details before creating work order</p>
                  </div>
                </div>

                {/* Review Section */}
                <div className="space-y-6">
                  <div className="p-5 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-xl border border-cyan-500/20">
                    <h3 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                      <ClipboardList size={14} />
                      Manufacturing Order
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Order ID</p>
                        <p className="font-mono text-cyan-300">#{selectedOrderDetails?.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Product</p>
                        <p className="font-medium">{selectedOrderDetails?.product}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Quantity</p>
                        <p>{selectedOrderDetails?.quantity} units</p>
                      </div>
                      {selectedOrderDetails?.due_date && (
                        <div>
                          <p className="text-gray-400">Due Date</p>
                          <p>{new Date(selectedOrderDetails.due_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl border border-purple-500/20">
                    <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                      <Factory size={14} />
                      Machine
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Machine Name</p>
                        <p className="font-medium">{selectedMachineDetails?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Code</p>
                        <p className="font-mono text-purple-300">{selectedMachineDetails?.code}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Daily Capacity</p>
                        <p>{selectedMachineDetails?.effective_capacity || selectedMachineDetails?.capacity_per_day_hours} hrs/day</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <p className="capitalize">{selectedMachineDetails?.maintenance_status || 'Operational'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Information */}
                  <div className="p-5 bg-gray-800/50 rounded-xl border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                      <BarChart3 size={14} />
                      Estimated Production
                    </h3>
                    <p className="text-sm text-gray-500">
                      Estimated load time will be calculated based on order quantity and machine capacity after confirmation.
                    </p>
                  </div>

                  {workOrderResult && (
                    <div className="p-5 bg-green-500/10 rounded-xl border border-green-500/20">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-400" />
                        <div>
                          <p className="font-medium text-green-400">Work Order Created Successfully!</p>
                          {workOrderResult.work_order_id && (
                            <p className="text-sm text-gray-300 mt-1">Work Order ID: #{workOrderResult.work_order_id}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="px-8 py-6 border-t border-gray-800 bg-gray-800/30 flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  currentStep === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                disabled={currentStep === 1}
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={(currentStep === 1 && !selectedOrderId) || (currentStep === 2 && !selectedMachineId)}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    ((currentStep === 1 && !selectedOrderId) || (currentStep === 2 && !selectedMachineId))
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white'
                  }`}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  {assignLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Create Work Order
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Reset Button - Show after success */}
        {workOrderResult && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Wrench size={18} />
              Create Another Work Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineAssignmentForm;