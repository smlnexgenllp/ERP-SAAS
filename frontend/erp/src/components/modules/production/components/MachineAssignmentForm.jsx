// src/pages/production/MachineAssignmentForm.jsx
import React, { useState, useEffect } from 'react';
import { 
  Factory, Settings, CheckCircle, XCircle, Loader2, Calendar, 
  Package, Clock, Wrench, ArrowRight, ArrowLeft, AlertCircle, 
  ChevronRight, Check, ClipboardList 
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

  // Machine Availability
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
      if (machineAvailability && !machineAvailability.is_available) return;
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const getMachineStatusStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'operational': return { color: 'text-emerald-600', label: 'Operational' };
      case 'maintenance': return { color: 'text-amber-600', label: 'Under Maintenance' };
      case 'breakdown': return { color: 'text-red-600', label: 'Breakdown' };
      default: return { color: 'text-zinc-600', label: 'Available' };
    }
  };

  const steps = [
    { number: 1, title: 'Select Order', icon: ClipboardList, description: 'Choose manufacturing order' },
    { number: 2, title: 'Select Machine', icon: Factory, description: 'Choose machine for production' },
    { number: 3, title: 'Confirm & Create', icon: Check, description: 'Review and create work order' }
  ];

  const isMachineBusy = machineAvailability && !machineAvailability.is_available;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
              Work Order Assignment
            </h1>
            <p className="text-zinc-500">Assign machines to manufacturing orders</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-zinc-200 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-zinc-900 rounded-full transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }} 
            />

            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = completedSteps[step.number] || currentStep > step.number;

              return (
                <div key={step.number} className="relative flex flex-col items-center z-10">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-300 border-2
                    ${isCompleted 
                      ? 'bg-emerald-100 border-emerald-600' 
                      : isActive 
                        ? 'bg-white border-zinc-900 shadow' 
                        : 'bg-white border-zinc-200'}`}>
                    {isCompleted && currentStep !== step.number ? (
                      <Check size={24} className="text-emerald-600" />
                    ) : (
                      <StepIcon size={24} className={isActive ? 'text-zinc-900' : 'text-zinc-400'} />
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`}>STEP {step.number}</p>
                    <p className={`font-semibold mt-1 ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>{step.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-8 p-5 rounded-2xl border flex items-start gap-4 ${
            success 
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
              : 'bg-red-100 border-red-200 text-red-700'
          }`}>
            {success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit}>
            
            {/* Step 1: Select Order */}
            {currentStep === 1 && (
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-100 rounded-3xl">
                    <ClipboardList className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900">Select Manufacturing Order</h2>
                    <p className="text-zinc-500">Choose the order you want to assign a machine to</p>
                  </div>
                </div>

                <select 
                  value={selectedOrderId} 
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 text-lg"
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
                  <div className="mt-8 p-8 bg-zinc-50 border border-zinc-100 rounded-3xl">
                    <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                      <Package className="text-zinc-700" /> Order Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                      <div>
                        <p className="text-zinc-500">Product</p>
                        <p className="font-medium text-lg mt-1">{selectedOrderDetails.product}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Quantity</p>
                        <p className="font-medium text-lg mt-1">{parseFloat(selectedOrderDetails.quantity).toLocaleString()} units</p>
                      </div>
                      {selectedOrderDetails.due_date && (
                        <div>
                          <p className="text-zinc-500">Due Date</p>
                          <p className="font-medium mt-1 flex items-center gap-2">
                            <Calendar size={18} className="text-zinc-400" />
                            {new Date(selectedOrderDetails.due_date).toLocaleDateString('en-IN')}
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
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-purple-100 rounded-3xl">
                    <Factory className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900">Select Machine</h2>
                    <p className="text-zinc-500">Choose the machine for this production order</p>
                  </div>
                </div>

                <select 
                  value={selectedMachineId} 
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-zinc-200 rounded-3xl text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 text-lg"
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} ({machine.code}) — {machine.effective_capacity || machine.capacity_per_day_hours} hrs/day
                    </option>
                  ))}
                </select>

                {/* Machine Availability Status */}
                {selectedMachineDetails && (
                  <div className="mt-8">
                    {availabilityLoading ? (
                      <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4">
                        <Loader2 size={24} className="animate-spin text-amber-600" />
                        <p className="text-amber-700 font-medium">Checking machine availability...</p>
                      </div>
                    ) : machineAvailability ? (
                      machineAvailability.is_available ? (
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
                          <CheckCircle size={28} className="text-emerald-600" />
                          <div>
                            <p className="font-semibold text-emerald-700">Machine is Available</p>
                            <p className="text-emerald-600/80 text-sm">No overlapping work orders detected</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl">
                          <div className="flex gap-4">
                            <AlertCircle size={28} className="text-red-600 mt-1" />
                            <div>
                              <p className="font-semibold text-red-700 text-lg">Machine is Currently Busy</p>
                              <p className="text-red-600 mt-2">
                                This machine is occupied until{' '}
                                <span className="font-semibold">
                                  {machineAvailability.running_end_date 
                                    ? new Date(machineAvailability.running_end_date).toLocaleDateString('en-IN') 
                                    : 'unknown date'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    ) : null}
                  </div>
                )}

                {/* Machine Details */}
                {selectedMachineDetails && (
                  <div className="mt-8 p-8 bg-zinc-50 border border-zinc-100 rounded-3xl">
                    <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                      <Settings className="text-zinc-700" /> Machine Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                      <div>
                        <p className="text-zinc-500">Machine Name</p>
                        <p className="font-medium text-lg mt-1">{selectedMachineDetails.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Code</p>
                        <p className="font-mono text-zinc-700 mt-1">{selectedMachineDetails.code}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500">Daily Capacity</p>
                        <p className="font-medium mt-1">
                          {selectedMachineDetails.effective_capacity || selectedMachineDetails.capacity_per_day_hours} hours/day
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 3 && (
              <div className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-emerald-100 rounded-3xl">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-900">Confirm Assignment</h2>
                    <p className="text-zinc-500">Review details before creating the work order</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Order Summary */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-8">
                    <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                      <ClipboardList className="text-zinc-700" /> Manufacturing Order
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-zinc-500 text-sm">Order ID</p>
                        <p className="font-mono font-medium text-lg">#{selectedOrderDetails?.id}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">Product</p>
                        <p className="font-medium text-lg">{selectedOrderDetails?.product}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">Quantity</p>
                        <p className="font-medium text-lg">{selectedOrderDetails?.quantity} units</p>
                      </div>
                    </div>
                  </div>

                  {/* Machine Summary */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-8">
                    <h3 className="font-semibold text-zinc-900 mb-6 flex items-center gap-3">
                      <Factory className="text-zinc-700" /> Selected Machine
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-zinc-500 text-sm">Machine Name</p>
                        <p className="font-medium text-lg">{selectedMachineDetails?.name}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">Code</p>
                        <p className="font-mono text-zinc-700">{selectedMachineDetails?.code}</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">Daily Capacity</p>
                        <p className="font-medium text-lg">
                          {selectedMachineDetails?.effective_capacity || selectedMachineDetails?.capacity_per_day_hours} hours/day
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isMachineBusy && (
                  <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-3xl text-red-700 flex items-start gap-4">
                    <AlertCircle size={28} className="mt-1" />
                    <div>
                      <p className="font-semibold">Machine is Currently Busy</p>
                      <p className="mt-2">
                        This machine is occupied until{' '}
                        <span className="font-semibold">
                          {machineAvailability?.running_end_date 
                            ? new Date(machineAvailability.running_end_date).toLocaleDateString('en-IN') 
                            : 'an unknown date'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="px-10 py-8 border-t border-zinc-100 bg-zinc-50 flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-8 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                  currentStep === 1 
                    ? 'bg-white text-zinc-400 cursor-not-allowed border border-zinc-200' 
                    : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <ArrowLeft size={20} /> Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !selectedOrderId) || 
                    (currentStep === 2 && (!selectedMachineId || isMachineBusy))
                  }
                  className={`px-10 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                    (currentStep === 1 && !selectedOrderId) || 
                    (currentStep === 2 && (!selectedMachineId || isMachineBusy))
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  Next <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult || isMachineBusy}
                  className={`px-10 py-3.5 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                    assignLoading || !selectedOrderId || !selectedMachineId || workOrderResult || isMachineBusy
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {assignLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Creating Work Order...
                    </>
                  ) : (
                    <>
                      <Check size={20} /> Create Work Order
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Reset Button */}
        {workOrderResult && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={resetForm}
              className="flex items-center gap-3 px-10 py-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-3xl text-zinc-700 font-medium transition"
            >
              <Wrench size={20} /> Create Another Work Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineAssignmentForm;