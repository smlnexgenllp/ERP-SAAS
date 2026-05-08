// src/pages/modules/sales/components/DispatchPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../../../../services/api";
import { 
  Plus, Trash2, Save, Truck, CheckCircle, Printer, 
  X, ArrowLeft, AlertCircle 
} from "lucide-react";

export default function DispatchPage() {
  const [itemList, setItemList] = useState([]);
  const [dispatchList, setDispatchList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const [form, setForm] = useState({
    sales_order: "",
    customer_name: "",
    customer_address: "",
    customer_gst: "",
    vehicle_number: "",
    transporter_name: "",
  });

  const [items, setItems] = useState([
    { 
      item: "", 
      sales_order: "", 
      so_number: "", 
      ordered_qty: 0, 
      dispatch_qty: 0, 
      available_stock: 0 
    },
  ]);

  const [salesOrdersForItem, setSalesOrdersForItem] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentDC, setCurrentDC] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch data on mount
  useEffect(() => {
    fetchInitialData();
    fetchDispatches();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await api.get("/inventory/items/");
      setItemList(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchDispatches = async () => {
    try {
      const res = await api.get("/inventory/dispatch/");
      setDispatchList(res.data);
    } catch (err) {
      console.error("Error fetching dispatches:", err);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...dispatchList];

    if (statusFilter !== "All") {
      result = result.filter(item => 
        item.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        (item.dc_number && item.dc_number.toLowerCase().includes(term)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(term))
      );
    }

    setFilteredList(result);
  }, [dispatchList, statusFilter, searchTerm]);

  // ==================== Item Handlers ====================

  const handleItemChange = useCallback(async (index, itemId) => {
    const updatedItems = [...items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      item: itemId, 
      sales_order: "", 
      so_number: "", 
      ordered_qty: 0, 
      dispatch_qty: 0, 
      available_stock: 0 
    };
    setItems(updatedItems);

    if (!itemId) return;

    try {
      const [soRes, stockRes] = await Promise.all([
        api.get(`/inventory/sales-orders/by-item/${itemId}/`),
        api.get(`/inventory/item/${itemId}/department/0/stock/`)
      ]);

      setSalesOrdersForItem(soRes.data || []);
      updatedItems[index].available_stock = parseFloat(stockRes.data?.available_stock || 0);
      setItems([...updatedItems]);
    } catch (err) {
      console.error("Error fetching SO or stock:", err);
    }
  }, [items]);

  const handleSalesOrderChange = useCallback((index, soId) => {
    const selectedSO = salesOrdersForItem.find(so => so.id === parseInt(soId));
    if (!selectedSO) return;

    const updatedItems = [...items];
    const maxDispatch = Math.min(
      selectedSO.pending_qty || 0,
      updatedItems[index].available_stock || 0
    );

    updatedItems[index] = {
      ...updatedItems[index],
      sales_order: selectedSO.id,
      so_number: selectedSO.so_number,
      ordered_qty: selectedSO.ordered_qty || 0,
      dispatch_qty: maxDispatch,
    };
    setItems(updatedItems);

    if (index === 0) {
      setForm(prev => ({
        ...prev,
        sales_order: selectedSO.id,
        customer_name: selectedSO.customer_name || "",
        customer_address: selectedSO.customer_address || "",
        customer_gst: selectedSO.customer_gst || "",
      }));
    }
  }, [salesOrdersForItem, items]);

  const handleDispatchQtyChange = useCallback((index, value) => {
    const numValue = parseFloat(value) || 0;
    const maxAllowed = Math.min(
      items[index].ordered_qty || 0,
      items[index].available_stock || 0
    );

    const updatedItems = [...items];
    updatedItems[index].dispatch_qty = Math.min(numValue, maxAllowed);
    setItems(updatedItems);
  }, [items]);

  const addRow = () => {
    setItems(prev => [...prev, { 
      item: "", 
      sales_order: "", 
      so_number: "", 
      ordered_qty: 0, 
      dispatch_qty: 0, 
      available_stock: 0 
    }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // ==================== Submit & Actions ====================

  const handleSubmit = async () => {
    if (!form.customer_name || items.some(row => !row.item || row.dispatch_qty <= 0)) {
      alert("Please fill all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...form, 
        items: items.map(row => ({
          item: parseInt(row.item),
          ordered_qty: parseFloat(row.ordered_qty),
          dispatch_qty: parseFloat(row.dispatch_qty)
        }))
      };

      await api.post("/inventory/dispatch/", payload);
      alert("Draft Dispatch created successfully!");

      await fetchDispatches();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create dispatch");
    } finally {
      setLoading(false);
    }
  };

  const confirmDispatch = async (id) => {
    if (!window.confirm("Confirm this dispatch? Stock will be deducted from inventory.")) return;
    
    setConfirmingId(id);
    try {
      const res = await api.post(`/inventory/dispatch/${id}/confirm_dispatch/`);
      alert(res.data.message || "Dispatch confirmed successfully!");

      if (res.data.dc_data) {
        setCurrentDC(res.data.dc_data);
        setShowPrintModal(true);
      }
      await fetchDispatches();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm dispatch.");
    } finally {
      setConfirmingId(null);
    }
  };

  const printExistingDC = async (dispatchId) => {
    setPrintLoading(true);
    try {
      const res = await api.get(`/inventory/dispatch/${dispatchId}/`);
      setCurrentDC({
        dc_number: res.data.dc_number,
        dc_date: new Date(res.data.dispatch_date).toLocaleDateString("en-GB"),
        company_name: res.data.organization?.name || "Company",
        company_address: res.data.organization?.address || "",
        company_gstin: res.data.gst_settings?.gstin || "",
        customer_name: res.data.customer_name,
        customer_address: res.data.customer_address,
        customer_gst: res.data.customer_gst || "",
        vehicle_number: res.data.vehicle_number || "",
        transporter_name: res.data.transporter_name || "",
        items: res.data.items || [],
        ...res.data
      });
      setShowPrintModal(true);
    } catch (err) {
      alert("Failed to load DC for printing");
    } finally {
      setPrintLoading(false);
    }
  };

  const printDC = () => {
    const printContent = document.getElementById("printable-dc");
    if (!printContent) return;

    const newWindow = window.open("", "", "width=1000,height=800");
    newWindow.document.write(`
      <html>
        <head>
          <title>Delivery Challan</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            .header { border-bottom: 4px solid #0B5ED7; padding-bottom: 15px; margin-bottom: 20px; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    newWindow.document.close();
    setTimeout(() => {
      newWindow.focus();
      newWindow.print();
      setTimeout(() => newWindow.close(), 500);
    }, 500);
  };

  const resetForm = () => {
    setForm({
      sales_order: "",
      customer_name: "",
      customer_address: "",
      customer_gst: "",
      vehicle_number: "",
      transporter_name: "",
    });
    setItems([{
      item: "", 
      sales_order: "", 
      so_number: "", 
      ordered_qty: 0, 
      dispatch_qty: 0, 
      available_stock: 0 
    }]);
    setSalesOrdersForItem([]);
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-600 hover:text-zinc-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-3xl flex items-center justify-center shadow">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
                  Dispatch Management
                </h1>
                <p className="text-zinc-500">Create and track Delivery Challans</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Dispatch Form */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-10 mb-10">
          <h3 className="text-2xl font-semibold text-zinc-900 mb-8 flex items-center gap-3">
            <Plus className="text-zinc-700" size={28} /> 
            New Dispatch (Delivery Challan)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Customer Name</label>
              <input 
                value={form.customer_name} 
                readOnly 
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Customer GST</label>
              <input 
                value={form.customer_gst} 
                readOnly 
                className="w-full px-5 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-2">Vehicle Number</label>
              <input 
                value={form.vehicle_number} 
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} 
                className="w-full px-5 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
                placeholder="TN 07 AB 1234"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-zinc-600 mb-2">Customer Address</label>
            <textarea 
              value={form.customer_address} 
              readOnly 
              rows={3}
              className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-3xl text-zinc-500 resize-y"
            />
          </div>

          <h4 className="text-lg font-semibold text-zinc-900 mb-4">Items to Dispatch</h4>

          <div className="border border-zinc-200 rounded-3xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-zinc-600">Item</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-zinc-600">Sales Order</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold text-zinc-600">Ordered Qty</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold text-zinc-600">Available Stock</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold text-zinc-600">Dispatch Qty</th>
                    <th className="px-6 py-5 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((row, index) => (
                    <tr key={index} className="hover:bg-zinc-50">
                      <td className="px-6 py-5">
                        <select 
                          value={row.item} 
                          onChange={(e) => handleItemChange(index, e.target.value)} 
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
                        >
                          <option value="">Select Item</option>
                          {itemList.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <select 
                          value={row.sales_order} 
                          onChange={(e) => handleSalesOrderChange(index, e.target.value)} 
                          disabled={!row.item}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 disabled:bg-zinc-100"
                        >
                          <option value="">Select SO</option>
                          {salesOrdersForItem.map(so => (
                            <option key={so.id} value={so.id}>{so.so_number}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <input 
                          type="number" 
                          value={row.ordered_qty} 
                          readOnly 
                          className="w-28 mx-auto block bg-zinc-50 border border-zinc-200 rounded-2xl py-3 text-center" 
                        />
                      </td>
                      <td className="px-6 py-5 text-center font-semibold">
                        <span className={row.available_stock > 0 ? "text-emerald-600" : "text-red-600"}>
                          {row.available_stock}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <input
                          type="number"
                          value={row.dispatch_qty}
                          onChange={(e) => handleDispatchQtyChange(index, e.target.value)}
                          className="w-28 mx-auto block bg-white border border-zinc-200 rounded-2xl py-3 text-center focus:outline-none focus:border-zinc-400"
                        />
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => removeRow(index)} 
                          className="text-red-500 hover:text-red-600 transition p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={addRow} 
              className="flex items-center gap-3 px-8 py-3.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl text-zinc-700 hover:text-zinc-900 transition font-medium"
            >
              <Plus size={20} /> Add Row
            </button>

            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className={`flex items-center gap-3 px-10 py-3.5 rounded-2xl font-medium transition ${
                loading 
                  ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" 
                  : "bg-zinc-900 hover:bg-zinc-800 text-white"
              }`}
            >
              <Save size={20} />
              {loading ? "Creating Draft..." : "Create Draft Dispatch"}
            </button>
          </div>
        </div>

        {/* Dispatch History */}
        <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 bg-zinc-50 border-b flex flex-col md:flex-row gap-4 justify-between items-center">
            <h3 className="text-2xl font-semibold text-zinc-900">Dispatch History</h3>
            
            <div className="flex gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search DC or Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-5 py-3 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400 w-full md:w-80"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-5 py-3 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-400"
              >
                <option value="All">All Status</option>
                <option value="draft">Draft</option>
                <option value="dispatched">Dispatched</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">DC Number</th>
                  <th className="px-8 py-5 text-left text-sm font-semibold text-zinc-600">Customer</th>
                  <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Status</th>
                  <th className="px-8 py-5 text-center text-sm font-semibold text-zinc-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredList.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-6 font-medium text-zinc-900">
                      {d.dc_number || `DRAFT-${d.id}`}
                    </td>
                    <td className="px-8 py-6 text-zinc-700">{d.customer_name}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-5 py-2 rounded-2xl text-xs font-medium ${
                        d.status === 'dispatched' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {d.status === "draft" ? (
                        <button
                          onClick={() => confirmDispatch(d.id)}
                          disabled={confirmingId === d.id}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition disabled:opacity-70 mx-auto"
                        >
                          <CheckCircle size={18} />
                          Confirm Dispatch
                        </button>
                      ) : (
                        <button
                          onClick={() => printExistingDC(d.id)}
                          disabled={printLoading}
                          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-2xl text-sm font-medium transition mx-auto"
                        >
                          <Printer size={18} />
                          Print DC
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintModal && currentDC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b flex justify-between items-center bg-zinc-50 rounded-t-3xl">
              <h3 className="font-semibold text-xl text-zinc-900 flex items-center gap-3">
                <Printer className="text-zinc-700" /> Delivery Challan Preview
              </h3>
              <div className="flex gap-3">
                <button 
                  onClick={printDC} 
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3 rounded-2xl font-medium transition"
                >
                  <Printer size={20} /> Print Now
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)} 
                  className="p-3 hover:bg-zinc-100 rounded-2xl transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto bg-zinc-100 flex-1">
              <div 
                id="printable-dc"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  margin: "0 auto",
                  padding: "15mm",
                  background: "#fff",
                  boxShadow: "0 0 15px rgba(0,0,0,0.1)",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "13px",
                }}
              >
                {/* Add your full printable DC layout here */}
                <div className="header">
                  <h1 style={{ margin: 0, color: "#0B5ED7", fontSize: "28px" }}>
                    {currentDC.company_name}
                  </h1>
                  <p>Delivery Challan</p>
                </div>

                <p><strong>DC Number:</strong> {currentDC.dc_number}</p>
                <p><strong>Date:</strong> {currentDC.dc_date}</p>
                <p><strong>Customer:</strong> {currentDC.customer_name}</p>
                {/* Add more fields as per your requirement */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}