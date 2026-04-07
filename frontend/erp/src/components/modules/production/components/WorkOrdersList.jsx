// src/pages/production/WorkOrdersList.jsx
import React, { useState, useEffect } from 'react';
import { 
  Printer, CheckCircle, XCircle, Loader2, Package, 
  Calendar, Factory, ClipboardList, AlertCircle 
} from 'lucide-react';
import api from '../../../../services/api';

const WorkOrdersList = () => {
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">Work Orders</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-8 py-4 text-lg font-medium transition-all ${
              activeTab === 'pending'
                ? 'border-b-4 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Pending Work Orders
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-8 py-4 text-lg font-medium transition-all ${
              activeTab === 'completed'
                ? 'border-b-4 border-cyan-400 text-cyan-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Completed Work Orders
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500 text-green-400">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-cyan-400" size={40} />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-5 text-left">WO ID</th>
                  <th className="p-5 text-left">Item</th>
                  <th className="p-5 text-left">Machine</th>
                  <th className="p-5 text-center">Start Date</th>
                  <th className="p-5 text-center">End Date</th>
                  <th className="p-5 text-center">Sales Order</th>
                  <th className="p-5 text-center">Qty</th>
                  <th className="p-5 text-left">Department</th>
                  <th className="p-5 text-center">Status</th>
                  <th className="p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-12 text-center text-gray-400">
                      No work orders found
                    </td>
                  </tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-gray-800/50">
                      <td className="p-5 font-mono">#{wo.id}</td>
                      <td className="p-5 font-medium">{wo.product || wo.item_name}</td>
                      <td className="p-5">{wo.machine_name || '—'}</td>
                      <td className="p-5 text-center">{wo.start_date || '—'}</td>
                      <td className="p-5 text-center">{wo.end_date || '—'}</td>
                      <td className="p-5 text-center font-mono">#{wo.sales_order_id || '—'}</td>
                      <td className="p-5 text-center font-semibold">{wo.quantity}</td>
                      <td className="p-5">{wo.department || '—'}</td>
                      <td className="p-5 text-center">
                        <span className={`px-4 py-1 rounded-full text-sm ${
                          wo.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {wo.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex gap-2 justify-center">
                          {activeTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(wo.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                              >
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button
                                onClick={() => handleAction(wo.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openPrintModal(wo)}
                            className="bg-cyan-600 hover:bg-cyan-700 px-5 py-2 rounded-lg text-sm flex items-center gap-2"
                          >
                            <Printer size={16} /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPrintModal && selectedWorkOrder && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black w-full max-w-5xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b flex justify-between items-center">
              <h2 className="text-3xl font-bold">WORK ORDER PREVIEW</h2>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-3xl text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Printable Content */}
            <div id="print-area" className="p-10">
              <div className="text-center mb-10 border-b-4 border-black pb-6">
                <h1 className="text-5xl font-bold tracking-widest">WORK ORDER</h1>
                <p className="text-xl text-gray-600 mt-2">ERP Production System</p>
              </div>

              <table className="w-full border border-black text-lg">
                <tbody>
                  <tr className="border-b"><td className="p-5 font-semibold w-1/3">Work Order ID</td><td className="p-5">#{selectedWorkOrder.id}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">Item Name</td><td className="p-5">{selectedWorkOrder.product || selectedWorkOrder.item_name}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">Machine Name</td><td className="p-5">{selectedWorkOrder.machine_name}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">Start Date</td><td className="p-5">{selectedWorkOrder.start_date}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">End Date</td><td className="p-5">{selectedWorkOrder.end_date}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">Sales Order ID</td><td className="p-5">#{selectedWorkOrder.sales_order_id}</td></tr>
                  <tr className="border-b"><td className="p-5 font-semibold">Quantity</td><td className="p-5 font-bold">{selectedWorkOrder.quantity} Units</td></tr>
                  <tr><td className="p-5 font-semibold">Assigned Department</td><td className="p-5">{selectedWorkOrder.department}</td></tr>
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

            {/* Action Buttons */}
            <div className="p-8 flex gap-4 border-t">
              <button
                onClick={handlePrint}
                className="flex-1 bg-black text-white py-5 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-gray-800"
              >
                <Printer size={24} /> PRINT WORK ORDER (Landscape)
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 bg-gray-300 text-black py-5 rounded-2xl font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersList;