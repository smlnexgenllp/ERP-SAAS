// src/pages/production/MachineAssignmentForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Factory, Settings, CheckCircle, XCircle, Loader2, Calendar, 
  Package, Clock, Wrench, ArrowRight, ArrowLeft, AlertCircle, 
  ChevronRight, Check, BarChart3, ClipboardList 
} from 'lucide-react';
import api from '../../../../services/api';

const MachineAssignmentForm = () => {
  // Wizard steps
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

  // New: Machine Availability
  const [machineAvailability, setMachineAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // Fetch initial data
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

  // Check machine availability
  const checkMachineAvailability = async (machineId, orderId) => {
    if (!machineId) {
      setMachineAvailability(null);
      return;
    }

    setAvailabilityLoading(true);
    setMachineAvailability(null);

    try {
      const res = await api.get('/production/machine-availability/', {
        params: { 
          machine_id: machineId, 
          manufacturing_order_id: orderId || '' 
        }
      });
      setMachineAvailability(res.data);
    } catch (err) {
      console.error(err);
      setMachineAvailability({ 
        is_available: false, 
        error: 'Failed to check availability' 
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrderId || !selectedMachineId) {
      setMessage('Please select both Manufacturing Order and Machine');
      setSuccess(false);
      return;
    }

    // Extra safety: Don't allow if machine is busy
    if (machineAvailability && !machineAvailability.is_available) {
      setMessage('Cannot create Work Order. Selected machine is currently busy.');
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
      setCompletedSteps(prev => ({ ...prev, 3: true }));
    } catch (error) {
      setSuccess(false);
      setMessage(error.response?.data?.message || 'Failed to create Work Order. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Update order details
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

  // Update machine details + check availability
  useEffect(() => {
    if (selectedMachineId) {
      const machine = machines.find(m => m.id === parseInt(selectedMachineId));
      setSelectedMachineDetails(machine);
      setCompletedSteps(prev => ({ ...prev, 2: true }));

      // Check availability when machine is selected
      checkMachineAvailability(selectedMachineId, selectedOrderId);
    } else {
      setSelectedMachineDetails(null);
      setMachineAvailability(null);
      setCompletedSteps(prev => ({ ...prev, 2: false }));
    }
  }, [selectedMachineId, selectedOrderId, machines]);

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setSelectedOrderId('');
    setSelectedMachineId('');
    setSelectedOrderDetails(null);
    setSelectedMachineDetails(null);
    setMachineAvailability(null);
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
      // Only allow going to step 3 if machine is available
      if (machineAvailability && !machineAvailability.is_available) {
        return;
      }
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
      case 'operational': return { icon: CheckCircle, color: 'text-green-400', label: 'Operational' };
      case 'maintenance': return { icon: Settings, color: 'text-yellow-400', label: 'Under Maintenance' };
      case 'breakdown': return { icon: XCircle, color: 'text-red-400', label: 'Breakdown' };
      default: return { icon: Factory, color: 'text-gray-400', label: 'Available' };
    }
  };

  const steps = [
    { number: 1, title: 'Select Order', icon: ClipboardList, description: 'Choose manufacturing order' },
    { number: 2, title: 'Select Machine', icon: Factory, description: 'Choose machine for production' },
    { number: 3, title: 'Confirm & Create', icon: Check, description: 'Review and create work order' }
  ];

  const isMachineBusy = machineAvailability && !machineAvailability.is_available;

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

        {/* Step Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-800 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }} 
              />
            </div>

            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps[step.number] || currentStep > step.number;

              return (
                <div key={step.number} className="relative flex flex-col items-center z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 
                    ${isCompleted ? 'bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg shadow-purple-500/25' : 
                      isActive ? 'bg-gray-700 border-2 border-cyan-500' : 'bg-gray-800 border border-gray-700'}`}>
                    {isCompleted && currentStep !== step.number ? (
                      <Check size={20} className="text-white" />
                    ) : (
                      <StepIcon size={20} className={isActive ? 'text-cyan-400' : 'text-gray-500'} />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>Step {step.number}</p>
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{step.title}</p>
                    <p className="text-xs text-gray-600 hidden sm:block">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 rounded-xl border-l-4 p-4 ${success ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
            <div className="flex items-center gap-3">
              {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium">{message}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900/70 rounded-2xl border border-gray-800 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Order */}
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

                <select 
                  value={selectedOrderId} 
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">Select Manufacturing Order</option>
                  {draftOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.id} — {order.product} ({parseFloat(order.quantity).toLocaleString()} units)
                    </option>
                  ))}
                </select>

                {selectedOrderDetails && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-cyan-500/20">
                    <h3 className="text-sm font-medium text-cyan-400 mb-4 flex items-center gap-2">
                      <Package size={14} /> Order Details
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
                    </div>
                  </div>
                )}
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
                    <p className="text-sm text-gray-400">Choose machine for production</p>
                  </div>
                </div>

                <select 
                  value={selectedMachineId} 
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Available Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} ({machine.code}) — {machine.effective_capacity || machine.capacity_per_day_hours} hrs/day
                    </option>
                  ))}
                </select>

                {/* Availability Status */}
                {selectedMachineDetails && (
                  <div className="mt-6">
                    {availabilityLoading ? (
                      <div className="flex items-center gap-2 text-yellow-400 p-4 bg-gray-800 rounded-xl">
                        <Loader2 size={18} className="animate-spin" />
                        Checking machine availability...
                      </div>
                    ) : machineAvailability ? (
                      machineAvailability.is_available ? (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
                          <CheckCircle size={20} />
                          <div>
                            <p className="font-medium">Machine is available</p>
                            <p className="text-sm text-green-300/80">No overlapping work orders detected</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <div className="flex items-start gap-3 text-red-400">
                            <AlertCircle size={22} className="mt-0.5" />
                            <div>
                              <p className="font-semibold text-lg">MACHINE IS BUSY</p>
                              <p className="text-sm mt-1">
                                This machine is currently occupied until{' '}
                                <span className="font-mono font-bold text-red-300">
                                  {machineAvailability.running_end_date 
                                    ? new Date(machineAvailability.running_end_date).toLocaleDateString('en-IN', { 
                                        year: 'numeric', month: 'short', day: 'numeric' 
                                      }) 
                                    : 'unknown date'}
                                </span>
                              </p>
                              {machineAvailability.current_work_order_id && (
                                <p className="text-xs text-gray-400 mt-2">
                                  Current Work Order: #{machineAvailability.current_work_order_id} 
                                  ({machineAvailability.status})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>
                )}

                {/* Machine Details */}
                {selectedMachineDetails && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-purple-500/20">
                    <h3 className="text-sm font-medium text-purple-400 mb-4 flex items-center gap-2">
                      <Settings size={14} /> Machine Details
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
                          <span className="font-medium">
                            {selectedMachineDetails.effective_capacity || selectedMachineDetails.capacity_per_day_hours} hrs
                          </span>
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
                                <span className={`capitalize ${statusStyle.color}`}>{statusStyle.label}</span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

                <div className="space-y-6">
                  {/* Order Review */}
                  <div className="p-5 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-xl border border-cyan-500/20">
                    <h3 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                      <ClipboardList size={14} /> Manufacturing Order
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
                    </div>
                  </div>

                  {/* Machine Review */}
                  <div className="p-5 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl border border-purple-500/20">
                    <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                      <Factory size={14} /> Machine
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
                    </div>
                  </div>

                  {/* Busy Warning in Step 3 */}
                  {isMachineBusy && (
                    <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl text-red-400">
                      <AlertCircle size={20} className="inline mr-2" />
                      This machine is busy until {machineAvailability.running_end_date 
                        ? new Date(machineAvailability.running_end_date).toLocaleDateString() 
                        : 'an unknown date'}. 
                      Please choose another machine.
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
                disabled={currentStep === 1}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 
                  ${currentStep === 1 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
              >
                <ArrowLeft size={18} /> Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !selectedOrderId) || 
                    (currentStep === 2 && (!selectedMachineId || isMachineBusy))
                  }
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 
                    ${((currentStep === 1 && !selectedOrderId) || (currentStep === 2 && (!selectedMachineId || isMachineBusy))) 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white'}`}
                >
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult || isMachineBusy}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 
                    ${assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult || isMachineBusy 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'}`}
                >
                  {assignLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> Create Work Order
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Reset Button */}
        {workOrderResult && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <Wrench size={18} /> Create Another Work Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineAssignmentForm;