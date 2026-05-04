// src/pages/production/WorkOrdersList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Printer, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Package, 
  Calendar, 
  Factory, 
  ClipboardList, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import api from '../../../../services/api';

const WorkOrdersList = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  // Fetch work orders based on tab
  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/production/work-orders/?status=${activeTab}`);
      setWorkOrders(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [activeTab]);

  // Approve / Reject
  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this work order?`)) return;

    try {
      await api.patch(`/production/work-orders/${id}/`, { status: action });
      setMessage(`Work Order #${id} ${action}d successfully`);
      fetchWorkOrders();
    } catch (err) {
      setMessage('Action failed. Please try again.');
    }
  };

  const openPrintModal = (wo) => {
    setSelectedWorkOrder(wo);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Work Order #${selectedWorkOrder?.id}</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; }
            .signature { margin-top: 60px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="font-size: 28px;">WORK ORDER</h1>
            <p style="font-size: 18px; color: #333;">ERP Production System</p>
          </div>

          <table>
            <tr><th>Work Order ID</th><td>#${selectedWorkOrder?.id}</td></tr>
            <tr><th>Item / Product</th><td>${selectedWorkOrder?.product || selectedWorkOrder?.item_name || '—'}</td></tr>
            <tr><th>Machine Name</th><td>${selectedWorkOrder?.machine_name || '—'}</td></tr>
            <tr><th>Start Date</th><td>${selectedWorkOrder?.start_date || '—'}</td></tr>
            <tr><th>End Date</th><td>${selectedWorkOrder?.end_date || '—'}</td></tr>
            <tr><th>Sales Order ID</th><td>#${selectedWorkOrder?.sales_order_id || '—'}</td></tr>
            <tr><th>Quantity</th><td>${selectedWorkOrder?.quantity} Units</td></tr>
            <tr><th>Assigned Department</th><td>${selectedWorkOrder?.department || '—'}</td></tr>
          </table>

          <div class="signature">
            <div>
              <p><strong>Issued By</strong></p>
              <p style="margin-top: 50px; border-top: 2px solid #000; width: 220px;">Signature & Date</p>
              <p>Production Manager</p>
            </div>
            <div>
              <p><strong>Received By</strong></p>
              <p style="margin-top: 50px; border-top: 2px solid #000; width: 220px;">Signature & Date</p>
              <p>Department In-Charge</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate('/manufacturing/dashboard')}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Work Orders
                </h1>
                <p className="text-zinc-500">Manage and track all work orders</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-2 mb-8 inline-flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-8 py-3 text-lg font-medium rounded-3xl transition-all ${
              activeTab === 'pending'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Pending Work Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-8 py-3 text-lg font-medium rounded-3xl transition-all ${
              activeTab === 'completed'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Completed Work Orders
          </button>
        </div>

        {message && (
          <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 ${
            message.includes('successfully') 
              ? 'bg-emerald-100 border-emerald-200 text-emerald-700' 
              : 'bg-red-100 border-red-200 text-red-700'
          }`}>
            <AlertCircle size={24} />
            <p className="font-medium">{message}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-zinc-400" size={48} />
              <p className="text-zinc-600 mt-6 text-lg font-medium">Loading work orders...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">WO ID</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Item</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Machine</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Start Date</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">End Date</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Sales Order</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Qty</th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Department</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Status</th>
                    <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {workOrders.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <AlertCircle className="w-16 h-16 text-zinc-300 mb-6" />
                          <p className="text-xl font-medium text-zinc-600">No work orders found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => (
                      <tr key={wo.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 font-mono font-medium text-zinc-900">#{wo.id}</td>
                        <td className="px-8 py-6 font-medium text-zinc-900">
                          {wo.product || wo.item_name || '—'}
                        </td>
                        <td className="px-8 py-6 text-zinc-700">{wo.machine_name || '—'}</td>
                        <td className="px-8 py-6 text-center text-zinc-600">{wo.start_date || '—'}</td>
                        <td className="px-8 py-6 text-center text-zinc-600">{wo.end_date || '—'}</td>
                        <td className="px-8 py-6 text-center font-mono text-zinc-500">#{wo.sales_order_id || '—'}</td>
                        <td className="px-8 py-6 text-center font-semibold text-zinc-900">{wo.quantity}</td>
                        <td className="px-8 py-6 text-zinc-700">{wo.department || '—'}</td>
                        <td className="px-8 py-6 text-center">
                          <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                            wo.status === 'completed' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {wo.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex gap-3 justify-center">
                            {activeTab === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleAction(wo.id, 'approved')}
                                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                                >
                                  <CheckCircle size={18} /> Approve
                                </button>
                                <button
                                  onClick={() => handleAction(wo.id, 'rejected')}
                                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                                >
                                  <XCircle size={18} /> Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openPrintModal(wo)}
                              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition"
                            >
                              <Printer size={18} /> Print
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
      </div>

      {/* Print Modal */}
      {showPrintModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-zinc-900">Work Order Preview</h2>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-2"
              >
                <X size={28} />
              </button>
            </div>

            <div id="print-area" className="p-10 overflow-y-auto flex-1 bg-zinc-50">
              <div className="bg-white text-black p-10 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="text-center mb-10 border-b-4 border-black pb-6">
                  <h1 className="text-5xl font-bold tracking-widest">WORK ORDER</h1>
                  <p className="text-xl text-zinc-600 mt-2">ERP Production System</p>
                </div>

                <table className="w-full border border-black text-lg">
                  <tbody>
                    <tr className="border-b"><td className="p-5 font-semibold w-1/3">Work Order ID</td><td className="p-5">#{selectedWorkOrder.id}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">Item / Product</td><td className="p-5">{selectedWorkOrder.product || selectedWorkOrder.item_name || '—'}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">Machine Name</td><td className="p-5">{selectedWorkOrder.machine_name || '—'}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">Start Date</td><td className="p-5">{selectedWorkOrder.start_date || '—'}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">End Date</td><td className="p-5">{selectedWorkOrder.end_date || '—'}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">Sales Order ID</td><td className="p-5">#{selectedWorkOrder.sales_order_id || '—'}</td></tr>
                    <tr className="border-b"><td className="p-5 font-semibold">Quantity</td><td className="p-5 font-bold">{selectedWorkOrder.quantity} Units</td></tr>
                    <tr><td className="p-5 font-semibold">Assigned Department</td><td className="p-5">{selectedWorkOrder.department || '—'}</td></tr>
                  </tbody>
                </table>

                <div className="mt-20 flex justify-between text-lg">
                  <div>
                    <p className="font-semibold">Issued By</p>
                    <div className="mt-16 border-t-2 border-black w-72"></div>
                    <p className="mt-2">Production Manager</p>
                  </div>
                  <div>
                    <p className="font-semibold">Received By</p>
                    <div className="mt-16 border-t-2 border-black w-72"></div>
                    <p className="mt-2">Department In-Charge</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex gap-4 border-t border-zinc-100">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-4 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-medium text-zinc-700"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-medium flex items-center justify-center gap-3"
              >
                <Printer size={22} /> Print Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersList;