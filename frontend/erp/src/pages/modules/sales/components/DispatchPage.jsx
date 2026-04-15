import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../../services/api";
import { Plus, Trash2, Save, Truck, CheckCircle, Printer, X, Loader2, Search } from "lucide-react";

export default function DispatchPage() {
  const [itemList, setItemList] = useState([]);
  const [dispatchList, setDispatchList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  const [salesOrdersForItem, setSalesOrdersForItem] = useState([]);

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

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentDC, setCurrentDC] = useState(null);
  const [printLoading, setPrintLoading] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setPageLoading(true);
    try {
      const [itemsRes, dispatchRes] = await Promise.all([
        api.get("/inventory/items/"),
        api.get("/inventory/dispatch/")
      ]);
      setItemList(itemsRes.data);
      setDispatchList(dispatchRes.data);
      setFilteredList(dispatchRes.data);
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      setPageLoading(false);
    }
  };

  const refreshDispatchList = async () => {
    try {
      const res = await api.get("/inventory/dispatch/");
      setDispatchList(res.data);
      applyFilters(res.data); // Apply current filters after refresh
    } catch (err) {
      console.error("Failed to refresh dispatch list:", err);
    }
  };

  // Apply filters whenever searchTerm or statusFilter or dispatchList changes
  const applyFilters = (list = dispatchList) => {
    let result = [...list];

    // Status Filter
    if (statusFilter !== "All") {
      result = result.filter(item => 
        item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search Filter (DC Number or Customer Name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        (item.dc_number && item.dc_number.toLowerCase().includes(term)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(term))
      );
    }

    setFilteredList(result);
  };

  // Re-apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [dispatchList, statusFilter, searchTerm]);

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

      setSalesOrdersForItem(soRes.data);
      updatedItems[index].available_stock = parseFloat(stockRes.data.available_stock || 0);
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
      ordered_qty: selectedSO.ordered_qty,
      dispatch_qty: maxDispatch,
    };
    setItems(updatedItems);

    if (index === 0) {
      setForm(prev => ({
        ...prev,
        sales_order: selectedSO.id,
        customer_name: selectedSO.customer_name,
        customer_address: selectedSO.customer_address,
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
    setItems(prev => [
      ...prev,
      { item: "", sales_order: "", so_number: "", ordered_qty: 0, dispatch_qty: 0, available_stock: 0 }
    ]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

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
          dispatch_qty: parseFloat(row.dispatch_qty),
        }))
      };

      await api.post("/inventory/dispatch/", payload);
      alert("Draft Dispatch created successfully!");

      await refreshDispatchList();
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

      await refreshDispatchList();
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
      const dcData = {
        ...res.data,
        dc_date: new Date(res.data.dispatch_date || res.data.dc_date).toLocaleDateString("en-GB"),
        company_name: res.data.organization?.name || "Company",
        company_address: res.data.organization?.address || "",
        company_gstin: res.data.gst_settings?.gstin || "",
        sales_order_number: res.data.sales_order_number || "",
        place_of_supply: res.data.place_of_supply || "Tamil Nadu",
        vehicle_number: res.data.vehicle_number || "",
        transporter_name: res.data.transporter_name || "",
      };
      setCurrentDC(dcData);
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
            th, td { border: 1px solid black; padding: 8px; text-align: center; }
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
    setItems([
      { item: "", sales_order: "", so_number: "", ordered_qty: 0, dispatch_qty: 0, available_stock: 0 }
    ]);
    setSalesOrdersForItem([]);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-300 text-lg font-medium">Loading Dispatch Module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-cyan-300 p-6 font-mono">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Truck className="w-9 h-9 text-cyan-400" />
          <h1 className="text-3xl font-bold">Dispatch (Delivery Challan)</h1>
        </div>
        <button 
          onClick={() => window.history.back()}
          className="bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-cyan-800 rounded-xl py-2 px-5 transition"
        >
          ← Back
        </button>
      </div>

      {/* New Dispatch Form - unchanged */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-10">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-cyan-200">
          <Plus className="text-cyan-400" size={24} /> New Dispatch
        </h2>

        {/* ... (Form fields remain exactly the same as your last code) ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-cyan-400 text-sm mb-1">Customer Name</label>
            <input value={form.customer_name} readOnly className="w-full bg-gray-800 border border-cyan-700 rounded px-4 py-3 text-cyan-200 outline-none" />
          </div>
          <div>
            <label className="block text-cyan-400 text-sm mb-1">Customer GST</label>
            <input value={form.customer_gst} readOnly className="w-full bg-gray-800 border border-cyan-700 rounded px-4 py-3 text-cyan-200 outline-none" />
          </div>
          <div>
            <label className="block text-cyan-400 text-sm mb-1">Vehicle Number</label>
            <input 
              value={form.vehicle_number} 
              onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} 
              className="w-full bg-gray-800 border border-cyan-700 rounded px-4 py-3 text-cyan-200 outline-none focus:border-cyan-400"
              placeholder="TN-45-AB-1234"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-cyan-400 text-sm mb-1">Customer Address</label>
          <textarea value={form.customer_address} readOnly rows={3} className="w-full bg-gray-800 border border-cyan-700 rounded px-4 py-3 text-cyan-200 outline-none resize-y" />
        </div>

        <h3 className="text-lg font-semibold mb-4 text-cyan-200">Items to Dispatch</h3>

        <div className="overflow-x-auto rounded-xl border border-cyan-800 bg-gray-950 mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-cyan-800">
                <th className="p-4 text-left text-cyan-400 font-medium">Item</th>
                <th className="p-4 text-left text-cyan-400 font-medium">Sales Order</th>
                <th className="p-4 text-center text-cyan-400 font-medium">Ordered Qty</th>
                <th className="p-4 text-center text-cyan-400 font-medium">Available Stock</th>
                <th className="p-4 text-center text-cyan-400 font-medium">Dispatch Qty</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900">
              {items.map((row, index) => (
                <tr key={index} className="hover:bg-gray-900/60">
                  <td className="p-4">
                    <select value={row.item} onChange={(e) => handleItemChange(index, e.target.value)} 
                      className="bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-2.5 rounded-lg w-full outline-none focus:border-cyan-400">
                      <option value="">Select Item</option>
                      {itemList.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <select value={row.sales_order} onChange={(e) => handleSalesOrderChange(index, e.target.value)} 
                      disabled={!row.item} className="bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-2.5 rounded-lg w-full outline-none focus:border-cyan-400 disabled:bg-gray-800 disabled:opacity-50">
                      <option value="">Select SO</option>
                      {salesOrdersForItem.map(so => <option key={so.id} value={so.id}>{so.so_number}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    <div className="bg-gray-800 border border-cyan-700 rounded px-4 py-2.5 text-cyan-200 inline-block min-w-[100px]">
                      {row.ordered_qty}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-medium ${row.available_stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {row.available_stock}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <input type="number" value={row.dispatch_qty} onChange={(e) => handleDispatchQtyChange(index, e.target.value)}
                      className="bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-2.5 rounded-lg w-28 text-center outline-none focus:border-cyan-400" />
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => removeRow(index)} className="text-red-400 hover:text-red-500 p-2 transition-colors" disabled={items.length === 1}>
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4">
          <button onClick={addRow} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-cyan-700 text-cyan-300 px-6 py-3 rounded-lg font-medium transition-all">
            <Plus size={20} /> Add Row
          </button>

          <button onClick={handleSubmit} disabled={loading} 
            className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all
              ${loading ? "bg-gray-700 cursor-not-allowed text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Creating Draft...</>
            ) : (
              <><Save size={20} /> Create Draft Dispatch</>
            )}
          </button>
        </div>
      </div>

      {/* Dispatch History with Filters */}
      <div className="bg-gray-900 border border-cyan-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-cyan-800 bg-gray-950">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-cyan-200">Dispatch History</h3>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 text-cyan-500" size={18} />
                <input
                  type="text"
                  placeholder="Search DC or Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border border-cyan-700 pl-10 pr-4 py-2.5 rounded-lg text-cyan-200 w-full sm:w-72 outline-none focus:border-cyan-400"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-800 border border-cyan-700 text-cyan-200 px-4 py-2.5 rounded-lg outline-none focus:border-cyan-400"
              >
                <option value="All">All Status</option>
                <option value="draft">Draft</option>
                <option value="dispatched">Dispatched</option>
              </select>

              <button 
                onClick={refreshDispatchList}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-4 py-2.5 border border-cyan-700 rounded-lg hover:bg-gray-800 transition"
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-cyan-800">
                <th className="p-5 text-left text-cyan-400 font-medium">DC Number</th>
                <th className="p-5 text-left text-cyan-400 font-medium">Customer</th>
                <th className="p-5 text-center text-cyan-400 font-medium">Status</th>
                <th className="p-5 text-center text-cyan-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-cyan-500">
                    No dispatches found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(d => (
                  <tr key={d.id} className="hover:bg-gray-800/70 transition-colors">
                    <td className="p-5 font-medium text-cyan-100">
                      {d.dc_number || `DRAFT-${d.id}`}
                    </td>
                    <td className="p-5 text-cyan-300">{d.customer_name}</td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider
                        ${d.status === 'dispatched' 
                          ? 'bg-green-900 text-green-400 border border-green-700' 
                          : 'bg-yellow-900 text-yellow-400 border border-yellow-700'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex justify-center">
                        {d.status === "draft" ? (
                          <button
                            onClick={() => confirmDispatch(d.id)}
                            disabled={confirmingId === d.id}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            {confirmingId === d.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => printExistingDC(d.id)}
                            disabled={printLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            {printLoading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                            Print DC
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal - Same as before */}
      {showPrintModal && currentDC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="bg-[#0a0f1c] border border-cyan-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-800 bg-[#0a0f1c]">
              <div className="flex items-center gap-3">
                <Printer className="w-7 h-7 text-cyan-400" />
                <h2 className="text-2xl font-semibold text-cyan-200">Delivery Challan Preview</h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={printDC} 
                  disabled={printLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all"
                >
                  {printLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Printer className="w-5 h-5" />}
                  Print Now
                </button>
                <button 
                  onClick={() => setShowPrintModal(false)}
                  className="text-cyan-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-[#0a0f1c]">
              <div id="printable-dc" className="mx-auto bg-white shadow-2xl" style={{ width: "210mm", minHeight: "297mm", padding: "20mm 15mm", fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "1.5", color: "#000" }}>
                {/* Printable content (same as your previous version) */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-[#0B5ED7] mb-1">{currentDC.company_name}</h1>
                  <p className="text-lg text-gray-700">Manufacturing & Supply of Precision Components</p>
                  <div className="h-0.5 bg-[#0B5ED7] w-3/4 mx-auto mt-4"></div>
                </div>

                <div className="flex justify-between mb-8 text-sm">
                  <div>
                    <p><strong>Challan No:</strong> {currentDC.dc_number}</p>
                    <p><strong>Date:</strong> {currentDC.dc_date}</p>
                    <p><strong>Sales Order:</strong> {currentDC.sales_order_number || "-"}</p>
                    <p><strong>Reason:</strong> Sales</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Vehicle:</strong> {currentDC.vehicle_number || "-"}</p>
                    <p><strong>Transporter:</strong> {currentDC.transporter_name || "-"}</p>
                    <p><strong>Place of Supply:</strong> {currentDC.place_of_supply}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="border-2 border-[#0B5ED7] p-5 rounded">
                    <div className="font-bold text-[#0B5ED7] mb-3 text-lg">Consignor</div>
                    <p className="font-semibold">{currentDC.company_name}</p>
                    <p>{currentDC.company_address || "Hosur"}</p>
                    <p>GSTIN: {currentDC.company_gstin}</p>
                  </div>
                  <div className="border-2 border-[#0B5ED7] p-5 rounded">
                    <div className="font-bold text-[#0B5ED7] mb-3 text-lg">Consignee</div>
                    <p className="font-semibold">{currentDC.customer_name}</p>
                    <p>{currentDC.customer_address}</p>
                    <p>GSTIN: {currentDC.customer_gst}</p>
                  </div>
                </div>

                <table className="w-full border-collapse mb-10 text-sm">
                  <thead>
                    <tr className="bg-[#0B5ED7] text-white">
                      <th className="border border-gray-300 p-3">#</th>
                      <th className="border border-gray-300 p-3 text-left">Description</th>
                      <th className="border border-gray-300 p-3">Qty</th>
                      <th className="border border-gray-300 p-3">Rate</th>
                      <th className="border border-gray-300 p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDC.items?.map((item, i) => {
                      const qty = parseFloat(item.dispatch_qty || item.quantity || 0);
                      const rate = parseFloat(item.rate || item.standard_price || 0);
                      const total = qty * rate;
                      return (
                        <tr key={i}>
                          <td className="border border-gray-300 p-3 text-center">{i + 1}</td>
                          <td className="border border-gray-300 p-3">{item.name || item.item_name || item.item?.name}</td>
                          <td className="border border-gray-300 p-3 text-center">{qty} {item.uom}</td>
                          <td className="border border-gray-300 p-3 text-center">₹{rate.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-center font-medium">₹{total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="text-right font-medium">
                  <p>Taxable Value: ₹ {parseFloat(currentDC.total_taxable || 0).toFixed(2)}</p>
                  <p>GST: ₹ {parseFloat(currentDC.total_gst || 0).toFixed(2)}</p>
                  <p className="text-2xl text-[#0B5ED7] mt-3">
                    Grand Total: ₹ {parseFloat(currentDC.grand_total || 0).toFixed(2)}
                  </p>
                </div>

                <div className="mt-16 text-xs">
                  <p>1. Subject to jurisdiction of Tiruchirappalli courts only.</p>
                  <p>2. Goods once sold will not be taken back.</p>
                </div>

                <div className="mt-20 text-right">
                  <p>For {currentDC.company_name}</p>
                  <div className="mt-12 font-bold">Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}